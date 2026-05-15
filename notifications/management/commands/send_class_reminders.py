import os
import smtplib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from django.core.management.base import BaseCommand
from django.utils import timezone

from notifications.models import ClassSchedule, Notification
from students.models import Student


class Command(BaseCommand):
    help = "Send email reminders to students 5 minutes before class starts"

    def handle(self, *args, **kwargs):
        self.stdout.write("=" * 50)
        self.stdout.write("MirrorMind - Email Reminder Service")
        self.stdout.write(f"Running at: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}")
        self.stdout.write("=" * 50)

        now = timezone.now()
        # Window: classes starting in next 4–6 minutes
        window_start = now + timedelta(minutes=4)
        window_end = now + timedelta(minutes=6)

        upcoming_schedules = ClassSchedule.objects.filter(
            status="scheduled",
        ).select_related(
            "teacher",
            "course_allocation",
            "course_allocation__class_assigned",
            "course_allocation__class_assigned__department",
        )

        reminder_count = 0
        email_count = 0

        for schedule in upcoming_schedules:
            # Combine schedule date + time into a timezone-aware datetime
            naive_dt = datetime.combine(schedule.date, schedule.start_time)
            if timezone.is_naive(naive_dt):
                schedule_datetime = timezone.make_aware(naive_dt)
            else:
                schedule_datetime = naive_dt

            if not (window_start <= schedule_datetime <= window_end):
                continue

            subject_name = schedule.course_allocation.subject_name
            class_obj = schedule.course_allocation.class_assigned
            teacher = schedule.teacher
            teacher_name = f"{teacher.first_name} {teacher.last_name}".strip()
            class_time = schedule.start_time.strftime("%I:%M %p")
            class_date = schedule.date.strftime("%d %B %Y")

            # Get students in this class
            students = Student.objects.filter(student_class=class_obj).select_related()

            self.stdout.write(
                f"\n📅 Schedule: {subject_name} | Class: {class_obj.class_name} | "
                f"Time: {class_time} | Students: {students.count()}"
            )

            for student in students:
                if not student.email:
                    continue

                # Check if reminder already sent for this schedule+student
                already_notified = Notification.objects.filter(
                    student=student,
                    schedule=schedule,
                    notification_type="class_reminder",
                ).exists()

                if already_notified:
                    self.stdout.write(
                        f"  ⏭️  Reminder already sent to {student.email}"
                    )
                    continue

                # Send email
                sent = self._send_reminder_email(
                    student_email=student.email,
                    student_name=f"{student.first_name} {student.last_name}".strip(),
                    subject_name=subject_name,
                    teacher_name=teacher_name,
                    class_name=class_obj.class_name,
                    class_time=class_time,
                    class_date=class_date,
                    schedule_id=schedule.id,
                )

                if sent:
                    # Save in-app notification
                    Notification.objects.create(
                        sent_by=teacher,
                        student=student,
                        class_target=class_obj,
                        title=f"⏰ Class Reminder: {subject_name} starts in 5 minutes!",
                        message=f"Your class {subject_name} with {teacher_name} starts at {class_time}. Please be ready!",
                        notification_type="class_reminder",
                        schedule=schedule,
                        is_read=False,
                    )
                    email_count += 1
                    self.stdout.write(
                        f"  ✅ Reminder sent to {student.email}"
                    )
                else:
                    self.stdout.write(
                        f"  ❌ Failed to send reminder to {student.email}"
                    )

            reminder_count += 1

        self.stdout.write(
            f"\n✅ Done! Processed {reminder_count} schedule(s), sent {email_count} email(s)."
        )

    def _send_reminder_email(
        self,
        student_email,
        student_name,
        subject_name,
        teacher_name,
        class_name,
        class_time,
        class_date,
        schedule_id,
    ):
        EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
        EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")

        if not EMAIL_HOST_USER or not EMAIL_HOST_PASSWORD:
            print("❌ EMAIL credentials not configured in environment variables.")
            return False

        email_subject = f"⏰ MirrorMind | Class Reminder: {subject_name} starts in 5 minutes!"

        html_body = f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body {{ font-family: Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }}
  .container {{ max-width: 540px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }}
  .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 24px; text-align: center; }}
  .header h1 {{ color: #fff; margin: 0; font-size: 22px; }}
  .header p {{ color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px; }}
  .body {{ padding: 28px 24px; }}
  .greeting {{ font-size: 16px; color: #333; margin-bottom: 16px; }}
  .alert-box {{ background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; }}
  .alert-box h2 {{ margin: 0 0 6px; color: #856404; font-size: 16px; }}
  .alert-box p {{ margin: 0; color: #856404; font-size: 14px; }}
  .info-table {{ width: 100%; border-collapse: collapse; margin-bottom: 20px; }}
  .info-table td {{ padding: 10px 14px; border-bottom: 1px solid #f0f0f0; font-size: 14px; }}
  .info-table td:first-child {{ color: #888; width: 40%; }}
  .info-table td:last-child {{ color: #333; font-weight: 600; }}
  .btn {{ display: block; width: fit-content; margin: 0 auto 10px; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 15px; font-weight: bold; }}
  .footer {{ background: #f8f9fa; padding: 16px; text-align: center; font-size: 12px; color: #aaa; }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🎓 MirrorMind</h1>
    <p>Smart Classroom Monitoring Platform</p>
  </div>
  <div class="body">
    <p class="greeting">Hello <strong>{student_name}</strong> 👋,</p>
    <div class="alert-box">
      <h2>⏰ Your class starts in 5 minutes!</h2>
      <p>Please get ready to join your live session.</p>
    </div>
    <table class="info-table">
      <tr><td>📚 Subject</td><td>{subject_name}</td></tr>
      <tr><td>🏫 Class</td><td>{class_name}</td></tr>
      <tr><td>👨‍🏫 Teacher</td><td>{teacher_name}</td></tr>
      <tr><td>📅 Date</td><td>{class_date}</td></tr>
      <tr><td>🕐 Time</td><td>{class_time}</td></tr>
    </table>
    <p style="text-align:center; color:#555; font-size:14px; margin-bottom:16px;">
      Log in to MirrorMind and click <strong>Join Class</strong> to attend.
    </p>
  </div>
  <div class="footer">
    You received this reminder because you are enrolled in this class on MirrorMind.<br>
    &copy; MirrorMind – Smarter Learning, Brighter Minds.
  </div>
</div>
</body>
</html>
"""

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = email_subject
            msg["From"] = EMAIL_HOST_USER
            msg["To"] = student_email
            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
                server.send_message(msg)
            return True

        except Exception as e:
            print(f"EMAIL ERROR for {student_email}: {e}")
            return False
