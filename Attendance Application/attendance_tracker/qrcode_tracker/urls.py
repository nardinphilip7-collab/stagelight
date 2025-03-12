# qrcode_tracker/urls.py
from django.urls import path
from django.contrib.auth.views import LogoutView
from . import views

urlpatterns = [
    path('', views.upload_excel, name='upload_excel'),  # Default route
    path('login/', views.login_view, name='login'),
    path('logout/', LogoutView.as_view(next_page='login'), name='logout'),
    path('configure/', views.configure_app, name='configure_app'),
    path('upload/', views.upload_excel, name='upload_excel'),
    path('attendees/', views.attendee_list, name='attendee_list'),
    path('flush-attendees/', views.flush_attendees, name='flush_attendees'),
    path('generate-qr-stickers/', views.generate_qr_stickers, name='generate_qr_stickers'),
    path('scan/<str:code>/', views.scan_qr, name='scan_qr'),
    path('scan/', views.scan_page, name='scan_page'),
    path('attendance/', views.attendance_list, name='attendance_list'),
    path('flush-attendance/', views.flush_attendance, name='flush_attendance'),
]