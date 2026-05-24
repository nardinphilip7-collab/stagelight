from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser, OTPCode, Wallet, Transaction, PointAccount,
    SavedAddress, Notification, ServiceProviderProfile, ScoreEvent,
    Order, Bid, Escrow, Message,
)

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'phone_number', 'role', 'tier', 'email')
    list_filter = ('role', 'tier')
    fieldsets = UserAdmin.fieldsets + (
        ('Bity', {'fields': ('role', 'phone_number', 'tier', 'avatar_url', 'fcm_token')}),
    )

admin.site.register(OTPCode)
admin.site.register(Wallet)
admin.site.register(Transaction)
admin.site.register(PointAccount)
admin.site.register(SavedAddress)
admin.site.register(Notification)
@admin.action(description='Approve for Contract (Move to CONTRACT_SENT)')
def approve_for_contract(modeladmin, request, queryset):
    queryset.update(status='CONTRACT_SENT')

@admin.action(description='Approve and Activate (Move to APPROVED)')
def approve_and_activate(modeladmin, request, queryset):
    queryset.update(status='APPROVED', is_verified=True)

@admin.register(ServiceProviderProfile)
class ServiceProviderProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'status', 'tier', 'score', 'is_verified', 'city')
    list_filter = ('status', 'tier', 'is_verified', 'city')
    search_fields = ('user__phone_number', 'user__first_name', 'user__last_name', 'national_id_number')
    actions = [approve_for_contract, approve_and_activate]
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('user', 'status', 'is_verified', 'is_available', 'city', 'distance')
        }),
        ('Performance', {
            'fields': ('score', 'tier', 'trust_badge', 'rating', 'total_orders', 'completed_orders')
        }),
        ('Service Details', {
            'fields': ('bio', 'service_types', 'hourly_rate', 'work_area_json')
        }),
        ('KYC & Demographics', {
            'fields': ('national_id_number', 'date_of_birth', 'gender', 'whatsapp_number', 'education_level', 'english_level', 'special_needs_flag', 'disability_type')
        }),
        ('Banking', {
            'fields': ('bank_name', 'account_number', 'iban', 'instapay_wallet', 'wallet_created')
        }),
        ('Assessment & Training', {
            'fields': ('test_score', 'training_progress', 'test_metrics_json')
        }),
        ('Documents', {
            'fields': ('national_id_front_url', 'national_id_back_url', 'criminal_record_url', 'selfie_url', 'address_proof_url', 'experience_url', 'contract_signed_at')
        }),
    )
admin.site.register(ScoreEvent)
admin.site.register(Order)
admin.site.register(Bid)
from django.contrib import messages

@admin.action(description='Resolve Dispute: FULL REFUND to Customer')
def resolve_dispute_refund(modeladmin, request, queryset):
    count = 0
    for escrow in queryset.filter(status='disputed'):
        order = escrow.order
        # Return hold back to balance
        wallet, _ = Wallet.objects.get_or_create(user=order.customer)
        wallet.hold -= escrow.amount
        wallet.balance += escrow.amount
        wallet.save()
        
        Transaction.objects.create(
            user=order.customer, type='REFUND', amount=escrow.amount,
            description=f'استرداد مبلغ الطلب #{order.order_number}', status='COMPLETED'
        )
        
        escrow.status = 'refunded'
        escrow.save()
        
        order.escrow_held = False
        order.status = 'CANCELLED'
        order.save()
        
        Notification.objects.create(user=order.customer, title='قرار النزاع', body='تم رد المبلغ إلى محفظتك.', type='DISPUTE')
        count += 1
    modeladmin.message_user(request, f'Refunded {count} disputed escrows.', messages.SUCCESS)

@admin.action(description='Resolve Dispute: PAY PROVIDER (No Refund)')
def resolve_dispute_pay(modeladmin, request, queryset):
    from .views import _complete_order_payment
    count = 0
    for escrow in queryset.filter(status='disputed'):
        _complete_order_payment(escrow.order)
        count += 1
    modeladmin.message_user(request, f'Paid provider for {count} disputed escrows.', messages.SUCCESS)

@admin.register(Escrow)
class EscrowAdmin(admin.ModelAdmin):
    list_display = ('order', 'amount', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('order__order_number',)
    actions = [resolve_dispute_refund, resolve_dispute_pay]

admin.site.register(Message)
