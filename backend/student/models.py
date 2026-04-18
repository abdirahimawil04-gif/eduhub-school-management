import uuid
from django.db import models
from django.core.exceptions import ValidationError
from accounts.models import Branch, User


class Student(models.Model):
    GENDER_CHOICES = [
        ("male", "Male"),
        ("female", "Female"),
        ("other", "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="student_profile"
    )
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="students"
    )
    admission_number = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    date_of_birth = models.DateField()
    photo = models.ImageField(upload_to="students/", blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    parent_name = models.CharField(max_length=200, blank=True)
    parent_phone = models.CharField(max_length=20, blank=True)
    parent_email = models.EmailField(blank=True)
    roll_number = models.CharField(max_length=20, blank=True)
    admission_date = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-admission_date"]
        indexes = [
            models.Index(fields=["branch"]),
            models.Index(fields=["admission_number"]),
            models.Index(fields=["roll_number"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.admission_number} - {self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def clean(self):
        if not self.pk:
            org = self.branch.organization
            if hasattr(org, "subscription"):
                sub = org.subscription
                if sub and sub.plan:
                    current_count = Student.objects.filter(branch=self.branch).count()
                    if current_count >= sub.plan.max_students:
                        raise ValidationError(
                            f"Student limit ({sub.plan.max_students}) reached. Upgrade your plan."
                        )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)