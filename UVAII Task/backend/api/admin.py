from django.contrib import admin
from .models import (
    User, Talent, Opportunity, Application, FeedItem, FeedItemLike, FeedItemComment,
    Message, Connection, Notification, VerificationRequest, CreditVerification,
    BookingOffer, Follow, Block, Report,
    ArtistProfile, Credit, UnionAffiliation,
    Reel, ReelStats, ReelComment,
    ArtStagePost, PostStats, LiveStream, Duet,
    AvailabilityWindow, SubscriptionTier,
)

admin.site.register(User)
admin.site.register(Talent)
admin.site.register(Opportunity)
admin.site.register(Application)
admin.site.register(FeedItem)
admin.site.register(FeedItemLike)
admin.site.register(FeedItemComment)
admin.site.register(Message)
admin.site.register(Connection)
admin.site.register(Notification)
admin.site.register(VerificationRequest)
admin.site.register(CreditVerification)
admin.site.register(BookingOffer)
admin.site.register(Follow)
admin.site.register(Block)
admin.site.register(Report)
admin.site.register(ArtistProfile)
admin.site.register(Credit)
admin.site.register(UnionAffiliation)
admin.site.register(Reel)
admin.site.register(ReelStats)
admin.site.register(ReelComment)
admin.site.register(ArtStagePost)
admin.site.register(PostStats)
admin.site.register(LiveStream)
admin.site.register(Duet)
admin.site.register(AvailabilityWindow)
admin.site.register(SubscriptionTier)
