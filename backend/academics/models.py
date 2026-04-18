import uuid
from django.db import models
from accounts.models import Branch
from teacher.models import Teacher


class AcademicYear(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="academic_years"
    )
    name = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-start_date"]
        unique_together = ["branch", "name"]
        indexes = [
            models.Index(fields=["branch", "name"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.branch.name})"


class ClassSection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="class_sections"
    )
    name = models.CharField(max_length=100)
    class_level = models.PositiveIntegerField(
        help_text="Class number (e.g., 1, 2, 3...10, 11, 12)"
    )
    section = models.CharField(max_length=10, blank=True)
    class_teacher = models.ForeignKey(
        Teacher,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="class_teacher_of",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["class_level", "section"]
        unique_together = ["branch", "class_level", "section"]
        indexes = [
            models.Index(fields=["branch"]),
            models.Index(fields=["class_level"]),
        ]

    def __str__(self):
        return f"Class {self.class_level} - {self.section or 'N/A'}"


class Subject(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="subjects"
    )
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20)
    class_section = models.ForeignKey(
        "academics.ClassSection", on_delete=models.CASCADE, related_name="subjects"
    )
    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subjects",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["class_section", "name"]
        unique_together = ["branch", "code", "class_section"]

    def __str__(self):
        return f"{self.name} ({self.class_section.name})"


class Exam(models.Model):
    EXAM_TYPE_CHOICES = [
        ("terminal", "Terminal"),
        ("unit", "Unit Test"),
        ("final", "Final Exam"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="exams")
    academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.CASCADE, related_name="exams"
    )
    name = models.CharField(max_length=100)
    exam_type = models.CharField(max_length=20, choices=EXAM_TYPE_CHOICES)
    class_section = models.ForeignKey(
        "academics.ClassSection", on_delete=models.CASCADE, related_name="exams"
    )
    start_date = models.DateField()
    end_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.name} - {self.class_section.name}"


class ExamResult(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="results")
    student = models.ForeignKey(
        "student.Student", on_delete=models.CASCADE, related_name="exam_results"
    )
    subject = models.ForeignKey(
        "academics.Subject", on_delete=models.CASCADE, related_name="exam_results"
    )
    marks = models.DecimalField(max_digits=5, decimal_places=2)
    grade = models.CharField(max_length=5, blank=True)
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["student", "subject"]
        unique_together = ["exam", "student", "subject"]
        indexes = [
            models.Index(fields=["exam", "student"]),
            models.Index(fields=["student"]),
        ]

    def __str__(self):
        return f"{self.exam.name} - {self.student.full_name} - {self.subject.name}"

    def save(self, *args, **kwargs):
        if self.marks >= 90:
            self.grade = "A+"
        elif self.marks >= 80:
            self.grade = "A"
        elif self.marks >= 70:
            self.grade = "B+"
        elif self.marks >= 60:
            self.grade = "B"
        elif self.marks >= 50:
            self.grade = "C"
        elif self.marks >= 40:
            self.grade = "D"
        else:
            self.grade = "F"
        super().save(*args, **kwargs)