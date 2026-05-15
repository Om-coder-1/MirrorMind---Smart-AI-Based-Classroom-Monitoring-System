from django.db import models
from django.utils import timezone
from colleges.models import College, Department, Class

class Student(models.Model):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=128)  

    is_active = models.BooleanField(default=True)

    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)

    enrollment_no = models.CharField(max_length=50, unique=True, blank=True, null=True)

    student_id = models.CharField(max_length=200, unique=True, blank=True, null=True)

    dob = models.DateField(null=True, blank=True)

    parent_name = models.CharField(max_length=100, null=True, blank=True)
    parent_email = models.EmailField(null=True, blank=True)
    parent_mobile = models.CharField(max_length=15, null=True, blank=True)

    email_verified = models.BooleanField(default=False)
    face_registered = models.BooleanField(default=False)
    terms_accepted = models.BooleanField(default=False)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

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

    student_class = models.ForeignKey(
        Class,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    def age(self):
        if not self.dob:
            return None
        today = timezone.now().date()
        return today.year - self.dob.year - (
            (today.month, today.day) < (self.dob.month, self.dob.day)
        )

    def requires_parent_consent(self):
        return self.age() is not None and self.age() < 10

    def __str__(self):
        return f"{self.first_name} {self.last_name} | {self.email}"