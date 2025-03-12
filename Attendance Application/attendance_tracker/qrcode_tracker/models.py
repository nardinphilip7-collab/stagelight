# qrcode_tracker/models.py
from django.db import models
from django.contrib.auth.models import User
import qrcode
from io import BytesIO
import base64

class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('organizer', 'Organizer'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='organizer')

    # Permission flags
    can_upload_excel = models.BooleanField(default=False)
    can_generate_qr_stickers = models.BooleanField(default=False)
    can_view_attendees = models.BooleanField(default=False)
    can_scan_qr = models.BooleanField(default=True)  # Organizers can scan QR by default
    can_view_attendance = models.BooleanField(default=True)  # Organizers can view attendance by default
    can_configure_app = models.BooleanField(default=False)
    can_flush_attendees = models.BooleanField(default=False)
    can_flush_attendance = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.role}"

    def save(self, *args, **kwargs):
        # Automatically set permissions based on role
        if self.role == 'admin':
            self.can_upload_excel = True
            self.can_generate_qr_stickers = True
            self.can_view_attendees = True
            self.can_scan_qr = True
            self.can_view_attendance = True
            self.can_configure_app = True
            self.can_flush_attendees = True
            self.can_flush_attendance = True
        elif self.role == 'organizer':
            self.can_upload_excel = False
            self.can_generate_qr_stickers = False
            self.can_view_attendees = False
            self.can_scan_qr = True
            self.can_view_attendance = True
            self.can_configure_app = False
            self.can_flush_attendees = False
            self.can_flush_attendance = False
        super().save(*args, **kwargs)

class Configuration(models.Model):
    app_name = models.CharField(max_length=100, default="ACOC Iftar Attendance System")
    excel_columns = models.JSONField(default=list)  # Store column names as a list
    qr_layout = models.JSONField(default=list)  # Store layout fields as a list
    is_configured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.app_name

class Attendee(models.Model):
    name = models.CharField(max_length=100)
    job_title = models.CharField(max_length=100)
    extra_data = models.JSONField(default=dict, blank=True, null=True)  # Store dynamic fields as JSON
    qr_code = models.CharField(max_length=100, unique=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def get_qr_code_image(self):
        qr = qrcode.QRCode(version=1, box_size=5, border=2)
        qr.add_data(self.qr_code)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
        return img_str

    def __str__(self):
        return self.name

    def get_dynamic_field(self, field_name):
        """Helper method to get a dynamic field value from extra_data."""
        return self.extra_data.get(field_name.lower()) if self.extra_data else None

class Attendance(models.Model):
    attendee = models.ForeignKey(Attendee, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='Present')