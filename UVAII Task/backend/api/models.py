from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_CHOICES = [
        ('ARTIST', 'Artist'),
        ('HIRER', 'Hirer'),
        ('AGENCY', 'Agency'),
        ('FAN', 'Fan'),
    ]
    username = None
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='ARTIST')

    notification_prefs = models.JSONField(default=dict, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email


class Talent(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    owner = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='talents')
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50, blank=True, default='artist', db_index=True)
    avatar = models.URLField(null=True, blank=True)
    verified = models.BooleanField(default=False)
    location = models.CharField(max_length=100, blank=True, db_index=True)
    followers = models.IntegerField(default=0)
    rating = models.FloatField(default=0.0)
    bio = models.TextField(blank=True)
    agency = models.CharField(max_length=100, null=True, blank=True)
    cover_gradient = models.CharField(max_length=100, default='from-violet-600 via-purple-700 to-indigo-800')
    skills = models.JSONField(default=list, blank=True)
    credits = models.JSONField(default=list, blank=True)
    badges = models.JSONField(default=list, blank=True)
    reel_url = models.URLField(null=True, blank=True)
    views = models.IntegerField(default=0)
    languages = models.JSONField(default=list, blank=True)
    union_name = models.CharField(max_length=100, null=True, blank=True)
    social_links = models.JSONField(default=dict, blank=True)
    discipline_data = models.JSONField(default=dict, blank=True)

    # --- Extended profile fields ---
    # Physical stats (actors/models): {height, weight, hair_color, eye_color, age_range, build, measurements}
    physical_stats = models.JSONField(default=dict, blank=True)
    # Travel: {passport_countries: [], works_local_cities: [], visa_notes: ''}
    travel_info = models.JSONField(default=dict, blank=True)
    # Formal training: [{school, program, year}]
    training = models.JSONField(default=list, blank=True)
    # Awards/laurels: [{name, project, year, festival, award_type}]
    awards = models.JSONField(default=list, blank=True)
    # Owned equipment (crew): [str]
    equipment = models.JSONField(default=list, blank=True)
    # Availability
    availability_status = models.CharField(max_length=30, default='Available', blank=True, db_index=True)
    availability_until = models.CharField(max_length=100, blank=True)
    # Endorsements/testimonials: [{author_name, author_role, author_avatar, text}]
    endorsements = models.JSONField(default=list, blank=True)
    # Pinned feed post id
    pinned_post_id = models.CharField(max_length=50, blank=True)
    # Name pronunciation audio url
    name_audio_url = models.URLField(null=True, blank=True)

    # Identity (private)
    legal_name = models.CharField(max_length=150, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)

    # Visibility controls
    profile_visibility = models.CharField(max_length=20, choices=[
        ('public', 'Public'),
        ('platform_only', 'Platform Only'),
        ('industry_only', 'Industry Only'),
        ('stealth', 'Stealth'),
    ], default='public')
    field_visibility = models.JSONField(default=dict, blank=True)

    # Extended professional fields
    sub_disciplines = models.JSONField(default=list, blank=True)
    press_mentions = models.JSONField(default=list, blank=True)
    external_links = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.name


class Opportunity(models.Model):
    SUBMISSION_TYPES = [
        ('PROFILE_ONLY', 'Profile Only'),
        ('SELF_TAPE', 'Self-Tape Video'),
        ('AUDIO', 'Audio Only'),
        ('LIVE_AUDITION', 'Live Audition Slot'),
        ('WRITTEN', 'Written / PDF'),
    ]
    id = models.CharField(max_length=50, primary_key=True)
    owner = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='opportunities')
    title = models.CharField(max_length=200)
    company = models.CharField(max_length=100)
    company_logo = models.CharField(max_length=50)
    type = models.CharField(max_length=100)
    category = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    compensation = models.CharField(max_length=100)
    deadline = models.CharField(max_length=100)
    urgent = models.BooleanField(default=False)
    featured = models.BooleanField(default=False)
    description = models.TextField()
    posted = models.CharField(max_length=100)
    applicants = models.IntegerField(default=0)
    requirements = models.JSONField(default=list, blank=True)
    questionnaire = models.JSONField(default=list, blank=True)
    portfolio_requirements = models.JSONField(default=list, blank=True)
    submission_type = models.CharField(max_length=20, choices=SUBMISSION_TYPES, default='SELF_TAPE')
    prompt_text = models.TextField(blank=True)
    allow_download = models.BooleanField(default=True)

    def __str__(self):
        return self.title


class AuditionSlot(models.Model):
    opportunity = models.ForeignKey(Opportunity, on_delete=models.CASCADE, related_name='slots')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    capacity = models.IntegerField(default=1)
    booked_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='booked_slots')
    location_or_link = models.CharField(max_length=500, blank=True)

    def __str__(self):
        return f"{self.opportunity.title} — {self.start_time}"


class Application(models.Model):
    STAGE_CHOICES = [
        ('New', 'New'),
        ('Shortlisted', 'Shortlisted'),
        ('Callback', 'Callback'),
        ('Approved', 'Approved'),
        ('Hired', 'Hired'),
        ('Rejected', 'Rejected'),
    ]
    REVIEW_STATE_CHOICES = [
        ('pending', 'Pending'),
        ('shortlisted', 'Shortlisted'),
        ('starred', 'Starred'),
        ('flagged', 'Flagged'),
        ('passed', 'Passed'),
    ]
    id = models.CharField(max_length=50, primary_key=True)
    opportunity = models.ForeignKey(Opportunity, on_delete=models.CASCADE, related_name='applications')
    talent = models.ForeignKey(Talent, on_delete=models.CASCADE, related_name='applications')
    stage = models.CharField(max_length=50, choices=STAGE_CHOICES, default='New', db_index=True)
    cover_note = models.TextField(blank=True)
    video_url = models.URLField(null=True, blank=True)
    notes = models.TextField(blank=True)
    questionnaire_answers = models.JSONField(default=dict, blank=True)
    portfolio_submissions = models.JSONField(default=dict, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    # Extended submission content
    audio_url = models.URLField(null=True, blank=True)
    pdf_urls = models.JSONField(default=list, blank=True)
    takes = models.JSONField(default=list, blank=True)
    selected_take = models.IntegerField(null=True, blank=True)
    clip_order = models.JSONField(default=list, blank=True)
    slate_data = models.JSONField(default=dict, blank=True)
    # Delivery controls
    visibility_consent = models.BooleanField(default=False)
    download_allowed = models.BooleanField(default=True)
    confirmation_sent = models.BooleanField(default=False)
    watermark_id = models.CharField(max_length=100, blank=True)
    # Review tools
    star_rating = models.IntegerField(null=True, blank=True)
    shared_notes = models.TextField(blank=True)
    tags = models.JSONField(default=list, blank=True)
    review_state = models.CharField(max_length=20, choices=REVIEW_STATE_CHOICES, default='pending')
    audition_slot = models.ForeignKey('AuditionSlot', null=True, blank=True, on_delete=models.SET_NULL, related_name='applications')

    def __str__(self):
        return f"{self.talent.name} - {self.opportunity.title}"


class ApplicationAuditLog(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='audit_log')
    user = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name='audit_entries')
    action = models.CharField(max_length=100)
    old_value = models.CharField(max_length=200, blank=True)
    new_value = models.CharField(max_length=200, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.application_id} — {self.action}"


class CallbackRound(models.Model):
    opportunity = models.ForeignKey(Opportunity, on_delete=models.CASCADE, related_name='callback_rounds')
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='callback_rounds')
    round_number = models.IntegerField(default=1)
    scheduled_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['round_number']

    def __str__(self):
        return f"{self.application} — Round {self.round_number}"


class FeedItem(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    owner = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='feed_items')
    author_name = models.CharField(max_length=100)
    author_role = models.CharField(max_length=100)
    author_avatar = models.URLField(blank=True)
    verified = models.BooleanField(default=False)
    time = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, blank=True)
    gradient = models.CharField(max_length=100)
    emoji = models.CharField(max_length=50)
    likes = models.IntegerField(default=0)
    comments = models.IntegerField(default=0)
    shares = models.IntegerField(default=0)
    attachments = models.JSONField(default=list, blank=True)
    repost_of = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='reposts')
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return f"{self.author_name} - {self.description[:20]}"


class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    body = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False, db_index=True)

    def __str__(self):
        return f"{self.sender.email} → {self.recipient.email}"


class Connection(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
    ]
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_connections')
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_connections')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('from_user', 'to_user')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.from_user.email} → {self.to_user.email} ({self.status})"


class Clip(models.Model):
    CLIP_TYPES = [
        ('reel', 'Reel'),
        ('performance', 'Performance'),
        ('commercial', 'Commercial'),
        ('short_film', 'Short Film'),
        ('music_video', 'Music Video'),
        ('headshot', 'Headshot'),
    ]
    talent = models.ForeignKey(Talent, on_delete=models.CASCADE, related_name='clip_set')
    title = models.CharField(max_length=200)
    url = models.URLField()
    clip_type = models.CharField(max_length=50, choices=CLIP_TYPES, default='reel')
    year = models.IntegerField(null=True, blank=True)
    language = models.CharField(max_length=50, blank=True)
    accent = models.CharField(max_length=80, blank=True)
    visibility = models.CharField(max_length=20, choices=[
        ('public', 'Public'), ('private', 'Private'), ('platform_only', 'Platform Only')
    ], default='public')
    download_allowed = models.BooleanField(default=False)
    pinned = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.talent.name} — {self.title}"


class Notification(models.Model):
    TYPE_CHOICES = [
        ('stage_change', 'Stage Change'),
        ('connection_request', 'Connection Request'),
        ('connection_accepted', 'Connection Accepted'),
        ('message', 'Message'),
        ('system', 'System'),
    ]
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='system')
    body = models.TextField()
    read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipient.email}: {self.body[:40]}"


class BookingOffer(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('DECLINED', 'Declined'),
        ('WITHDRAWN', 'Withdrawn'),
    ]
    opportunity = models.ForeignKey('Opportunity', null=True, blank=True, on_delete=models.SET_NULL, related_name='booking_offers')
    from_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_offers')
    to_talent = models.ForeignKey(Talent, on_delete=models.CASCADE, related_name='received_offers')
    amount = models.CharField(max_length=100)
    currency = models.CharField(max_length=10, default='USD')
    message = models.TextField(blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.from_user.email} → {self.to_talent.name}: {self.amount} ({self.status})"


class VerificationRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    DOC_CHOICES = [
        ('national_id', 'National ID'),
        ('passport', 'Passport'),
        ('union_card', "Actor's Union Card"),
        ('press_card', 'Press Card'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verification_requests')
    document_type = models.CharField(max_length=20, choices=DOC_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} — {self.document_type} ({self.status})"


class Follow(models.Model):
    fan = models.ForeignKey(User, on_delete=models.CASCADE, related_name='following')
    talent = models.ForeignKey(Talent, on_delete=models.CASCADE, related_name='follower_set')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('fan', 'talent')

    def __str__(self):
        return f"{self.fan.email} follows {self.talent.name}"


class SubscriptionTier(models.Model):
    talent = models.ForeignKey(Talent, on_delete=models.CASCADE, related_name='subscription_tiers')
    name = models.CharField(max_length=100)
    price_usd = models.DecimalField(max_digits=8, decimal_places=2)
    description = models.TextField()
    perks = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.talent.name} — {self.name} (${self.price_usd})"


class Event(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    owner = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='events')
    title = models.CharField(max_length=200)
    description = models.TextField()
    venue = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=100)
    event_date = models.DateTimeField()
    ticket_price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    capacity = models.IntegerField(default=100)
    is_virtual = models.BooleanField(default=False)
    stream_url = models.URLField(null=True, blank=True)
    cover_image = models.URLField(null=True, blank=True)
    published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['event_date']

    def __str__(self):
        return self.title


class EventTicket(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='tickets')
    attendee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_tickets')
    quantity = models.IntegerField(default=1)
    booked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('event', 'attendee')

    def __str__(self):
        return f"{self.attendee.email} → {self.event.title}"


class CreditVerification(models.Model):
    STATUS_CHOICES = [
        ('SELF_ASSERTED', 'Self Asserted'),
        ('PENDING', 'Pending Verification'),
        ('VERIFIED', 'Verified'),
    ]
    talent = models.ForeignKey(Talent, on_delete=models.CASCADE, related_name='credit_verifications')
    credit_title = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SELF_ASSERTED')
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.talent.name} — {self.credit_title} ({self.status})"


class Report(models.Model):
    CONTENT_TYPES = [('user', 'User'), ('talent', 'Talent'), ('post', 'Post'), ('message', 'Message')]
    REASONS = [('SPAM', 'Spam'), ('HARASSMENT', 'Harassment'), ('INAPPROPRIATE', 'Inappropriate Content'), ('FAKE', 'Fake Profile'), ('OTHER', 'Other')]
    STATUS_CHOICES = [('OPEN', 'Open'), ('REVIEWED', 'Reviewed'), ('DISMISSED', 'Dismissed')]
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_filed')
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPES)
    object_id = models.CharField(max_length=100)
    reason = models.CharField(max_length=20, choices=REASONS)
    detail = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Report by {self.reporter.email}: {self.content_type}/{self.object_id} ({self.reason})"


class Block(models.Model):
    blocker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocking')
    blocked = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('blocker', 'blocked')

    def __str__(self):
        return f"{self.blocker.email} blocked {self.blocked.email}"


# ─────────────────────────── ArtStage Models ────────────────────────────


class ArtistProfile(models.Model):
    """Extends the existing Talent record with ArtStage-specific fields."""
    DISCIPLINE_CHOICES = [
        ('actor', 'Actor'),
        ('singer', 'Singer'),
        ('dancer', 'Dancer'),
        ('musician', 'Musician'),
        ('voice_actor', 'Voice Actor'),
        ('comedian', 'Comedian'),
        ('presenter', 'Presenter'),
        ('director', 'Director'),
        ('choreographer', 'Choreographer'),
        ('composer', 'Composer'),
        ('screenwriter', 'Screenwriter'),
        ('cinematographer', 'Cinematographer'),
        ('visual_artist', 'Visual Artist'),
        ('model', 'Model'),
        ('stage_technician', 'Stage Technician'),
    ]
    talent = models.OneToOneField(Talent, on_delete=models.CASCADE, related_name='artstage_profile')
    username = models.SlugField(max_length=80, unique=True)
    primary_discipline = models.CharField(max_length=30, choices=DISCIPLINE_CHOICES, default='actor')
    secondary_disciplines = models.JSONField(default=list, blank=True)
    pronouns = models.CharField(max_length=40, blank=True)
    tagline = models.CharField(max_length=200, blank=True)
    playable_age_min = models.IntegerField(default=18)
    playable_age_max = models.IntegerField(default=35)
    identity_verified = models.BooleanField(default=False)
    headshots = models.JSONField(default=list, blank=True)
    cover_image = models.JSONField(null=True, blank=True)
    representation = models.JSONField(null=True, blank=True)
    submission_preferences = models.JSONField(default=dict, blank=True)
    following_count = models.IntegerField(default=0)
    onboarding_steps = models.JSONField(default=dict, blank=True)
    onboarding_complete = models.BooleanField(default=False)

    class Meta:
        ordering = ['username']

    def __str__(self):
        return f"@{self.username} ({self.primary_discipline})"

    def compute_onboarding_complete(self):
        """Basic info gate: stage name, primary discipline, location,
        at least one image (avatar or a headshot), and a bio."""
        t = self.talent
        has_image = bool(t.avatar) or bool(self.headshots)
        return bool(
            t.name and self.primary_discipline and t.location and has_image and t.bio
        )

    def refresh_onboarding_complete(self):
        """Recompute and persist onboarding_complete; returns the value."""
        value = self.compute_onboarding_complete()
        if value != self.onboarding_complete:
            self.onboarding_complete = value
            self.save(update_fields=['onboarding_complete'])
        return value


class Credit(models.Model):
    VERIFICATION_CHOICES = [
        ('self_asserted', 'Self Asserted'),
        ('pending', 'Pending'),
        ('verified', 'Verified'),
    ]
    talent = models.ForeignKey(Talent, on_delete=models.CASCADE, related_name='artstage_credits')
    title = models.CharField(max_length=200)
    role = models.CharField(max_length=100)
    year = models.IntegerField()
    production_type = models.CharField(max_length=50)  # Film, TV, Theater, Album, etc.
    billing = models.CharField(max_length=50, blank=True)
    director = models.CharField(max_length=100, blank=True)
    producing_entity = models.CharField(max_length=150, blank=True)
    verification = models.CharField(max_length=20, choices=VERIFICATION_CHOICES, default='self_asserted')
    verified_by = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['-year', 'title']

    collaborators = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.talent.name} — {self.role} in {self.title} ({self.year})"


class UnionAffiliation(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('financial_core', 'Financial Core'),
        ('eligible', 'Eligible'),
    ]
    VERIFICATION_CHOICES = [
        ('self_asserted', 'Self Asserted'),
        ('pending', 'Pending'),
        ('verified', 'Verified'),
    ]
    talent = models.ForeignKey(Talent, on_delete=models.CASCADE, related_name='union_affiliations')
    union = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    joined_year = models.IntegerField()
    verification = models.CharField(max_length=20, choices=VERIFICATION_CHOICES, default='self_asserted')

    def __str__(self):
        return f"{self.talent.name} — {self.union} ({self.status})"


class SkillEntry(models.Model):
    CATEGORIES = [
        ('language', 'Language'),
        ('accent', 'Accent/Dialect'),
        ('instrument', 'Instrument'),
        ('dance_style', 'Dance Style'),
        ('vocal', 'Vocal'),
        ('physical', 'Physical Skill'),
        ('driving', 'Driving License'),
        ('specialty', 'Specialty'),
    ]
    PROFICIENCY = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('fluent', 'Fluent'),
        ('native', 'Native'),
    ]
    talent = models.ForeignKey(Talent, on_delete=models.CASCADE, related_name='skill_entries')
    category = models.CharField(max_length=20, choices=CATEGORIES)
    name = models.CharField(max_length=100)
    proficiency = models.CharField(max_length=20, choices=PROFICIENCY, blank=True)
    endorsed_by = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.talent.name} — {self.category}: {self.name}"


class Reel(models.Model):
    REEL_TYPES = [
        ('monologue', 'Monologue'),
        ('song', 'Song'),
        ('dance', 'Dance'),
        ('voice_demo', 'Voice Demo'),
        ('comedy', 'Comedy'),
        ('reel', 'Showreel'),
        ('cover', 'Cover'),
    ]
    VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('platform_only', 'Platform Only'),
        ('industry_only', 'Industry Only'),
        ('scout_only', 'Scout Only'),
        ('link_only', 'Link Only'),
        ('private', 'Private'),
    ]
    artist = models.ForeignKey(Talent, on_delete=models.CASCADE, related_name='artstage_reels')
    title = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=REEL_TYPES, default='reel')
    duration = models.IntegerField(default=0)
    video_url = models.URLField()
    thumbnail_url = models.URLField()
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)   # Discipline-specific
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='public')
    scout_expires_at = models.DateField(null=True, blank=True)
    featured = models.BooleanField(default=False)
    has_captions = models.BooleanField(default=False)
    # 8.2 extended fields
    download_allowed = models.BooleanField(default=False)
    watermark_enabled = models.BooleanField(default=True)
    transcription = models.TextField(blank=True, default='')  # Auto-generated transcript
    captions = models.JSONField(default=list, blank=True)  # [{start, end, text}]
    audio_waveform = models.JSONField(default=list, blank=True)  # normalised peak array
    version_history = models.JSONField(default=list, blank=True)  # [{url, created_at, label}]
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.artist.name} — {self.title}"


class ReelStats(models.Model):
    reel = models.OneToOneField(Reel, on_delete=models.CASCADE, related_name='stats')
    plays = models.IntegerField(default=0)
    likes = models.IntegerField(default=0)
    saves = models.IntegerField(default=0)

    def __str__(self):
        return f"Stats for {self.reel.title}"


class ArtStagePost(models.Model):
    VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('platform_only', 'Platform Only'),
        ('industry_only', 'Industry Only'),
        ('scout_only', 'Scout Only'),
        ('private', 'Private'),
    ]
    artist = models.ForeignKey(Talent, on_delete=models.CASCADE, related_name='artstage_posts')
    content = models.TextField()
    attachments = models.JSONField(default=list, blank=True)  # [{url, alt, width, height}]
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='public')
    featured = models.BooleanField(default=False)
    pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.artist.name} — {self.content[:40]}"


class PostStats(models.Model):
    post = models.OneToOneField(ArtStagePost, on_delete=models.CASCADE, related_name='stats')
    likes = models.IntegerField(default=0)
    comments = models.IntegerField(default=0)
    saves = models.IntegerField(default=0)


class LiveStream(models.Model):
    VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('platform_only', 'Platform Only'),
        ('industry_only', 'Industry Only'),
    ]
    artist = models.ForeignKey(Talent, on_delete=models.CASCADE, related_name='live_streams')
    title = models.CharField(max_length=200)
    is_live = models.BooleanField(default=False)
    scheduled_for = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    viewer_count = models.IntegerField(default=0)
    co_hosts = models.JSONField(default=list, blank=True)
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='public')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.artist.name} — {self.title} ({'LIVE' if self.is_live else 'offline'})"


class LiveChatMessage(models.Model):
    stream = models.ForeignKey(LiveStream, on_delete=models.CASCADE, related_name='chat_messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='live_chat_messages')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.user.email} @ {self.stream_id}: {self.text[:40]}"


class Duet(models.Model):
    LAYOUT_CHOICES = [
        ('side_by_side', 'Side by Side'),
        ('picture_in_picture', 'Picture in Picture'),
        ('reaction', 'Reaction'),
    ]
    VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('platform_only', 'Platform Only'),
        ('industry_only', 'Industry Only'),
        ('scout_only', 'Scout Only'),
        ('private', 'Private'),
    ]
    artist = models.ForeignKey(Talent, on_delete=models.CASCADE, related_name='duets')
    original_reel = models.ForeignKey(Reel, on_delete=models.CASCADE, related_name='duet_responses')
    video_url = models.URLField()
    thumbnail_url = models.URLField()
    layout = models.CharField(max_length=25, choices=LAYOUT_CHOICES, default='side_by_side')
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='public')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.artist.name} duet on {self.original_reel.title}"


class AvailabilityWindow(models.Model):
    STATE_CHOICES = [
        ('available', 'Available'),
        ('tentative', 'Tentative'),
        ('unavailable', 'Unavailable'),
        ('booked', 'Booked'),
    ]
    artist = models.ForeignKey(Talent, on_delete=models.CASCADE, related_name='availability_windows')
    start_date = models.DateField()
    end_date = models.DateField()
    state = models.CharField(max_length=15, choices=STATE_CHOICES, default='available')
    willing_to_travel = models.BooleanField(default=True)
    travel_radius = models.IntegerField(null=True, blank=True)
    note = models.TextField(blank=True)
    booking_reference = models.CharField(max_length=100, blank=True)

    class Meta:
        ordering = ['start_date']

    def __str__(self):
        return f"{self.artist.name}: {self.state} {self.start_date}–{self.end_date}"


class ReelComment(models.Model):
    reel = models.ForeignKey(Reel, on_delete=models.CASCADE, related_name='reel_comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reel_comments')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.author.email}: {self.text[:40]}"


class FeedItemLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feed_likes')
    feed_item = models.ForeignKey(FeedItem, on_delete=models.CASCADE, related_name='like_set')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'feed_item')

    def __str__(self):
        return f"{self.user.email} liked {self.feed_item.id}"


class ReelLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reel_likes')
    reel = models.ForeignKey(Reel, on_delete=models.CASCADE, related_name='like_set')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'reel')

    def __str__(self):
        return f"{self.user.email} liked reel {self.reel.id}"


class PostLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_likes')
    post = models.ForeignKey(ArtStagePost, on_delete=models.CASCADE, related_name='like_set')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')

    def __str__(self):
        return f"{self.user.email} liked post {self.post.id}"


class PostSave(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_saves')
    post = models.ForeignKey(ArtStagePost, on_delete=models.CASCADE, related_name='save_set')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')

    def __str__(self):
        return f"{self.user.email} saved post {self.post.id}"


class ReelSave(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reel_saves')
    reel = models.ForeignKey(Reel, on_delete=models.CASCADE, related_name='save_set')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'reel')

    def __str__(self):
        return f"{self.user.email} saved reel {self.reel.id}"


class FeedItemComment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feed_comments')
    feed_item = models.ForeignKey(FeedItem, on_delete=models.CASCADE, related_name='comment_set')
    text = models.TextField()
    author_name = models.CharField(max_length=100, blank=True)
    author_avatar = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.author_name}: {self.text[:40]}"


class Endorsement(models.Model):
    talent = models.ForeignKey(Talent, on_delete=models.CASCADE, related_name='peer_endorsements')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_endorsements')
    text = models.TextField()
    skill_category = models.CharField(max_length=20, blank=True)
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('talent', 'author')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.author.email} → {self.talent.name}"
