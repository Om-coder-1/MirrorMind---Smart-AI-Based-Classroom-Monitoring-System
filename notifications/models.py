# notification/models.py

from django.db import models
from teachers.models import Teacher
from students.models import Student
from colleges.models import Class

class ClassSchedule(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('ongoing', 'Live Now'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Who created this schedule
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='schedules')
    
    # Course details (college, department, class, subject automatically come from this)
    course_allocation = models.ForeignKey('teachers.CourseAllocation', on_delete=models.CASCADE)
    
    # Schedule details
    date = models.DateField()
    start_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    
    # Meeting details (generated when teacher starts class)
    meeting_link = models.URLField(max_length=500, blank=True)
    meeting_platform = models.CharField(max_length=50, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date', '-start_time']
        db_table = 'notification_classschedule'
    
    def __str__(self):
        return f"{self.course_allocation.subject_name} - {self.date} {self.start_time}"
    
    @property
    def college(self):
        return self.course_allocation.college
    
    @property
    def department(self):
        return self.course_allocation.department
    
    @property
    def class_assigned(self):
        return self.course_allocation.class_assigned
    
    @property
    def subject(self):
        return self.course_allocation.subject_name
    


    
class Notification(models.Model):
    TYPE_CHOICES = [
        ('schedule_created', 'New Class Scheduled'),
        ('schedule_updated', 'Schedule Updated'),
        ('schedule_cancelled', 'Class Cancelled'),
        ('class_started', 'Class Started'),
        ('class_ended', 'Class Ended'),
        ('class_reminder', 'Class Reminder'),
        ('teacher_notification', 'Teacher Notification'),
        ('reminder', 'Reminder'),
    ]
    
    # Who sent this notification (teacher)
    sent_by = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='sent_notifications')
    
    # Which student receives this notification
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    
    # Or send to entire class (if student is null)
    class_target = models.ForeignKey(Class, on_delete=models.CASCADE, null=True, blank=True)
    
    # Notification content
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='teacher_notification')
    
    # Is this notification read?
    is_read = models.BooleanField(default=False)
    
    # Related schedule (optional)
    schedule = models.ForeignKey('ClassSchedule', on_delete=models.CASCADE, null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        db_table = 'notification_notification'
        indexes = [
            models.Index(fields=['student', 'is_read']),
            models.Index(fields=['class_target', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.created_at.strftime('%d-%m-%Y')}"
    
    @property
    def recipient_count(self):
        """Kitī students la he notification gelay te count karte"""
        if self.student:
            return 1
        elif self.class_target:
            return Student.objects.filter(student_class=self.class_target).count()
        return 0


class EmotionLog(models.Model):
    """
    Stores per-student emotion snapshots during a live class.
    Used for analytics: engagement graph, per-student breakdown.
    """
    EMOTION_CHOICES = [
        ('Happy',       'Happy'),
        ('Focused',     'Focused'),
        ('Neutral',     'Neutral'),
        ('Bored',       'Bored'),
        ('Sad',         'Sad'),
        ('Sleepy',      'Sleepy'),
        ('Unavailable', 'Unavailable'),  # no face detected
    ]

    schedule   = models.ForeignKey(ClassSchedule, on_delete=models.CASCADE, related_name='emotion_logs')
    student    = models.ForeignKey(Student,        on_delete=models.CASCADE, related_name='emotion_logs')
    emotion    = models.CharField(max_length=20,   choices=EMOTION_CHOICES, default='Neutral')
    confidence = models.FloatField(default=0.0)
    logged_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notification_emotionlog'
        ordering = ['-logged_at']
        indexes = [
            models.Index(fields=['schedule', 'student']),
            models.Index(fields=['schedule', 'logged_at']),
        ]

    def __str__(self):
        return f"{self.student} | {self.emotion} | {self.schedule}"