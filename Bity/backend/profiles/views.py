import random
import string
from decimal import Decimal

from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q

from .models import (
    CustomUser, OTPCode, Wallet, Transaction, PointAccount,
    SavedAddress, Notification, ServiceProviderProfile, ScoreEvent,
    Order, Bid, Escrow, Message,
)
from .serializers import (
    UserSerializer, UserUpdateSerializer,
    TransactionSerializer, SavedAddressSerializer, NotificationSerializer,
    ProviderSummarySerializer, OrderSerializer, BidSerializer,
    ProviderProfileSerializer, ProviderOnboardingSerializer, AvailableOrderSerializer, MyOrderSerializer, ScoreEventSerializer,
    MessageSerializer,
)


def _get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


def _ensure_related(user):
    Wallet.objects.get_or_create(user=user)
    PointAccount.objects.get_or_create(user=user)


def _complete_order_payment(order):
    """
    Release escrow, pay provider (minus Bity fee), update scores.
    Safe to call multiple times — checks escrow_held first.
    """
    if not order.escrow_held:
        return

    provider = order.provider
    fee = order.bity_fee_provider

    # Pay provider: agreed_price - bity_fee_provider
    if provider:
        net = order.agreed_price - fee
        provider_wallet, _ = Wallet.objects.get_or_create(user=provider)
        provider_wallet.balance += net
        provider_wallet.save()

        Transaction.objects.create(
            user=provider, type='SALARY', amount=net,
            description=f'أرباح طلب #{order.order_number}', status='COMPLETED',
        )
        Transaction.objects.create(
            user=provider, type='BITY_FEE', amount=-fee,
            description=f'رسوم بيتي — طلب #{order.order_number}', status='COMPLETED',
        )

        # Score +3 for completion, +2 for on-time (simplified)
        try:
            profile = provider.provider_profile
            profile.score = min(100, profile.score + 3)
            profile.total_orders += 1
            profile.completed_orders += 1
            profile.recalculate_tier()
            profile.save()
        except ServiceProviderProfile.DoesNotExist:
            pass

        ScoreEvent.objects.create(
            provider=provider,
            reason='إنجاز طلب بنجاح',
            change=3,
        )

    # Release customer hold
    customer_wallet, _ = Wallet.objects.get_or_create(user=order.customer)
    customer_wallet.hold -= order.escrow_amount
    customer_wallet.save()

    Transaction.objects.create(
        user=order.customer, type='RELEASE', amount=order.escrow_amount,
        description=f'إتمام طلب #{order.order_number}', status='COMPLETED',
    )

    # Mark escrow released
    try:
        escrow = order.escrow
        escrow.status = 'released'
        escrow.save()
    except Escrow.DoesNotExist:
        pass

    order.escrow_held = False
    order.status = 'COMPLETED'
    order.save()

    # Notify provider that payment has been released
    if provider:
        net = order.agreed_price - fee
        Notification.objects.create(
            user=provider,
            title='💰 تم استلام الدفع!',
            body=f'تم إضافة {net} ج.م إلى محفظتك مقابل طلب #{order.order_number}.',
            type='PAYMENT',
        )

    # Loyalty points for customer
    points, _ = PointAccount.objects.get_or_create(user=order.customer)
    points.total_points += 50
    points.save()


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class SendOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        phone = request.data.get('phone', '').strip()
        if not phone:
            return Response({'error': 'Phone number required'}, status=status.HTTP_400_BAD_REQUEST)
        otp = OTPCode.generate_for(phone)
        return Response({'success': True, 'message': 'OTP sent', '_dev_otp': otp.code})


class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        phone = request.data.get('phone', '').strip()
        code  = request.data.get('otp', '').strip()
        role  = request.data.get('role', 'CUSTOMER').upper()

        if not phone or not code:
            return Response({'error': 'Phone and OTP required'}, status=status.HTTP_400_BAD_REQUEST)

        if role not in ('CUSTOMER', 'PROVIDER'):
            role = 'CUSTOMER'

        try:
            otp_obj = OTPCode.objects.filter(
                phone_number=phone, code=code, is_used=False
            ).latest('created_at')
        except OTPCode.DoesNotExist:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)

        if not otp_obj.is_valid():
            return Response({'error': 'OTP expired'}, status=status.HTTP_400_BAD_REQUEST)

        otp_obj.is_used = True
        otp_obj.save()

        is_new_user = not CustomUser.objects.filter(phone_number=phone).exists()
        user, _ = CustomUser.objects.get_or_create(
            phone_number=phone,
            defaults={'username': phone, 'role': role},
        )

        # Upgrade role to PROVIDER if requested and user is new
        if is_new_user and role == 'PROVIDER':
            user.role = 'PROVIDER'
            user.save()

        _ensure_related(user)

        # Auto-create provider profile for PROVIDER users
        if user.role == 'PROVIDER':
            profile, created = ServiceProviderProfile.objects.get_or_create(
                user=user,
                defaults={'service_types': [], 'city': 'القاهرة', 'status': 'APPROVED'},
            )

        tokens = _get_tokens(user)
        return Response({**tokens, 'isNewUser': is_new_user})


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        _ensure_related(request.user)
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        _ensure_related(request.user)
        return Response(UserSerializer(request.user).data)


# ---------------------------------------------------------------------------
# Wallet
# ---------------------------------------------------------------------------

class WalletView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        return Response({'available': wallet.balance, 'hold': wallet.hold})


class TransactionListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-created_at')


class TopUpView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        method = request.data.get('method', 'Unknown')
        try:
            amount = float(amount)
            if amount <= 0:
                raise ValueError
        except (TypeError, ValueError):
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            wallet, _ = Wallet.objects.get_or_create(user=request.user)
            amount_d = Decimal(str(amount))
            wallet.balance += amount_d
            wallet.save()

            Transaction.objects.create(
                user=request.user,
                type='CREDIT',
                amount=amount_d,
                description=f'شحن رصيد عبر {method}',
                status='COMPLETED',
            )
            return Response({'success': True, 'newBalance': float(wallet.balance)})
        except Exception as e:
            return Response({'error': f'Backend error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class WithdrawView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        amount = request.data.get('amount')
        method = request.data.get('method', 'Bank Transfer')
        try:
            amount = float(amount)
            if amount <= 0:
                raise ValueError
        except (TypeError, ValueError):
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        amount_d = Decimal(str(amount))
        
        if wallet.balance < amount_d:
            return Response({'error': 'Insufficient funds'}, status=status.HTTP_400_BAD_REQUEST)

        wallet.balance -= amount_d
        wallet.save()

        Transaction.objects.create(
            user=request.user,
            type='WITHDRAWAL',
            amount=-amount_d,
            description=f'سحب رصيد عبر {method}',
            status='COMPLETED',
        )

        return Response({'success': True, 'newBalance': float(wallet.balance)})


# ---------------------------------------------------------------------------
# Addresses
# ---------------------------------------------------------------------------

class AddressViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SavedAddressSerializer

    def get_queryset(self):
        return SavedAddress.objects.filter(user=self.request.user).order_by('-is_default', 'id')

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'request': self.request}


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'], url_path='read')
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response({'success': True})

    @action(detail=False, methods=['post'], url_path='read-all')
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'success': True})


# ---------------------------------------------------------------------------
# Orders (customer-facing)
# ---------------------------------------------------------------------------

ACTIVE_STATUSES = {'BIDDING', 'ACCEPTED', 'PICKUP_ON_WAY', 'PICKED_UP', 'IN_PROGRESS', 'STARTED', 'DELIVERY_ON_WAY', 'DELIVERED'}
DONE_STATUSES   = {'COMPLETED', 'CANCELLED', 'DISPUTED'}


class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        Order.expire_old_orders()
        return (
            Order.objects.filter(customer=self.request.user)
            .prefetch_related('bids__provider__provider_profile')
            .select_related('address', 'provider__provider_profile')
            .order_by('-created_at')
        )

    def retrieve(self, request, *args, **kwargs):
        """
        Allow providers to retrieve any BIDDING order (for the bid submission screen).
        Customers can retrieve their own orders (default).
        """
        pk = kwargs.get('pk')
        try:
            order = Order.objects.select_related('address', 'provider__provider_profile').prefetch_related('bids__provider__provider_profile').get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        # Providers can see any BIDDING order
        if order.customer == request.user:
            return Response(OrderSerializer(order, context={'request': request}).data)

        if order.status == 'BIDDING':
            return Response(AvailableOrderSerializer(order, context={'request': request}).data)

        # Providers viewing their accepted/assigned orders
        if order.provider == request.user:
            return Response(AvailableOrderSerializer(order).data)

        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def perform_create(self, serializer):
        response_window = self.request.data.get('responseWindow', 15)
        order = serializer.save(response_window=response_window)
        
        # Notify all online and available providers about the new order
        available_providers = CustomUser.objects.filter(
            role='PROVIDER',
            provider_profile__is_available=True,
            provider_profile__is_online=True,
            provider_profile__status='APPROVED',
        ).select_related('provider_profile')

        category = order.items[0].get('category', '') if order.items else ''
        notifications = [
            Notification(
                user=provider,
                title='طلب جديد قريب منك',
                body=f'طلب {category} جديد — {order.address.detail if order.address else ""}',
                type='NEW_ORDER',
            )
            for provider in available_providers
        ]
        if notifications:
            Notification.objects.bulk_create(notifications)

    @action(detail=False, methods=['get'])
    def active(self, request):
        order = (
            Order.objects.filter(customer=request.user, status__in=ACTIVE_STATUSES)
            .prefetch_related('bids__provider__provider_profile')
            .select_related('address', 'provider__provider_profile')
            .order_by('-created_at')
            .first()
        )
        if not order:
            return Response(None)
        return Response(OrderSerializer(order, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def history(self, request):
        orders = (
            Order.objects.filter(customer=request.user, status__in=DONE_STATUSES)
            .select_related('address', 'provider__provider_profile')
            .order_by('-created_at')
        )
        return Response(OrderSerializer(orders, many=True, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='confirm-escrow')
    def confirm_escrow(self, request, pk=None):
        order = self.get_object()
        if order.status != 'ACCEPTED':
            return Response({'error': 'Order must be in ACCEPTED status'}, status=status.HTTP_400_BAD_REQUEST)

        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        amount = order.agreed_price + order.bity_fee_customer

        if wallet.balance < amount:
            return Response({'error': 'Insufficient wallet balance'}, status=status.HTTP_400_BAD_REQUEST)

        wallet.balance -= amount
        wallet.hold   += amount
        wallet.save()

        order.escrow_held   = True
        order.escrow_amount = amount
        order.status        = 'IN_PROGRESS'
        order.save()

        Escrow.objects.get_or_create(order=order, defaults={'amount': amount, 'status': 'locked'})
        Transaction.objects.create(
            user=request.user, type='HOLD', amount=-amount,
            description=f'ضمان طلب #{order.order_number}', status='COMPLETED',
        )
        return Response({'success': True})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status not in ('BIDDING', 'ACCEPTED', 'IN_PROGRESS'):
             return Response({'error': f'Cannot cancel order in {order.status} status'}, status=status.HTTP_400_BAD_REQUEST)
        
        # If escrow was held, release it back to customer
        if order.escrow_held:
            wallet, _ = Wallet.objects.get_or_create(user=order.customer)
            wallet.hold -= order.escrow_amount
            wallet.balance += order.escrow_amount
            wallet.save()
            
            try:
                escrow = order.escrow
                escrow.status = 'refunded'
                escrow.save()
            except Escrow.DoesNotExist:
                pass
                
            Transaction.objects.create(
                user=order.customer, type='REFUND', amount=order.escrow_amount,
                description=f'استرداد ضمان طلب #{order.order_number}', status='COMPLETED'
            )

        order.status = 'CANCELLED'
        order.save()
        
        # Notify provider if assigned
        if order.provider:
            Notification.objects.create(
                user=order.provider,
                title='تم إلغاء الطلب',
                body=f'قام العميل بإلغاء الطلب #{order.order_number}',
                type='ORDER_STATUS'
            )
            
        return Response({'success': True})

    @action(detail=True, methods=['post'], url_path='start-job')
    def start_job(self, request, pk=None):
        order = self.get_object()
        if order.status != 'IN_PROGRESS':
            return Response({'error': 'Order must be IN_PROGRESS to start'}, status=status.HTTP_400_BAD_REQUEST)
        
        order.status = 'STARTED'
        order.save()
        return Response({'success': True})

    @action(detail=True, methods=['post'], url_path='generate-completion-otp')
    def generate_otp(self, request, pk=None):
        order = self.get_object()
        if order.status != 'STARTED':
            return Response({'error': 'Order must be STARTED to generate completion OTP'}, status=status.HTTP_400_BAD_REQUEST)
        
        # In a real app, send this via SMS. Here we just store it.
        code = ''.join(random.choices(string.digits, k=6))
        order.completion_otp = code
        order.save()
        return Response({'success': True, 'otp': code})

    @action(detail=True, methods=['post'], url_path='verify-completion-otp')
    def verify_otp(self, request, pk=None):
        order = self.get_object()
        
        # Only customer can verify OTP to release money
        if order.customer != request.user:
            return Response({'error': 'Only the customer can verify completion'}, status=status.HTTP_403_FORBIDDEN)
            
        code = request.data.get('code')
        if not order.completion_otp or order.completion_otp != code:
            return Response({'error': 'Invalid completion code'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not order.escrow_held:
            return Response({'error': 'Payment was not confirmed/held for this order. Please contact support.'}, status=status.HTTP_400_BAD_REQUEST)

        _complete_order_payment(order)
        order.completion_otp = None
        order.status = 'COMPLETED'
        order.save()
        return Response({'success': True})

    @action(detail=True, methods=['post'], url_path='rate-provider')
    def rate_provider(self, request, pk=None):
        order = self.get_object()
        if order.status != 'COMPLETED':
            return Response({'error': 'Order not completed'}, status=status.HTTP_400_BAD_REQUEST)

        if order.rating is not None:
            return Response({'error': 'Order already rated'}, status=status.HTTP_400_BAD_REQUEST)
        
        rating = request.data.get('rating')
        review = request.data.get('review', '')
        if not rating:
            return Response({'error': 'Rating required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            rating = int(float(rating))
            if not (1 <= rating <= 5):
                raise ValueError
        except (ValueError, TypeError):
             return Response({'error': 'Rating must be between 1 and 5'}, status=status.HTTP_400_BAD_REQUEST)

        # Save to order
        order.rating = rating
        order.review = review
        order.save()

        # Update provider average rating
        profile = order.provider.provider_profile
        total = profile.completed_orders - 1 # It was already incremented in _complete_order_payment
        if total < 0: total = 0
        
        current_avg = profile.rating
        new_avg = ((current_avg * total) + rating) / (total + 1)
        
        profile.rating = new_avg
        # profile.completed_orders += 1 # DON'T increment here, it's done in _complete_order_payment
        profile.save()
        
        return Response({'success': True})

    @action(detail=True, methods=['post'], url_path='raise-dispute')
    def raise_dispute(self, request, pk=None):
        order = self.get_object()
        reason = request.data.get('reason', 'No reason provided')
        
        if order.status not in ('IN_PROGRESS', 'DELIVERED', 'DELIVERY_ON_WAY'):
            return Response(
                {'error': 'Disputes can only be raised during or right after execution'},
                status=status.HTTP_400_BAD_REQUEST,
            )
            
        order.status = 'DISPUTED'
        order.save()
        
        try:
            escrow = order.escrow
            escrow.status = 'disputed'
            escrow.save()
        except Escrow.DoesNotExist:
            pass
            
        # Notify Admin & Provider
        if order.provider:
            Notification.objects.create(
                user=order.provider,
                title='تنبيه: تم رفع نزاع',
                body=f'تم رفع نزاع على الطلب #{order.order_number}. برجاء التواصل مع الدعم.',
                type='DISPUTE',
            )
            
        return Response({'success': True})


# ---------------------------------------------------------------------------
# Bids
# ---------------------------------------------------------------------------

class BidViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = BidSerializer

    def get_queryset(self):
        order_id = self.kwargs.get('order_pk')
        if order_id:
            return Bid.objects.filter(order_id=order_id).select_related('provider__provider_profile')
        return Bid.objects.filter(provider=self.request.user).select_related('provider__provider_profile')

    def perform_create(self, serializer):
        order_id = self.kwargs.get('order_pk')
        serializer.save(provider=self.request.user, order_id=order_id)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None, order_pk=None):
        bid   = self.get_object()
        order = bid.order

        if order.customer != request.user:
            return Response({'error': 'Not your order'}, status=status.HTTP_403_FORBIDDEN)
        if order.status != 'BIDDING':
            return Response({'error': 'Order is not in bidding status'}, status=status.HTTP_400_BAD_REQUEST)

        order.bids.exclude(pk=bid.pk).update(status='REJECTED')

        bid.status = 'ACCEPTED'
        bid.save()

        order.provider     = bid.provider
        order.agreed_price = bid.price
        order.total_amount = Decimal(str(bid.price)) + Decimal(str(order.bity_fee_customer))
        order.status       = 'ACCEPTED'
        order.save()

        Notification.objects.create(
            user=bid.provider,
            title='تم قبول عرضك!',
            body=f'تم قبول عرضك بمبلغ {bid.price} ج.م على الطلب #{order.order_number}',
            type='BID_ACCEPTED',
        )

        return Response({'success': True})

    @action(detail=True, methods=['post'])
    def withdraw(self, request, pk=None, order_pk=None):
        bid = self.get_object()
        if bid.provider != request.user:
            return Response({'error': 'Not your bid'}, status=status.HTTP_403_FORBIDDEN)
        if bid.status != 'PENDING':
            return Response({'error': 'Only pending bids can be withdrawn'}, status=status.HTTP_400_BAD_REQUEST)
        
        bid.delete()
        return Response({'success': True})

class MessageViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        order_pk = self.kwargs.get('order_pk')
        return Message.objects.filter(order_id=order_pk).order_by('created_at')

    def perform_create(self, serializer):
        order_pk = self.kwargs.get('order_pk')
        try:
            order = Order.objects.get(pk=order_pk)
        except Order.DoesNotExist:
            from rest_framework import serializers as drf_serializers
            raise drf_serializers.ValidationError("Order not found")
            
        serializer.save(sender=self.request.user, order=order)


# ---------------------------------------------------------------------------
# Providers (customer-facing browse)
# ---------------------------------------------------------------------------

class ServiceProviderViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProviderSummarySerializer
    queryset = ServiceProviderProfile.objects.select_related('user').filter(is_verified=True)


# ---------------------------------------------------------------------------
# Provider self-service (provider app)
# ---------------------------------------------------------------------------

PROVIDER_ACTIVE_STATUSES = {'ACCEPTED', 'PICKUP_ON_WAY', 'PICKED_UP', 'IN_PROGRESS', 'STARTED', 'DELIVERY_ON_WAY', 'DELIVERED'}
PROVIDER_DONE_STATUSES   = {'COMPLETED', 'CANCELLED', 'DISPUTED'}

VALID_STATUS_TRANSITIONS = {
    'ACCEPTED':        ['PICKUP_ON_WAY', 'IN_PROGRESS'],
    'PICKUP_ON_WAY':   ['PICKED_UP'],
    'PICKED_UP':       ['IN_PROGRESS'],
    'IN_PROGRESS':     ['DELIVERY_ON_WAY'],
    'STARTED':         ['COMPLETED'],
    'DELIVERY_ON_WAY': ['DELIVERED'],
    'DELIVERED':       ['COMPLETED'],
}


class ProviderProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _ = ServiceProviderProfile.objects.get_or_create(
            user=request.user,
            defaults={'service_types': [], 'city': 'القاهرة', 'status': 'APPROVED'},
        )
        _ensure_related(request.user)
        return Response(ProviderProfileSerializer(profile).data)

    def patch(self, request):
        profile, _ = ServiceProviderProfile.objects.get_or_create(
            user=request.user,
            defaults={'service_types': [], 'city': 'القاهرة', 'status': 'APPROVED'},
        )
        data = request.data
        if 'bio'          in data: profile.bio           = data['bio']
        if 'serviceTypes' in data: profile.service_types = data['serviceTypes']
        if 'city'         in data: profile.city          = data['city']
        if 'isAvailable'  in data: profile.is_available  = bool(data['isAvailable'])
        if 'isOnline'     in data: profile.is_online     = bool(data['isOnline'])
        profile.save()
        return Response(ProviderProfileSerializer(profile).data)

class ProviderOnboardingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        profile, _ = ServiceProviderProfile.objects.get_or_create(
            user=request.user,
            defaults={'service_types': [], 'city': 'القاهرة', 'status': 'APPLIED'},
        )
        serializer = ProviderOnboardingSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # If changing name/email, update User model too
            if 'name' in request.data:
                name = request.data['name']
                parts = name.split(' ', 1)
                request.user.first_name = parts[0]
                request.user.last_name = parts[1] if len(parts) > 1 else ''
                request.user.save()
                
            return Response(ProviderProfileSerializer(profile).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ToggleAvailabilityView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        is_available = request.data.get('isAvailable')
        is_online = request.data.get('isOnline')
        
        profile, _ = ServiceProviderProfile.objects.get_or_create(
            user=request.user,
            defaults={'service_types': [], 'city': 'القاهرة', 'status': 'APPROVED'},
        )
        
        if is_available is not None:
            profile.is_available = bool(is_available)
        if is_online is not None:
            profile.is_online = bool(is_online)
            
        profile.save()
        return Response({
            'isAvailable': profile.is_available,
            'isOnline': profile.is_online
        })

class UpdateLocationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        lat = request.data.get('latitude')
        lng = request.data.get('longitude')
        
        if lat is None or lng is None:
            return Response({'error': 'Latitude and longitude are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        profile, _ = ServiceProviderProfile.objects.get_or_create(
            user=request.user,
            defaults={'service_types': [], 'city': 'القاهرة', 'status': 'APPROVED'},
        )
        profile.current_latitude = float(lat)
        profile.current_longitude = float(lng)
        profile.save()
        
        return Response({'success': True})


class ProviderEarningsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.utils import timezone
        from django.db.models import Sum
        now        = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        qs    = Transaction.objects.filter(user=request.user, type='SALARY', status='COMPLETED')
        today = qs.filter(created_at__gte=today_start).aggregate(s=Sum('amount'))['s'] or 0
        month = qs.filter(created_at__gte=month_start).aggregate(s=Sum('amount'))['s'] or 0
        total = qs.aggregate(s=Sum('amount'))['s'] or 0

        return Response({'today': float(today), 'month': float(month), 'total': float(total)})


class ProviderScoreEventsView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ScoreEventSerializer

    def get_queryset(self):
        return ScoreEvent.objects.filter(provider=self.request.user).order_by('-created_at')


class AvailableOrdersView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AvailableOrderSerializer

    def get_queryset(self):
        from django.utils import timezone
        from django.db.models import F, ExpressionWrapper, DateTimeField
        from datetime import timedelta
        
        Order.expire_old_orders()
        now = timezone.now()
        
        # Filter: 
        # 1. Status is BIDDING
        # 2. Either scheduled OR (created_at + response_window minutes >= now)
        
        return (
            Order.objects.filter(status='BIDDING')
            .annotate(
                expires_at=ExpressionWrapper(
                    F('created_at') + ExpressionWrapper(F('response_window') * timedelta(minutes=1), output_field=DateTimeField()),
                    output_field=DateTimeField()
                )
            )
            .filter(
                Q(scheduled_at__isnull=False) | Q(expires_at__gte=now)
            )
            .select_related('address')
            .order_by('-created_at')
        )


class ProviderOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = MyOrderSerializer

    def get_queryset(self):
        """
        Return all orders for lookup purposes. 
        The 'list' method should be filtered if we only want to show available ones.
        """
        Order.expire_old_orders()
        return Order.objects.all().select_related('address', 'customer').order_by('-created_at')

    def list(self, request, *args, **kwargs):
        Order.expire_old_orders()
        from django.db.models import Q
        queryset = self.get_queryset().filter(Q(provider=request.user) | Q(status='BIDDING'))
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def active(self, request):
        order = (
            Order.objects.filter(provider=request.user, status__in=PROVIDER_ACTIVE_STATUSES)
            .select_related('address', 'customer')
            .order_by('-created_at')
            .first()
        )
        if not order:
            return Response(None)
        return Response(MyOrderSerializer(order, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def history(self, request):
        orders = (
            Order.objects.filter(provider=request.user, status__in=PROVIDER_DONE_STATUSES)
            .select_related('address', 'customer')
            .order_by('-created_at')
        )
        return Response(MyOrderSerializer(orders, many=True, context={'request': request}).data)

    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        order = self.get_object()
        if order.provider != request.user:
            return Response({'error': 'Not your order'}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')
        allowed    = VALID_STATUS_TRANSITIONS.get(order.status, [])
        if new_status not in allowed:
            return Response(
                {'error': f'Cannot move from {order.status} to {new_status}. Allowed: {allowed}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status == 'COMPLETED':
            _complete_order_payment(order)
        else:
            order.status = new_status
            order.save()

            status_labels = {
                'PICKUP_ON_WAY': 'الفني في الطريق إليك',
                'PICKED_UP':     'تم الاستلام، جاري العمل',
                'IN_PROGRESS':   'جاري تنفيذ طلبك',
                'DELIVERY_ON_WAY': 'الفني في طريق العودة',
                'DELIVERED':     'تم التسليم — في انتظار تأكيدك',
            }
            Notification.objects.create(
                user=order.customer,
                title=status_labels.get(new_status, f'تحديث الطلب #{order.order_number}'),
                body=f'الطلب #{order.order_number} — {status_labels.get(new_status, new_status)}',
                type='ORDER_STATUS',
            )

        return Response({'success': True, 'status': order.status})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.provider != request.user:
            return Response({'error': 'Not your order'}, status=status.HTTP_403_FORBIDDEN)
        
        if order.status not in ('ACCEPTED', 'IN_PROGRESS'):
             return Response({'error': 'Cannot cancel order in current status'}, status=status.HTTP_400_BAD_REQUEST)

        # If escrow was held, release it back to customer
        if order.escrow_held:
            wallet, _ = Wallet.objects.get_or_create(user=order.customer)
            wallet.hold -= order.escrow_amount
            wallet.balance += order.escrow_amount
            wallet.save()
            
            try:
                escrow = order.escrow
                escrow.status = 'refunded'
                escrow.save()
            except Escrow.DoesNotExist:
                pass
                
            Transaction.objects.create(
                user=order.customer, type='REFUND', amount=order.escrow_amount,
                description=f'استرداد ضمان طلب #{order.order_number} (إلغاء من الفني)', status='COMPLETED'
            )

        order.status = 'CANCELLED'
        order.save()
        
        # Notify customer
        Notification.objects.create(
            user=order.customer,
            title='تم إلغاء الطلب من قبل الفني',
            body=f'نعتذر، قام الفني بإلغاء الطلب #{order.order_number}. يمكنك طلب فني آخر.',
            type='ORDER_STATUS'
        )
            
        return Response({'success': True})

    @action(detail=True, methods=['post'], url_path='submit-bid')
    def submit_bid(self, request, pk=None):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': f'Order with pk {pk} does not exist.'}, status=status.HTTP_404_NOT_FOUND)
            
        if order.status != 'BIDDING':
            return Response({'error': 'Order is not accepting bids'}, status=status.HTTP_400_BAD_REQUEST)

        if order.bids.filter(provider=request.user, status='PENDING').exists():
            return Response({'error': 'You already have a pending bid on this order'}, status=status.HTTP_400_BAD_REQUEST)

        price    = request.data.get('price')
        duration = request.data.get('duration', 60)
        notes    = request.data.get('notes', '')

        try:
            price = Decimal(str(price))
        except Exception:
            return Response({'error': 'Invalid price'}, status=status.HTTP_400_BAD_REQUEST)

        bid = Bid.objects.create(
            order=order,
            provider=request.user,
            price=price,
            estimated_duration=int(duration),
            notes=notes,
        )

        Notification.objects.create(
            user=order.customer,
            title='عرض جديد!',
            body=f'تلقيت عرضاً بسعر {price} ج.م لطلبك #{order.order_number}',
            type='BID_RECEIVED',
        )

        return Response({'success': True, 'bidId': bid.id})

    @action(detail=True, methods=['post'], url_path='generate-completion-otp')
    def generate_completion_otp(self, request, pk=None):
        try:
            order = Order.objects.get(pk=pk, provider=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        if order.status != 'STARTED':
            return Response(
                {'error': 'Order must be in STARTED status to generate OTP'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        code = ''.join(random.choices(string.digits, k=6))
        order.completion_otp = code
        order.save()

        return Response({'success': True, 'otp': code})
