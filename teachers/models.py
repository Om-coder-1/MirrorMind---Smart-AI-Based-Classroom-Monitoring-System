from django.db import models
from django.utils import timezone
import uuid
from colleges.models import College, Department, Class

# =========================================================
# TEACHER MODEL
# =========================================================
class Teacher(models.Model):

    # -----------------------------
    # BASIC INFO
    # -----------------------------
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)

    email = models.EmailField(unique=True)
    teacher_id = models.CharField(max_length=50, unique=True)

    password = models.CharField(max_length=128)  # hashed password

    college = models.ForeignKey(
        College,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    qualification = models.CharField(
        max_length=50,
        choices=[
            ("phd", "PhD"),
            ("masters", "Masters"),
            ("bachelors", "Bachelors"),
            ("diploma", "Diploma"),
            ("other", "Other"),
        ],
        blank=True,
        null=True
    )

    experience = models.CharField(
        max_length=20,
        choices=[
            ("0-2", "0-2 years"),
            ("3-5", "3-5 years"),
            ("6-10", "6-10 years"),
            ("10+", "10+ years"),
        ],
        blank=True,
        null=True
    )

    # -----------------------------
    # STATUS
    # -----------------------------
    email_verified = models.BooleanField(default=False)
    terms_accepted = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    # -----------------------------
    # TIMESTAMPS
    # -----------------------------
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(blank=True, null=True)

    # -----------------------------
    # STRING
    # -----------------------------
    def __str__(self):
        return f"{self.first_name} {self.last_name} | {self.teacher_id} | {self.email}"

    # -----------------------------
    # BUSINESS LOGIC
    # -----------------------------
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def verify_email(self):
        self.email_verified = True
        self.save(update_fields=["email_verified"])

    def deactivate_account(self):
        self.is_active = False
        self.save(update_fields=["is_active"])

    def activate_account(self):
        self.is_active = True
        self.save(update_fields=["is_active"])

    def is_profile_complete(self):
        return all([
            self.first_name,
            self.last_name,
            self.department,
            self.college,
            self.teacher_id
        ])
    


class CourseAllocation(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='course_allocations')
    college = models.ForeignKey(College, on_delete=models.CASCADE)
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    class_assigned = models.ForeignKey(Class, on_delete=models.CASCADE, verbose_name="Class")
    subject_name = models.CharField(max_length=200)
    academic_year = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['teacher', 'class_assigned', 'subject_name', 'academic_year']
        db_table = 'teacher_courseallocation' 

    def __str__(self):
        return f"{self.teacher} | {self.subject_name}"