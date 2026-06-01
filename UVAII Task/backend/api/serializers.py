import datetime
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    Talent, Opportunity, Application, FeedItem, FeedItemLike, FeedItemComment,
    User, Message, Connection, Notification, VerificationRequest, Clip,
    CreditVerification, BookingOffer, Follow, SubscriptionTier, Report, Block,
    ArtistProfile, Credit, UnionAffiliation, SkillEntry, Reel, ReelStats, ReelLike, ReelComment, ArtStagePost,
    PostStats, PostLike, PostSave, LiveStream, LiveChatMessage, Duet, AvailabilityWindow, Event, EventTicket, Endorsement,
    AuditionSlot, ApplicationAuditLog, CallbackRound,
)


# ── Shared validation helpers (defense in depth; mirror the frontend rules) ──
YEAR_MIN = 1900
YEAR_MAX = datetime.date.today().year + 10
AGE_MIN = 0
AGE_MAX = 120
_url_validator = URLValidator(schemes=["http", "https"])


def _is_plausible_year(value):
    """Blank/None passes; otherwise must be a 4-digit year within bounds."""
    if value in (None, "", []):
        return True
    s = str(value).strip()
    if not s.isdigit() or len(s) != 4:
        return False
    return YEAR_MIN <= int(s) <= YEAR_MAX


def _is_valid_url(value):
    """Blank/None passes; otherwise must be a valid http(s) URL."""
    if not value or not str(value).strip():
        return True
    try:
        _url_validator(str(value).strip())
        return True
    except DjangoValidationError:
        return False


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'first_name', 'last_name', 'role')

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'date_joined', 'notification_prefs', 'company', 'location')
        read_only_fields = ('id', 'email', 'date_joined')


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['email'] = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = self.user.role
        data['user_id'] = self.user.id
        data['email'] = self.user.email
        return data


class TalentSerializer(serializers.ModelSerializer):
    # legal_name / date_of_birth are real writable model fields (so the owner can save them
    # via PUT /profile/). They are masked for everyone but the owner in to_representation.
    artstage_username = serializers.SerializerMethodField()
    owner_role = serializers.CharField(source='owner.role', read_only=True)

    class Meta:
        model = Talent
        fields = '__all__'

    def validate_date_of_birth(self, value):
        if value and value > datetime.date.today():
            raise serializers.ValidationError("Date of birth can't be in the future.")
        return value

    def validate_training(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Training must be a list.")
        for entry in value:
            if not isinstance(entry, dict):
                raise serializers.ValidationError("Each training entry must be an object.")
            sy, ey = entry.get('start_year'), entry.get('end_year')
            if not _is_plausible_year(sy) or not _is_plausible_year(ey):
                raise serializers.ValidationError(
                    f"Training years must be 4-digit values between {YEAR_MIN} and {YEAR_MAX}.")
            if sy and ey and str(sy).isdigit() and str(ey).isdigit() and int(sy) > int(ey):
                raise serializers.ValidationError("Training start year can't be after its end year.")
        return value

    def validate_awards(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Awards must be a list.")
        for entry in value:
            if not isinstance(entry, dict):
                raise serializers.ValidationError("Each award must be an object.")
            if not _is_plausible_year(entry.get('year')):
                raise serializers.ValidationError(
                    f"Award year must be between {YEAR_MIN} and {YEAR_MAX}.")
            if not _is_valid_url(entry.get('url')):
                raise serializers.ValidationError("Award link must be a valid http(s) URL.")
        return value

    def validate_press_mentions(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Press mentions must be a list.")
        for entry in value:
            if isinstance(entry, dict) and not _is_valid_url(entry.get('url')):
                raise serializers.ValidationError("Press mention link must be a valid http(s) URL.")
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        req = self.context.get('request')
        if not (req and req.user == instance.owner):
            data['legal_name'] = None
            data['date_of_birth'] = None
        return data

    def get_artstage_username(self, obj):
        try:
            return obj.artstage_profile.username
        except Exception:
            return None


class OpportunitySerializer(serializers.ModelSerializer):
    tags = serializers.SerializerMethodField()

    class Meta:
        model = Opportunity
        fields = '__all__'

    def get_tags(self, obj):
        return [obj.category, obj.type, obj.location]


class ApplicationSerializer(serializers.ModelSerializer):
    talent_name = serializers.CharField(source='talent.name', read_only=True)
    talent_avatar = serializers.URLField(source='talent.avatar', read_only=True)
    talent_category = serializers.CharField(source='talent.category', read_only=True)
    opportunity_submission_type = serializers.CharField(source='opportunity.submission_type', read_only=True)
    talent_availability_status = serializers.CharField(source='talent.availability_status', read_only=True)

    class Meta:
        model = Application
        fields = '__all__'
        read_only_fields = ('id', 'submitted_at')


class AuditionSlotSerializer(serializers.ModelSerializer):
    booked_by_email = serializers.EmailField(source='booked_by.email', read_only=True)

    class Meta:
        model = AuditionSlot
        fields = ('id', 'opportunity', 'start_time', 'end_time', 'capacity', 'booked_by', 'booked_by_email', 'location_or_link')
        read_only_fields = ('id', 'booked_by', 'booked_by_email')


class ApplicationAuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = ApplicationAuditLog
        fields = ('id', 'application', 'user', 'user_email', 'action', 'old_value', 'new_value', 'timestamp', 'note')
        read_only_fields = ('id', 'user', 'user_email', 'timestamp')


class CallbackRoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = CallbackRound
        fields = ('id', 'opportunity', 'application', 'round_number', 'scheduled_date', 'notes')
        read_only_fields = ('id',)


class FeedItemCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedItemComment
        fields = ('id', 'feed_item', 'user', 'author_name', 'author_avatar', 'text', 'created_at')
        read_only_fields = ('id', 'user', 'author_name', 'author_avatar', 'created_at')


class FeedItemSerializer(serializers.ModelSerializer):
    has_liked = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    repost_of_detail = serializers.SerializerMethodField()

    class Meta:
        model = FeedItem
        fields = '__all__'
        read_only_fields = (
            'id', 'owner', 'author_name', 'author_role', 'author_avatar',
            'verified', 'time', 'gradient', 'emoji', 'likes', 'comments', 'shares',
        )

    def get_repost_of_detail(self, obj):
        if not obj.repost_of:
            return None
        # Walk to the true original so reposting a repost keeps the original's
        # image/description/author instead of an empty wrapper.
        original = obj.repost_of
        seen = {original.id}
        while original.repost_of_id and original.repost_of and original.repost_of.id not in seen:
            original = original.repost_of
            seen.add(original.id)
        return {
            'id': original.id,
            'author_name': original.author_name,
            'author_role': original.author_role,
            'author_avatar': original.author_avatar,
            'verified': original.verified,
            'time': original.time,
            'description': original.description,
            'attachments': original.attachments,
        }

    def get_has_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return any(like.user_id == request.user.id for like in obj.like_set.all())
        return False

    def get_comment_count(self, obj):
        return len(obj.comment_set.all())


class MessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.EmailField(source='sender.email', read_only=True)
    recipient_email = serializers.EmailField(source='recipient.email', read_only=True)

    class Meta:
        model = Message
        fields = ('id', 'sender', 'sender_email', 'recipient', 'recipient_email', 'body', 'sent_at', 'read')
        read_only_fields = ('id', 'sent_at', 'sender')


class ConnectionSerializer(serializers.ModelSerializer):
    from_user_email = serializers.EmailField(source='from_user.email', read_only=True)
    to_user_email = serializers.EmailField(source='to_user.email', read_only=True)

    class Meta:
        model = Connection
        fields = ('id', 'from_user', 'from_user_email', 'to_user', 'to_user_email', 'status', 'created_at')
        read_only_fields = ('id', 'from_user', 'created_at', 'status')


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'type', 'body', 'read', 'created_at')
        read_only_fields = ('id', 'type', 'body', 'created_at')


class VerificationRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerificationRequest
        fields = ('id', 'document_type', 'status', 'submitted_at')
        read_only_fields = ('id', 'status', 'submitted_at')


class ClipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clip
        fields = ('id', 'talent', 'title', 'url', 'clip_type', 'year', 'language',
                  'accent', 'visibility', 'download_allowed', 'pinned')
        read_only_fields = ('id',)


class CreditVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditVerification
        fields = ('id', 'talent', 'credit_title', 'status', 'submitted_at')
        read_only_fields = ('id', 'status', 'submitted_at')


class FollowSerializer(serializers.ModelSerializer):
    talent_name = serializers.CharField(source='talent.name', read_only=True)
    talent_avatar = serializers.URLField(source='talent.avatar', read_only=True)
    fan_email = serializers.EmailField(source='fan.email', read_only=True)

    class Meta:
        model = Follow
        fields = ('id', 'fan', 'fan_email', 'talent', 'talent_name', 'talent_avatar', 'created_at')
        read_only_fields = ('id', 'fan', 'created_at')


class SubscriptionTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionTier
        fields = ('id', 'talent', 'name', 'price_usd', 'description', 'perks', 'is_active')
        read_only_fields = ('id', 'talent')


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ('id', 'reporter', 'content_type', 'object_id', 'reason', 'detail', 'status', 'created_at')
        read_only_fields = ('id', 'reporter', 'status', 'created_at')


class BlockSerializer(serializers.ModelSerializer):
    blocked_email = serializers.EmailField(source='blocked.email', read_only=True)

    class Meta:
        model = Block
        fields = ('id', 'blocker', 'blocked', 'blocked_email', 'created_at')
        read_only_fields = ('id', 'blocker', 'created_at')


# ─────────────────────────── ArtStage Serializers ────────────────────────────

class SkillEntrySerializer(serializers.ModelSerializer):
    # Accept the frontend's richer category/proficiency taxonomy. The model keeps `choices`
    # for admin display only; overriding here bypasses the auto-generated ChoiceField so any
    # value is accepted (Django enforces choices at the form/serializer layer, not the DB).
    category = serializers.CharField()
    proficiency = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = SkillEntry
        fields = ('id', 'talent', 'category', 'name', 'proficiency', 'endorsed_by')
        read_only_fields = ('id', 'talent')


class CreditSerializer(serializers.ModelSerializer):
    class Meta:
        model = Credit
        fields = (
            'id', 'talent', 'title', 'role', 'year', 'production_type',
            'billing', 'director', 'producing_entity', 'verification', 'verified_by',
            'collaborators',
        )
        read_only_fields = ('id',)

    def validate_year(self, value):
        if not _is_plausible_year(value):
            raise serializers.ValidationError(f"Year must be between {YEAR_MIN} and {YEAR_MAX}.")
        return value


class EndorsementSerializer(serializers.ModelSerializer):
    author_email = serializers.EmailField(source='author.email', read_only=True)
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = Endorsement
        fields = ('id', 'talent', 'author', 'author_email', 'author_name', 'text', 'skill_category', 'verified', 'created_at')
        read_only_fields = ('id', 'author', 'author_email', 'author_name', 'verified', 'created_at')

    def get_author_name(self, obj):
        try:
            t = obj.author.talents.first()
            return t.name if t else obj.author.email.split('@')[0]
        except Exception:
            return obj.author.email.split('@')[0]


class UnionAffiliationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnionAffiliation
        fields = ('id', 'talent', 'union', 'status', 'joined_year', 'verification')
        read_only_fields = ('id',)

    def validate_joined_year(self, value):
        if not _is_plausible_year(value):
            raise serializers.ValidationError(f"Joined year must be between {YEAR_MIN} and {YEAR_MAX}.")
        return value


class ReelStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReelStats
        fields = ('plays', 'likes', 'saves')


class ReelSerializer(serializers.ModelSerializer):
    stats = ReelStatsSerializer(read_only=True)
    talent_id = serializers.CharField(source='artist.id', read_only=True)
    talent_name = serializers.CharField(source='artist.name', read_only=True)
    talent_avatar = serializers.URLField(source='artist.avatar', read_only=True)
    talent_verified = serializers.BooleanField(source='artist.verified', read_only=True)
    likes = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    has_liked = serializers.SerializerMethodField()

    def get_likes(self, obj):
        try:
            return obj.stats.likes
        except Exception:
            return 0

    def get_comments(self, obj):
        return obj.reel_comments.count()

    def get_has_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return ReelLike.objects.filter(user=request.user, reel=obj).exists()
        return False

    class Meta:
        model = Reel
        fields = (
            'id', 'artist', 'talent_id', 'talent_name', 'talent_avatar', 'talent_verified',
            'title', 'type', 'duration', 'video_url', 'thumbnail_url', 'description',
            'metadata', 'visibility', 'scout_expires_at', 'featured', 'has_captions',
            # 8.2 extended fields
            'download_allowed', 'watermark_enabled', 'transcription',
            'captions', 'audio_waveform', 'version_history',
            'created_at', 'stats', 'likes', 'comments', 'has_liked',
        )
        read_only_fields = ('id', 'created_at')


class ReelCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()

    class Meta:
        model = ReelComment
        fields = ('id', 'reel', 'author', 'author_name', 'author_avatar', 'text', 'created_at')
        read_only_fields = ('id', 'author', 'author_name', 'author_avatar', 'created_at')

    def _get_talent(self, obj):
        return Talent.objects.filter(owner=obj.author).only('name', 'avatar').first()

    def get_author_name(self, obj):
        talent = self._get_talent(obj)
        return talent.name if talent else obj.author.email.split('@')[0]

    def get_author_avatar(self, obj):
        talent = self._get_talent(obj)
        return talent.avatar if talent else ''


class PostStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostStats
        fields = ('likes', 'comments', 'saves')


class ArtStagePostSerializer(serializers.ModelSerializer):
    stats = PostStatsSerializer(read_only=True)

    class Meta:
        model = ArtStagePost
        fields = (
            'id', 'artist', 'content', 'attachments', 'visibility',
            'featured', 'pinned', 'created_at', 'stats',
        )
        read_only_fields = ('id', 'created_at')


class LiveStreamSerializer(serializers.ModelSerializer):
    artist_name = serializers.CharField(source='artist.name', read_only=True)
    artist_avatar = serializers.URLField(source='artist.avatar', read_only=True)
    artist_username = serializers.SerializerMethodField()
    artist_user_id = serializers.IntegerField(source='artist.owner_id', read_only=True)

    def get_artist_username(self, obj):
        try:
            return obj.artist.artstage_profile.username
        except Exception:
            return ''

    class Meta:
        model = LiveStream
        fields = (
            'id', 'artist', 'artist_name', 'artist_avatar', 'artist_username', 'artist_user_id',
            'title', 'is_live', 'scheduled_for', 'started_at',
            'viewer_count', 'co_hosts', 'visibility', 'created_at',
        )
        read_only_fields = ('id', 'created_at')


class LiveChatMessageSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    def get_user_name(self, obj):
        try:
            t = obj.user.talents.first()
            if t and t.name:
                return t.name
        except Exception:
            pass
        return obj.user.email.split('@')[0]

    class Meta:
        model = LiveChatMessage
        fields = ('id', 'user', 'user_name', 'text', 'created_at')
        read_only_fields = ('id', 'user', 'user_name', 'created_at')


class DuetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Duet
        fields = (
            'id', 'artist', 'original_reel', 'video_url', 'thumbnail_url',
            'layout', 'visibility', 'created_at',
        )
        read_only_fields = ('id', 'created_at')


class AvailabilityWindowSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvailabilityWindow
        fields = (
            'id', 'artist', 'start_date', 'end_date', 'state',
            'willing_to_travel', 'travel_radius', 'note', 'booking_reference',
        )
        read_only_fields = ('id', 'artist')


class ArtistProfileSerializer(serializers.ModelSerializer):
    """Full artist profile: nested talent data + ArtStage profile fields + related data."""
    talent_id = serializers.CharField(source='talent.id', read_only=True)
    owner_user_id = serializers.IntegerField(source='talent.owner_id', read_only=True)
    # Accept any discipline value the frontend sends (e.g. "writer") instead of restricting to
    # the model's DISCIPLINE_CHOICES; bypasses the auto ChoiceField (no migration needed).
    primary_discipline = serializers.CharField(required=False)
    stage_name = serializers.CharField(source='talent.name', read_only=True)
    location = serializers.CharField(source='talent.location', read_only=True)
    bio = serializers.CharField(source='talent.bio', read_only=True)
    avatar = serializers.URLField(source='talent.avatar', read_only=True)
    verified = serializers.BooleanField(source='talent.verified', read_only=True)
    followers = serializers.IntegerField(source='talent.followers', read_only=True)
    # Extended talent fields
    sub_disciplines = serializers.JSONField(source='talent.sub_disciplines', read_only=True)
    press_mentions = serializers.JSONField(source='talent.press_mentions', read_only=True)
    external_links = serializers.JSONField(source='talent.external_links', read_only=True)
    profile_visibility = serializers.CharField(source='talent.profile_visibility', read_only=True)
    physical_stats = serializers.JSONField(source='talent.physical_stats', read_only=True)
    training = serializers.JSONField(source='talent.training', read_only=True)
    awards = serializers.JSONField(source='talent.awards', read_only=True)
    endorsements = serializers.JSONField(source='talent.endorsements', read_only=True)
    travel_info = serializers.JSONField(source='talent.travel_info', read_only=True)
    # Related sets
    credits = CreditSerializer(source='talent.artstage_credits', many=True, read_only=True)
    union_affiliations = UnionAffiliationSerializer(source='talent.union_affiliations', many=True, read_only=True)
    skill_entries = SkillEntrySerializer(source='talent.skill_entries', many=True, read_only=True)
    # Computed
    reels_count = serializers.SerializerMethodField()
    verified_credits_count = serializers.SerializerMethodField()
    completeness_score = serializers.SerializerMethodField()

    class Meta:
        model = ArtistProfile
        fields = (
            'id', 'username', 'talent_id', 'owner_user_id', 'stage_name', 'location', 'bio', 'avatar',
            'verified', 'followers', 'following_count',
            'primary_discipline', 'secondary_disciplines', 'pronouns', 'tagline',
            'playable_age_min', 'playable_age_max', 'identity_verified',
            'headshots', 'cover_image', 'representation', 'submission_preferences',
            'sub_disciplines', 'press_mentions', 'external_links', 'profile_visibility',
            'physical_stats', 'training', 'awards', 'endorsements', 'travel_info',
            'credits', 'union_affiliations', 'skill_entries',
            'reels_count', 'verified_credits_count', 'completeness_score',
            'onboarding_complete',
        )
        read_only_fields = ('id', 'onboarding_complete')

    def validate(self, attrs):
        # Fall back to the existing instance values for partial (PATCH) updates.
        pmin = attrs.get('playable_age_min', getattr(self.instance, 'playable_age_min', None))
        pmax = attrs.get('playable_age_max', getattr(self.instance, 'playable_age_max', None))
        for label, val in (("minimum", pmin), ("maximum", pmax)):
            if val is not None and not (AGE_MIN <= val <= AGE_MAX):
                raise serializers.ValidationError(
                    {f"playable_age_{'min' if label == 'minimum' else 'max'}":
                     f"Playable age {label} must be between {AGE_MIN} and {AGE_MAX}."})
        if pmin is not None and pmax is not None and pmin > pmax:
            raise serializers.ValidationError(
                {"playable_age_min": "Minimum playable age can't be greater than the maximum."})
        return attrs

    def get_reels_count(self, obj):
        return obj.talent.artstage_reels.count()

    def get_verified_credits_count(self, obj):
        return obj.talent.artstage_credits.filter(verification='verified').count()

    def get_completeness_score(self, obj):
        t = obj.talent
        checks = [
            bool(t.name), bool(t.bio), bool(t.avatar), bool(obj.tagline),
            bool(obj.primary_discipline), bool(obj.headshots),
            t.skill_entries.filter(category='language').exists(),
            t.artstage_credits.exists(), t.union_affiliations.exists(),
            bool(obj.representation), bool(t.training), bool(t.awards),
            bool(t.physical_stats), bool(t.travel_info),
        ]
        return round(sum(checks) / len(checks) * 100)


class EventTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventTicket
        fields = ('id', 'event', 'attendee', 'quantity', 'booked_at')
        read_only_fields = ('id', 'attendee', 'booked_at')


class EventSerializer(serializers.ModelSerializer):
    tickets_sold = serializers.SerializerMethodField()
    has_booked = serializers.SerializerMethodField()
    owner_email = serializers.EmailField(source='owner.email', read_only=True)

    class Meta:
        model = Event
        fields = (
            'id', 'owner', 'owner_email', 'title', 'description', 'venue', 'city',
            'event_date', 'ticket_price', 'capacity', 'is_virtual',
            'stream_url', 'cover_image', 'published', 'created_at',
            'tickets_sold', 'has_booked',
        )
        read_only_fields = ('owner', 'owner_email', 'created_at')

    def get_tickets_sold(self, obj):
        return sum(t.quantity for t in obj.tickets.all())

    def get_has_booked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.tickets.filter(attendee=request.user).exists()
        return False


class BookingOfferSerializer(serializers.ModelSerializer):
    talent_name = serializers.CharField(source='to_talent.name', read_only=True)
    talent_avatar = serializers.URLField(source='to_talent.avatar', read_only=True)
    from_user_email = serializers.EmailField(source='from_user.email', read_only=True)
    opportunity_title = serializers.CharField(source='opportunity.title', read_only=True, default='')

    class Meta:
        model = BookingOffer
        fields = ('id', 'opportunity', 'opportunity_title', 'from_user', 'from_user_email',
                  'to_talent', 'talent_name', 'talent_avatar', 'amount', 'currency',
                  'message', 'start_date', 'end_date', 'status', 'created_at', 'updated_at')
        read_only_fields = ('id', 'from_user', 'status', 'created_at', 'updated_at')
