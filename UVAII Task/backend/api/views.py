import uuid
import random
import os

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import Q, F, Case, When, Value, IntegerField

from .models import (
    Talent, Opportunity, Application, FeedItem, FeedItemLike, FeedItemComment,
    Message, Connection, Notification, VerificationRequest, Clip, CreditVerification,
    BookingOffer, Follow, SubscriptionTier, Report, Block,
    ArtistProfile, Credit, UnionAffiliation, Reel, ReelStats, ReelComment, ArtStagePost,
    PostStats, LiveStream, Duet, AvailabilityWindow, Event, EventTicket,
)
from .serializers import (
    TalentSerializer, OpportunitySerializer, ApplicationSerializer,
    FeedItemSerializer, FeedItemCommentSerializer, UserRegistrationSerializer, UserProfileSerializer,
    CustomTokenObtainPairSerializer, MessageSerializer, ConnectionSerializer,
    NotificationSerializer, VerificationRequestSerializer, ClipSerializer,
    CreditVerificationSerializer, BookingOfferSerializer, FollowSerializer, SubscriptionTierSerializer,
    ReportSerializer, BlockSerializer,
    ArtistProfileSerializer, CreditSerializer, UnionAffiliationSerializer, ReelSerializer,
    ReelCommentSerializer, ArtStagePostSerializer, LiveStreamSerializer, DuetSerializer, AvailabilityWindowSerializer,
    EventSerializer, EventTicketSerializer,
)

_GRADIENTS = [
    'from-violet-600 via-purple-700 to-indigo-800',
    'from-amber-500 via-orange-600 to-red-700',
    'from-emerald-500 via-teal-600 to-cyan-700',
    'from-rose-500 via-pink-600 to-fuchsia-700',
    'from-blue-500 via-indigo-600 to-violet-700',
]


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserProfileSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserProfileSerializer(request.user).data)

    def patch(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_password = request.data.get('old_password', '')
        new_password = request.data.get('new_password', '')
        if not old_password or not new_password:
            return Response({'detail': 'Both old_password and new_password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not request.user.check_password(old_password):
            return Response({'detail': 'Old password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({'detail': 'New password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(new_password)
        request.user.save()
        return Response({'detail': 'Password changed successfully.'})


class NotificationPrefsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(request.user.notification_prefs or {})

    def patch(self, request):
        prefs = request.user.notification_prefs or {}
        prefs.update(request.data)
        request.user.notification_prefs = prefs
        request.user.save(update_fields=['notification_prefs'])
        return Response(prefs)


class ProfileView(APIView):
    """GET / PUT the current user's own Talent record."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        talent = Talent.objects.filter(owner=request.user).first()
        if not talent:
            return Response({'detail': 'No talent profile found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(TalentSerializer(talent).data)

    def put(self, request):
        talent = Talent.objects.filter(owner=request.user).first()
        if talent:
            serializer = TalentSerializer(talent, data=request.data, partial=True)
        else:
            data = request.data.copy()
            data['id'] = f"t-{request.user.id}-{str(uuid.uuid4())[:8]}"
            serializer = TalentSerializer(data=data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TalentViewSet(viewsets.ModelViewSet):
    queryset = Talent.objects.all()
    serializer_class = TalentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ['name', 'bio', 'category', 'location']

    def get_queryset(self):
        qs = Talent.objects.all()
        p = self.request.query_params
        if p.get('mine') == 'true':
            qs = qs.filter(owner=self.request.user)
        if category := p.get('category'):
            qs = qs.filter(category__icontains=category)
        if location := p.get('location'):
            qs = qs.filter(location__icontains=location)
        if union := p.get('union'):
            qs = qs.filter(union_name__icontains=union)
        if p.get('verified') == 'true':
            qs = qs.filter(verified=True)
        if p.get('available') == 'true':
            qs = qs.filter(availability_status='Available')
        if discipline := p.get('discipline'):
            qs = qs.filter(artstage_profile__primary_discipline=discipline)
        return qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class OpportunityViewSet(viewsets.ModelViewSet):
    queryset = Opportunity.objects.all()
    serializer_class = OpportunitySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ['title', 'company', 'description', 'location', 'category']

    def get_queryset(self):
        queryset = Opportunity.objects.all()
        if self.request.query_params.get('owner') == 'me':
            queryset = queryset.filter(owner=self.request.user)
        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'], url_path='apply')
    def apply(self, request, pk=None):
        opportunity = self.get_object()
        talent_qs = Talent.objects.filter(owner=request.user)
        if not talent_qs.exists():
            return Response({'detail': 'You need a talent profile to apply.'}, status=status.HTTP_400_BAD_REQUEST)
        talent = talent_qs.first()

        if Application.objects.filter(opportunity=opportunity, talent=talent).exists():
            return Response({'detail': 'Already applied.'}, status=status.HTTP_400_BAD_REQUEST)

        app = Application.objects.create(
            id=str(uuid.uuid4())[:20],
            opportunity=opportunity,
            talent=talent,
            stage='New',
            cover_note=request.data.get('cover_note', ''),
            video_url=request.data.get('video_url') or None,
            questionnaire_answers=request.data.get('questionnaire_answers') or {},
            portfolio_submissions=request.data.get('portfolio_submissions') or {},
        )
        opportunity.applicants += 1
        opportunity.save(update_fields=['applicants'])
        return Response(ApplicationSerializer(app).data, status=status.HTTP_201_CREATED)


class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Application.objects.all()
        opportunity_id = self.request.query_params.get('opportunity')
        if opportunity_id:
            queryset = queryset.filter(opportunity_id=opportunity_id)
        talent_id = self.request.query_params.get('talent')
        if talent_id:
            queryset = queryset.filter(talent_id=talent_id)
        if self.request.query_params.get('applied_by_me') == 'true':
            queryset = queryset.filter(talent__owner=self.request.user)
        return queryset

    @action(detail=True, methods=['patch'], url_path='stage')
    def stage_update(self, request, pk=None):
        app = self.get_object()
        if app.opportunity.owner != request.user:
            return Response({'detail': 'Only the opportunity owner can update the stage.'}, status=status.HTTP_403_FORBIDDEN)
        new_stage = request.data.get('stage')
        valid_stages = [s[0] for s in Application.STAGE_CHOICES]
        if new_stage not in valid_stages:
            return Response({'detail': f'Invalid stage. Choose from: {valid_stages}'}, status=status.HTTP_400_BAD_REQUEST)
        app.stage = new_stage
        app.save(update_fields=['stage'])

        talent_owner = app.talent.owner
        if talent_owner:
            Notification.objects.create(
                recipient=talent_owner,
                type='stage_change',
                body=f'Your application for "{app.opportunity.title}" has moved to {new_stage}.',
            )

        return Response(ApplicationSerializer(app).data)

    @action(detail=True, methods=['patch'], url_path='notes')
    def update_notes(self, request, pk=None):
        app = self.get_object()
        if app.opportunity.owner != request.user:
            return Response({'detail': 'Only the opportunity owner can add notes.'}, status=status.HTTP_403_FORBIDDEN)
        app.notes = request.data.get('notes', '')
        app.save(update_fields=['notes'])
        return Response(ApplicationSerializer(app).data)


class FeedItemViewSet(viewsets.ModelViewSet):
    queryset = FeedItem.objects.all()
    serializer_class = FeedItemSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        user = self.request.user
        talent = Talent.objects.filter(owner=user).first()
        serializer.save(
            owner=user,
            id=str(uuid.uuid4())[:20],
            author_name=talent.name if talent else user.email.split('@')[0],
            author_role=talent.category if talent else user.role,
            author_avatar=talent.avatar if talent else '',
            category=talent.category if talent else 'General',
            verified=talent.verified if talent else False,
            time='Just now',
            gradient=random.choice(_GRADIENTS),
            emoji='🎭',
            likes=0,
            comments=0,
            shares=0,
        )

    @action(detail=True, methods=['post'], url_path='like')
    def toggle_like(self, request, pk=None):
        feed_item = self.get_object()
        like, created = FeedItemLike.objects.get_or_create(user=request.user, feed_item=feed_item)
        if created:
            # Like added
            FeedItem.objects.filter(pk=feed_item.pk).update(likes=F('likes') + 1)
            feed_item.refresh_from_db()
            return Response({'liked': True, 'likes': feed_item.likes}, status=status.HTTP_201_CREATED)
        else:
            # Unlike
            like.delete()
            FeedItem.objects.filter(pk=feed_item.pk).update(
                likes=Case(
                    When(likes__gt=0, then=F('likes') - 1),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            )
            feed_item.refresh_from_db()
            return Response({'liked': False, 'likes': feed_item.likes})

    @action(detail=True, methods=['get'], url_path='comments')
    def list_comments(self, request, pk=None):
        feed_item = self.get_object()
        comments = FeedItemComment.objects.filter(feed_item=feed_item)
        return Response(FeedItemCommentSerializer(comments, many=True).data)


class FeedItemCommentViewSet(viewsets.ModelViewSet):
    serializer_class = FeedItemCommentSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        feed_item_id = self.request.query_params.get('feed_item')
        if feed_item_id:
            return FeedItemComment.objects.filter(feed_item_id=feed_item_id)
        return FeedItemComment.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        talent = Talent.objects.filter(owner=user).first()
        author_name = talent.name if talent else user.email.split('@')[0]
        author_avatar = talent.avatar if talent else ''
        comment = serializer.save(
            user=user,
            author_name=author_name,
            author_avatar=author_avatar,
        )
        # Increment comment counter on feed item
        FeedItem.objects.filter(pk=comment.feed_item_id).update(comments=F('comments') + 1)

    def perform_destroy(self, instance):
        feed_item_id = instance.feed_item_id
        instance.delete()
        FeedItem.objects.filter(pk=feed_item_id).update(
            comments=Case(
                When(comments__gt=0, then=F('comments') - 1),
                default=Value(0),
                output_field=IntegerField(),
            )
        )


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        blocked_ids = Block.objects.filter(blocker=user).values_list('blocked_id', flat=True)
        blocker_ids = Block.objects.filter(blocked=user).values_list('blocker_id', flat=True)
        excluded_ids = set(list(blocked_ids) + list(blocker_ids))
        queryset = Message.objects.filter(Q(sender=user) | Q(recipient=user)).exclude(
            Q(sender_id__in=excluded_ids) | Q(recipient_id__in=excluded_ids)
        ).order_by('sent_at')
        with_user_id = self.request.query_params.get('with')
        if with_user_id:
            queryset = queryset.filter(
                Q(sender=user, recipient_id=with_user_id) |
                Q(sender_id=with_user_id, recipient=user)
            )
            # Auto-mark as read for the recipient when viewing the thread
            queryset.filter(recipient=user, read=False).update(read=True)
        search_term = self.request.query_params.get('search')
        if search_term:
            queryset = queryset.filter(body__icontains=search_term)
        return queryset

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = Message.objects.filter(recipient=request.user, read=False).count()
        return Response({'count': count})


class ConnectionViewSet(viewsets.ModelViewSet):
    serializer_class = ConnectionSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        return Connection.objects.filter(Q(from_user=user) | Q(to_user=user))

    def perform_create(self, serializer):
        conn = serializer.save(from_user=self.request.user)
        Notification.objects.create(
            recipient=conn.to_user,
            type='connection_request',
            body=f'{self.request.user.email} sent you a connection request.',
        )
        
        # Handle optional GIT message
        message_text = self.request.data.get('message', '').strip()
        if message_text:
            Message.objects.create(
                sender=self.request.user,
                recipient=conn.to_user,
                body=message_text
            )

    def destroy(self, request, pk=None):
        conn = self.get_queryset().filter(pk=pk).first()
        if not conn:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        conn.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['patch'], url_path='accept')
    def accept(self, request, pk=None):
        conn = self.get_object()
        if conn.to_user != request.user:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        conn.status = 'ACCEPTED'
        conn.save(update_fields=['status'])
        Notification.objects.create(
            recipient=conn.from_user,
            type='connection_accepted',
            body=f'{request.user.email} accepted your connection request.',
        )
        return Response(ConnectionSerializer(conn).data)


class NotificationViewSet(viewsets.GenericViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Notification.objects.filter(recipient=self.request.user)
        if self.request.query_params.get('unread') == 'true':
            queryset = queryset.filter(read=False)
        return queryset

    def list(self, request):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        notif = self.get_queryset().filter(pk=pk).first()
        if not notif:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        notif.read = True
        notif.save(update_fields=['read'])
        return Response(self.get_serializer(notif).data)


class VerificationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        req = VerificationRequest.objects.filter(user=request.user).order_by('-submitted_at').first()
        if not req:
            return Response({'status': None})
        return Response(VerificationRequestSerializer(req).data)

    def post(self, request):
        if VerificationRequest.objects.filter(user=request.user, status='PENDING').exists():
            return Response({'detail': 'You already have a pending verification request.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = VerificationRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ClipViewSet(viewsets.ModelViewSet):
    serializer_class = ClipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        talent_id = self.request.query_params.get('talent')
        if talent_id:
            return Clip.objects.filter(talent_id=talent_id)
        return Clip.objects.filter(talent__owner=self.request.user)

    def perform_create(self, serializer):
        talent = Talent.objects.filter(owner=self.request.user).first()
        if not talent:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You need a talent profile to add clips.')
        serializer.save(talent=talent)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        talent_qs = Talent.objects.filter(owner=user)
        profile_views = sum(t.views for t in talent_qs)
        submission_count = Application.objects.filter(talent__owner=user).count()
        active_briefs = Opportunity.objects.filter(owner=user).count()
        shortlisted_count = Application.objects.filter(
            talent__owner=user, stage__in=['Shortlisted', 'Callback', 'Approved']
        ).count()
        unread_messages = Message.objects.filter(recipient=user, read=False).count()
        pending_connections = Connection.objects.filter(to_user=user, status='PENDING').count()
        accepted_connections = Connection.objects.filter(
            Q(from_user=user) | Q(to_user=user), status='ACCEPTED'
        ).count()
        return Response({
            'profile_views': profile_views,
            'submission_count': submission_count,
            'active_briefs': active_briefs,
            'shortlisted_count': shortlisted_count,
            'unread_messages': unread_messages,
            'pending_connections': pending_connections,
            'accepted_connections': accepted_connections,
        })


class FollowViewSet(viewsets.ModelViewSet):
    serializer_class = FollowSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        talent_id = self.request.query_params.get('talent')
        # Talent owners can see all followers for their own talent
        if talent_id:
            talent_qs = Talent.objects.filter(pk=talent_id, owner=self.request.user)
            if talent_qs.exists():
                return Follow.objects.filter(talent_id=talent_id)
            # Fan checking their own follow status for this talent
            return Follow.objects.filter(talent_id=talent_id, fan=self.request.user)
        # Default: return the current user's own follows (fan view)
        return Follow.objects.filter(fan=self.request.user)

    def perform_create(self, serializer):
        follow = serializer.save(fan=self.request.user)
        # Increment follower count
        Talent.objects.filter(pk=follow.talent_id).update(followers=F('followers') + 1)
        # Notify talent owner
        if follow.talent.owner:
            Notification.objects.create(
                recipient=follow.talent.owner,
                type='system',
                body=f'{self.request.user.email} started following you.',
            )

    def perform_destroy(self, instance):
        talent_id = instance.talent_id
        instance.delete()
        Talent.objects.filter(pk=talent_id).update(
            followers=Case(
                When(followers__gt=0, then=F('followers') - 1),
                default=Value(0),
                output_field=IntegerField(),
            )
        )


class SubscriptionTierViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionTierSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        talent_id = self.request.query_params.get('talent')
        if talent_id:
            return SubscriptionTier.objects.filter(talent_id=talent_id, is_active=True)
        return SubscriptionTier.objects.filter(talent__owner=self.request.user)

    def perform_create(self, serializer):
        talent = Talent.objects.filter(owner=self.request.user).first()
        if not talent:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You need a talent profile to create tiers.')
        serializer.save(talent=talent)

    def get_object(self):
        """Ensure users can only modify their own tiers."""
        obj = super().get_object()
        if self.request.method not in ('GET', 'HEAD', 'OPTIONS'):
            if obj.talent.owner != self.request.user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('You can only modify your own subscription tiers.')
        return obj


class CreditVerificationViewSet(viewsets.GenericViewSet):
    serializer_class = CreditVerificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        talent_id = self.request.query_params.get('talent')
        if talent_id:
            # Allow viewing verifications for a specific talent (public read for profile display),
            # but only expose VERIFIED status to non-owners to avoid leaking PENDING/SELF_ASSERTED.
            talent = Talent.objects.filter(pk=talent_id).first()
            if talent and talent.owner == self.request.user:
                return CreditVerification.objects.filter(talent_id=talent_id)
            return CreditVerification.objects.filter(talent_id=talent_id, status='VERIFIED')
        return CreditVerification.objects.filter(talent__owner=self.request.user)

    def list(self, request):
        return Response(self.get_serializer(self.get_queryset(), many=True).data)

    def create(self, request):
        talent = Talent.objects.filter(owner=request.user).first()
        if not talent:
            return Response({'detail': 'No talent profile.'}, status=status.HTTP_400_BAD_REQUEST)
        credit_title = request.data.get('credit_title', '').strip()
        if not credit_title:
            return Response({'detail': 'credit_title is required.'}, status=status.HTTP_400_BAD_REQUEST)
        # If already exists for this talent+title, update to PENDING only if not already VERIFIED
        obj, created = CreditVerification.objects.get_or_create(
            talent=talent, credit_title=credit_title,
            defaults={'status': 'PENDING'}
        )
        if not created:
            if obj.status == 'VERIFIED':
                return Response(self.get_serializer(obj).data, status=status.HTTP_200_OK)
            obj.status = 'PENDING'
            obj.save(update_fields=['status'])
        return Response(self.get_serializer(obj).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


# ─────────────────────────── ArtStage Views ────────────────────────────


class ArtistProfileDetailView(APIView):
    """GET /api/artists/{username}/ — public artist profile by slug."""
    permission_classes = [AllowAny]

    def get(self, request, username):
        try:
            profile = ArtistProfile.objects.select_related('talent').get(username=username)
        except ArtistProfile.DoesNotExist:
            return Response({'detail': 'Artist not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ArtistProfileSerializer(profile).data)


class ArtistReelsView(APIView):
    """GET /api/artists/{username}/reels/ — all reels for an artist."""
    permission_classes = [AllowAny]

    def get(self, request, username):
        try:
            profile = ArtistProfile.objects.select_related('talent').get(username=username)
        except ArtistProfile.DoesNotExist:
            return Response({'detail': 'Artist not found.'}, status=status.HTTP_404_NOT_FOUND)
        reels = Reel.objects.filter(artist=profile.talent).exclude(visibility='private')
        reel_type = request.query_params.get('type')
        if reel_type:
            reels = reels.filter(type=reel_type)
        sort = request.query_params.get('sort', 'newest')
        if sort == 'most_viewed':
            reels = reels.order_by('-stats__plays')
        elif sort == 'most_liked':
            reels = reels.order_by('-stats__likes')
        return Response(ReelSerializer(reels, many=True).data)


class ArtistPostsView(APIView):
    """GET /api/artists/{username}/posts/ — all posts for an artist."""
    permission_classes = [AllowAny]

    def get(self, request, username):
        try:
            profile = ArtistProfile.objects.select_related('talent').get(username=username)
        except ArtistProfile.DoesNotExist:
            return Response({'detail': 'Artist not found.'}, status=status.HTTP_404_NOT_FOUND)
        posts = ArtStagePost.objects.filter(artist=profile.talent).exclude(visibility='private')
        return Response(ArtStagePostSerializer(posts, many=True).data)


class ArtistAvailabilityView(APIView):
    """GET /api/artists/{username}/availability/ — availability windows."""
    permission_classes = [AllowAny]

    def get(self, request, username):
        try:
            profile = ArtistProfile.objects.select_related('talent').get(username=username)
        except ArtistProfile.DoesNotExist:
            return Response({'detail': 'Artist not found.'}, status=status.HTTP_404_NOT_FOUND)
        windows = AvailabilityWindow.objects.filter(artist=profile.talent)
        return Response(AvailabilityWindowSerializer(windows, many=True).data)


class ArtistLivestreamView(APIView):
    """GET /api/artists/{username}/livestream/ — active livestream if any."""
    permission_classes = [AllowAny]

    def get(self, request, username):
        try:
            profile = ArtistProfile.objects.select_related('talent').get(username=username)
        except ArtistProfile.DoesNotExist:
            return Response({'detail': 'Artist not found.'}, status=status.HTTP_404_NOT_FOUND)
        stream = LiveStream.objects.filter(artist=profile.talent, is_live=True).first()
        if not stream:
            return Response({'is_live': False})
        return Response(LiveStreamSerializer(stream).data)


class ReelView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.query_params.get('mine') == 'true':
            talent = Talent.objects.filter(owner=request.user).first()
            if not talent:
                return Response([], status=status.HTTP_200_OK)
            reels = Reel.objects.filter(artist=talent).order_by('-created_at')
        else:
            reels = Reel.objects.exclude(visibility='private').order_by('-created_at')
        return Response(ReelSerializer(reels, many=True, context={'request': request}).data)

    def post(self, request):
        talent = Talent.objects.filter(owner=request.user).first()
        if not talent:
            return Response({'detail': 'No talent profile.'}, status=status.HTTP_400_BAD_REQUEST)
        reel = Reel.objects.create(
            artist=talent,
            title=request.data.get('title', ''),
            type=request.data.get('type', 'reel'),
            video_url=request.data.get('video_url', ''),
            thumbnail_url=request.data.get('thumbnail_url', ''),
            description=request.data.get('description', ''),
            duration=int(request.data.get('duration', 0) or 0),
            visibility=request.data.get('visibility', 'public'),
            has_captions=bool(request.data.get('has_captions', False)),
            featured=False,
        )
        ReelStats.objects.create(reel=reel)
        return Response(ReelSerializer(reel).data, status=status.HTTP_201_CREATED)


class ReelCommentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, reel_id):
        comments = ReelComment.objects.filter(reel_id=reel_id).order_by('created_at')
        return Response(ReelCommentSerializer(comments, many=True).data)

    def post(self, request, reel_id):
        try:
            reel = Reel.objects.get(pk=reel_id)
        except Reel.DoesNotExist:
            return Response({'detail': 'Reel not found.'}, status=status.HTTP_404_NOT_FOUND)
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'detail': 'text is required.'}, status=status.HTTP_400_BAD_REQUEST)
        comment = ReelComment.objects.create(reel=reel, author=request.user, text=text)
        return Response(ReelCommentSerializer(comment).data, status=status.HTTP_201_CREATED)


class LikeReelView(APIView):
    """POST /api/reels/<reel_id>/like/ — increment or decrement reel like count."""
    permission_classes = [IsAuthenticated]

    def post(self, request, reel_id):
        try:
            reel = Reel.objects.get(pk=reel_id)
        except Reel.DoesNotExist:
            return Response({'detail': 'Reel not found.'}, status=status.HTTP_404_NOT_FOUND)
        stats, _ = ReelStats.objects.get_or_create(reel=reel)
        if request.data.get('action') == 'unlike':
            ReelStats.objects.filter(pk=stats.pk, likes__gt=0).update(likes=F('likes') - 1)
        else:
            ReelStats.objects.filter(pk=stats.pk).update(likes=F('likes') + 1)
        stats.refresh_from_db()
        return Response({'likes': stats.likes})


class PostCreateView(APIView):
    """GET /api/posts/ — list posts (supports ?artist= filter). POST — create."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        posts = ArtStagePost.objects.exclude(visibility='private').order_by('-created_at')
        if artist_id := request.query_params.get('artist'):
            posts = posts.filter(artist_id=artist_id)
        return Response(ArtStagePostSerializer(posts, many=True).data)

    def post(self, request):
        talent = Talent.objects.filter(owner=request.user).first()
        if not talent:
            return Response({'detail': 'No talent profile.'}, status=status.HTTP_400_BAD_REQUEST)
        post = ArtStagePost.objects.create(
            artist=talent,
            content=request.data.get('content', ''),
            visibility=request.data.get('visibility', 'public'),
            featured=request.data.get('featured', False),
            pinned=request.data.get('pinned', False),
        )
        PostStats.objects.create(post=post)
        return Response(ArtStagePostSerializer(post).data, status=status.HTTP_201_CREATED)


class LiveCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        streams = LiveStream.objects.filter(
            Q(is_live=True) | Q(scheduled_for__isnull=False)
        ).exclude(visibility='private').order_by('-is_live', '-created_at')
        return Response(LiveStreamSerializer(streams, many=True).data)

    def post(self, request):
        talent = Talent.objects.filter(owner=request.user).first()
        if not talent:
            return Response({'detail': 'No talent profile.'}, status=status.HTTP_400_BAD_REQUEST)
        scheduled_for = request.data.get('scheduled_for') or None
        stream = LiveStream.objects.create(
            artist=talent,
            title=request.data.get('title', 'Untitled Live'),
            is_live=not bool(scheduled_for),
            scheduled_for=scheduled_for,
            visibility=request.data.get('visibility', 'public'),
            viewer_count=0,
        )
        return Response(LiveStreamSerializer(stream).data, status=status.HTTP_201_CREATED)


class LiveDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, stream_id):
        try:
            stream = LiveStream.objects.get(pk=stream_id)
        except LiveStream.DoesNotExist:
            return Response({'detail': 'Stream not found.'}, status=status.HTTP_404_NOT_FOUND)
        if stream.visibility == 'private' and stream.artist.owner != request.user:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        # Increment viewer count for live streams
        if stream.is_live:
            LiveStream.objects.filter(pk=stream_id).update(viewer_count=F('viewer_count') + 1)
            stream.refresh_from_db(fields=['viewer_count'])
        return Response(LiveStreamSerializer(stream).data)


class UploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)
        ext = os.path.splitext(file.name)[1].lower()
        filename = f"uploads/{uuid.uuid4().hex}{ext}"
        saved_path = default_storage.save(filename, ContentFile(file.read()))
        url = request.build_absolute_uri(settings.MEDIA_URL + saved_path)
        return Response({'url': url}, status=status.HTTP_201_CREATED)


class DuetCreateView(APIView):
    """POST /api/duets/ — stub for creating a duet."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({'detail': 'Duet queued for processing.', 'id': 'stub-duet-id'}, status=status.HTTP_201_CREATED)


class RosterView(APIView):
    """GET /api/roster/ — returns the agency's represented talents."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'AGENCY':
            return Response({'detail': 'Agency accounts only.'}, status=status.HTTP_403_FORBIDDEN)
        agency_name = (request.user.first_name + ' ' + request.user.last_name).strip()
        if not agency_name:
            return Response({'detail': 'Set your agency name in settings first.'}, status=status.HTTP_400_BAD_REQUEST)
        talents = Talent.objects.filter(agency__iexact=agency_name)
        return Response(TalentSerializer(talents, many=True).data)


class AvailabilityViewSet(viewsets.ModelViewSet):
    serializer_class = AvailabilityWindowSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        talent = Talent.objects.filter(owner=self.request.user).first()
        if not talent:
            return AvailabilityWindow.objects.none()
        return AvailabilityWindow.objects.filter(artist=talent)

    def perform_create(self, serializer):
        talent = Talent.objects.filter(owner=self.request.user).first()
        if not talent:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You need a talent profile to set availability.')
        serializer.save(artist=talent)

# Add to your existing BookingOfferViewSet in views.py

class BookingOfferViewSet(viewsets.ModelViewSet):
    serializer_class = BookingOfferSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        return BookingOffer.objects.filter(
            Q(from_user=user) | Q(to_talent__owner=user)
        )

    def perform_create(self, serializer):
        if self.request.user.role not in ('HIRER', 'AGENCY'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only hirers and agencies can make booking offers.')
        
        talent_id = self.request.data.get('to_talent')
        opportunity_id = self.request.data.get('opportunity')
        
        # Validate talent exists
        try:
            talent = Talent.objects.get(pk=talent_id)
        except Talent.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('Talent not found')
        
        # Check for existing pending offer
        existing = BookingOffer.objects.filter(
            from_user=self.request.user,
            to_talent=talent,
            status='PENDING'
        ).first()
        
        if existing:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'detail': 'You already have a pending offer for this talent.'})
        
        serializer.save(
            from_user=self.request.user,
            to_talent=talent,
            opportunity_id=opportunity_id if opportunity_id else None
        )
        
        # Send notification to talent owner
        if talent.owner:
            Notification.objects.create(
                recipient=talent.owner,
                type='system',
                body=f'You have received a booking offer from {self.request.user.email} for {"a role" if not opportunity_id else "the role"}!',
            )

    @action(detail=True, methods=['patch'], url_path='accept')
    def accept(self, request, pk=None):
        offer = self.get_object()
        if offer.to_talent.owner != request.user:
            return Response({'detail': 'Only the talent can accept this offer.'}, status=status.HTTP_403_FORBIDDEN)
        
        if offer.status != 'PENDING':
            return Response({'detail': f'Cannot accept offer with status {offer.status}.'}, status=status.HTTP_400_BAD_REQUEST)
        
        offer.status = 'ACCEPTED'
        offer.save(update_fields=['status', 'updated_at'])
        
        opp_title = offer.opportunity.title if offer.opportunity else 'a role'
        Notification.objects.create(
            recipient=offer.from_user,
            type='system',
            body=f'{offer.to_talent.name} accepted your booking offer for "{opp_title}".',
        )
        
        return Response(BookingOfferSerializer(offer).data)

    @action(detail=True, methods=['patch'], url_path='decline')
    def decline(self, request, pk=None):
        offer = self.get_object()
        if offer.to_talent.owner != request.user:
            return Response({'detail': 'Only the talent can decline this offer.'}, status=status.HTTP_403_FORBIDDEN)
        
        if offer.status != 'PENDING':
            return Response({'detail': f'Cannot decline offer with status {offer.status}.'}, status=status.HTTP_400_BAD_REQUEST)
        
        offer.status = 'DECLINED'
        offer.save(update_fields=['status', 'updated_at'])
        
        return Response(BookingOfferSerializer(offer).data)

    @action(detail=True, methods=['patch'], url_path='withdraw')
    def withdraw(self, request, pk=None):
        offer = self.get_object()
        if offer.from_user != request.user:
            return Response({'detail': 'Only the sender can withdraw this offer.'}, status=status.HTTP_403_FORBIDDEN)
        
        if offer.status != 'PENDING':
            return Response({'detail': f'Cannot withdraw offer with status {offer.status}.'}, status=status.HTTP_400_BAD_REQUEST)
        
        offer.status = 'WITHDRAWN'
        offer.save(update_fields=['status', 'updated_at'])

        # Notify talent that offer was withdrawn
        if offer.to_talent.owner:
            Notification.objects.create(
                recipient=offer.to_talent.owner,
                type='system',
                body=f'The booking offer from {request.user.email} has been withdrawn.',
            )

        return Response(BookingOfferSerializer(offer).data)


class EventViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = EventSerializer

    def get_queryset(self):
        if self.request.query_params.get('mine') == 'true':
            return Event.objects.filter(owner=self.request.user)
        return Event.objects.filter(published=True)

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def destroy(self, request, *args, **kwargs):
        event = self.get_object()
        if event.owner != request.user:
            return Response({'detail': 'Only the owner can delete this event.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='book')
    def book(self, request, pk=None):
        event = self.get_object()
        if event.tickets.filter(attendee=request.user).exists():
            return Response({'detail': 'You have already booked this event.'}, status=status.HTTP_400_BAD_REQUEST)
        tickets_sold = sum(t.quantity for t in event.tickets.all())
        if tickets_sold >= event.capacity:
            return Response({'detail': 'This event is sold out.'}, status=status.HTTP_400_BAD_REQUEST)
        quantity = max(1, int(request.data.get('quantity', 1)))
        EventTicket.objects.create(event=event, attendee=request.user, quantity=quantity)
        if event.owner:
            Notification.objects.create(
                recipient=event.owner,
                type='system',
                body=f'{request.user.email} booked {quantity} ticket(s) for "{event.title}".',
            )
        return Response({'detail': 'Booking confirmed.'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='unbook')
    def unbook(self, request, pk=None):
        event = self.get_object()
        ticket = event.tickets.filter(attendee=request.user).first()
        if not ticket:
            return Response({'detail': 'You have not booked this event.'}, status=status.HTTP_400_BAD_REQUEST)
        ticket.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)