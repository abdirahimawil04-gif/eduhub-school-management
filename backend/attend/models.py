import uuid
from django.db import models
from django.contrib.auth import get_user_model
from accounts.models import Branch
from student.models import Student
from teacher.models import Teacher

User = get_user_model()


class Attendance(models.Model):
    STATUS_CHOICES = [
        ("present", "Present"),
        ("absent", "Absent"),
        ("late", "Late"),
        ("leave", "Leave"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="attendances"
    )
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="student_attendances"
    )
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    marked_by = models.ForeignKey(
        Teacher,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="marked_student_attendance",
    )
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "student"]
        unique_together = ["student", "date"]
        indexes = [
            models.Index(fields=["branch", "date"]),
            models.Index(fields=["student", "date"]),
        ]

    def __str__(self):
        return f"{self.student.full_name} - {self.date} - {self.status}"


class TeacherAttendance(models.Model):
    STATUS_CHOICES = [
        ("present", "Present"),
        ("absent", "Absent"),
        ("late", "Late"),
        ("leave", "Leave"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(
        Teacher, on_delete=models.CASCADE, related_name="attendances"
    )
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="teacher_attendances"
    )
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    marked_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="marked_teacher_attendance",
    )
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "teacher"]
        unique_together = ["teacher", "date"]

    def __str__(self):
        return f"{self.teacher.full_name} - {self.date} - {self.status}"
