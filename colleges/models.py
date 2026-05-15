from django.db import models


# -------------------------
# College Model
# -------------------------
class College(models.Model):
    college_code = models.CharField(max_length=20, unique=True)
    college_name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.college_name} ({self.college_code})"


# -------------------------
# Department Model
# -------------------------
class Department(models.Model):
    college = models.ForeignKey(
        College,
        on_delete=models.CASCADE,
        related_name="departments"
    )
    department_name = models.CharField(max_length=150)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("college", "department_name")

    def __str__(self):
        return f"{self.department_name} - {self.college.college_name}"


# -------------------------
# Class Model
# -------------------------
class Class(models.Model):
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="classes"
    )
    class_name = models.CharField(max_length=100)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("department", "class_name")

    def __str__(self):
        return f"{self.class_name} - {self.department.department_name}"