from django.contrib import admin
from django.urls import path
from . import views
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # Home
    path("", views.home),

    # Face Capture and Attendance
    path('process-frame/', views.process_frame),
    path('face-capture/', views.face_capture),
    path("attendance/", views.attendance_page),
    path("attendance/mark/", views.mark_attendance),

    # Teacher Module
    path('teacher-signup/', views.teacher_signup),
    path('teacher-login/', views.teacher_login),
    path('teacher-dashboard/', views.teacher_dashboard),
    path('teacher-reset-password/', views.teacher_reset_password),
    path('teacher/send-otp/', views.teacher_send_otp),
    path('teacher/verify-otp/', views.teacher_verify_otp),

    # Student Module
    path('student-signup/', views.student_signup),
    path('student-login/', views.student_login),
    path('student-dashboard/', views.student_dashboard),
    path('student-reset-password/', views.student_reset_password),
    path('check_student_exists/', views.check_student_exists),

    # Common OTP Handler
    path('email_otp_handler/', views.email_otp_handler),

    # Colleges Module APIs
    path("api/check-college/", views.check_college),
    path("api/get-departments/<int:college_id>/", views.get_departments),
    path("api/get-classes/<int:department_id>/", views.get_classes),
    path("api/add-college/", views.add_college),
    path("api/add-department/", views.add_department),
    path("api/add-class/", views.add_class),

    # Notification Module APIs
    path('api/send-class-notification/', views.send_class_notification),
    path('api/teacher-allocated-classes/<int:teacher_id>/', views.get_teacher_allocated_classes),
    path('api/teacher-notifications/<int:teacher_id>/', views.get_teacher_notifications),
    path('api/mark-notification-read/<int:notification_id>/', views.mark_notification_read),
    path('api/mark-all-notifications-read/<int:student_id>/', views.mark_all_notifications_read),

    # Student APIs
    path('api/student-schedules/<int:student_id>/', views.get_student_schedules, name='student_schedules'),
    path('api/student-notifications/<int:student_id>/', views.get_student_notifications),
    path('api/check-class-access/<int:schedule_id>/<int:student_id>/', views.check_class_access),
    path('api/student-attendance/<int:student_id>/', views.get_student_attendance),

    # Teacher APIs
    path('api/teacher-courses/<int:teacher_id>/', views.get_teacher_courses),
    path('api/add-schedule/', views.add_schedule, name='add_schedule'),
    path('api/teacher-schedules/<int:teacher_id>/', views.get_teacher_schedules),
    path('api/update-schedule/<int:schedule_id>/', views.update_schedule),
    path('api/delete-schedule/<int:schedule_id>/', views.delete_schedule),
    path('api/start-class/<int:schedule_id>/', views.start_class),
    path('api/update-allocation/<int:allocation_id>/', views.update_allocation),
    path('api/delete-allocation/<int:allocation_id>/', views.delete_allocation),
    path('api/add-course-allocation/', views.add_course_allocation),
    path('api/teacher-allocations/<int:teacher_id>/', views.get_teacher_allocations),

    path("api/end-class/<int:schedule_id>/", views.end_class),

    # Analytics & Export
    path("api/export-attendance/", views.export_attendance_excel),
    path("api/analytics-data/", views.analytics_data),
    path("api/detect-emotion/", views.detect_emotion),

    # Other Pages
    path("live-room/", views.live_room),
    path("privacy-policy/", views.privacy_policy),
    path("term-condition/", views.term_condition),
    path("help-contact/", views.help_contact),
    path("about/", views.about),
    path("api/study-chatbot/", views.study_chatbot, name="study-chatbot"),
    
] + static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])