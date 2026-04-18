import uuid
from django.db import models
from django.core.exceptions import ValidationError
from accounts.models import Branch, User


class Teacher(models.Model):
    GENDER_CHOICES = [
        ("male", "Male"),
        ("female", "Female"),
        ("other", "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="teacher_profile"
    )
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="teachers"
    )
    employee_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    date_of_birth = models.DateField()
    photo = models.ImageField(upload_to="teachers/", blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    qualification = models.CharField(max_length=200, blank=True)
    experience = models.PositiveIntegerField(default=0)
    salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    join_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["first_name", "last_name"]
        indexes = [
            models.Index(fields=["branch"]),
            models.Index(fields=["employee_id"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.employee_id} - {self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def clean(self):
        if not self.pk:
            org = self.branch.organization
            if hasattr(org, "subscription"):
                sub = org.subscription
                if sub and sub.plan:
                    current_count = Teacher.objects.filter(branch=self.branch).count()
                    if current_count >= sub.plan.max_teachers:
                        raise ValidationError(
                            f"Teacher limit ({sub.plan.max_teachers}) reached. Upgrade your plan."
                        )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
