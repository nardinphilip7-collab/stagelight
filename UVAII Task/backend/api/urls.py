from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    TalentViewSet, OpportunityViewSet, ApplicationViewSet, FeedItemViewSet, FeedItemCommentViewSet,
    MessageViewSet, ConnectionViewSet, NotificationViewSet, ClipViewSet,
    RegisterView, LoginView, CustomTokenRefreshView, MeView, DashboardView, VerificationView,
    ProfileView, ChangePasswordView, NotificationPrefsView, CreditVerificationViewSet, BookingOfferViewSet,
    FollowViewSet, SubscriptionTierViewSet, ReportViewSet, BlockViewSet,
    ArtistProfileDetailView, ArtistReelsView, ArtistPostsView, ArtistAvailabilityView,
    ArtistLivestreamView, ReelView, ReelCommentsView, LikeReelView, PostCreateView, PostLikeView, PostSaveView,
    LiveCreateView, LiveDetailView, LiveChatView, DuetCreateView,
    AvailabilityViewSet, UploadView, RosterView, EventViewSet, SkillEntryViewSet,
    EndorsementViewSet, AuditionSlotViewSet, CallbackRoundViewSet,
    CreditViewSet, UnionAffiliationViewSet, HirerSearchView,
)

router = DefaultRouter()
router.register(r'talents', TalentViewSet)
router.register(r'opportunities', OpportunityViewSet)
router.register(r'applications', ApplicationViewSet)
router.register(r'feed', FeedItemViewSet)
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'connections', ConnectionViewSet, basename='connection')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'clips', ClipViewSet, basename='clip')
router.register(r'credit-verifications', CreditVerificationViewSet, basename='credit-verification')
router.register(r'bookings', BookingOfferViewSet, basename='booking')
router.register(r'feed-comments', FeedItemCommentViewSet, basename='feed-comment')
router.register(r'follows', FollowViewSet, basename='follow')
router.register(r'subscription-tiers', SubscriptionTierViewSet, basename='subscription-tier')
router.register(r'availability', AvailabilityViewSet, basename='availability')
router.register(r'events', EventViewSet, basename='event')
router.register(r'skill-entries', SkillEntryViewSet, basename='skill-entry')
router.register(r'credits', CreditViewSet, basename='credit')
router.register(r'union-affiliations', UnionAffiliationViewSet, basename='union-affiliation')
router.register(r'endorsements', EndorsementViewSet, basename='endorsement')
router.register(r'slots', AuditionSlotViewSet, basename='audition-slot')
router.register(r'callback-rounds', CallbackRoundViewSet, basename='callback-round')
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'blocks', BlockViewSet, basename='block')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('auth/notification-prefs/', NotificationPrefsView.as_view(), name='notification-prefs'),
    path('analytics/dashboard/', DashboardView.as_view(), name='dashboard'),
    path('verification/', VerificationView.as_view(), name='verification'),
    path('profile/', ProfileView.as_view(), name='profile'),
    # ArtStage artist profile endpoints
    path('artists/<slug:username>/', ArtistProfileDetailView.as_view(), name='artist-profile'),
    path('artists/<slug:username>/reels/', ArtistReelsView.as_view(), name='artist-reels'),
    path('artists/<slug:username>/posts/', ArtistPostsView.as_view(), name='artist-posts'),
    path('artists/<slug:username>/availability/', ArtistAvailabilityView.as_view(), name='artist-availability'),
    path('artists/<slug:username>/livestream/', ArtistLivestreamView.as_view(), name='artist-livestream'),
    path('upload/', UploadView.as_view(), name='upload'),
    # ArtStage creation stubs
    path('reels/', ReelView.as_view(), name='reel-list-create'),
    path('reels/<int:reel_id>/comments/', ReelCommentsView.as_view(), name='reel-comments'),
    path('reels/<int:reel_id>/like/', LikeReelView.as_view(), name='reel-like'),
    path('posts/', PostCreateView.as_view(), name='post-create'),
    path('posts/<int:post_id>/like/', PostLikeView.as_view(), name='post-like'),
    path('posts/<int:post_id>/save/', PostSaveView.as_view(), name='post-save'),
    path('lives/', LiveCreateView.as_view(), name='live-list-create'),
    path('lives/<int:stream_id>/', LiveDetailView.as_view(), name='live-detail'),
    path('lives/<int:stream_id>/chat/', LiveChatView.as_view(), name='live-chat'),
    path('duets/', DuetCreateView.as_view(), name='duet-create'),
    path('roster/', RosterView.as_view(), name='roster'),
    path('hirers/', HirerSearchView.as_view(), name='hirer-search'),
]
