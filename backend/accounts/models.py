import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager


class BranchAwareModel(models.Model):
    branch = models.ForeignKey("Branch", on_delete=models.CASCADE)

    class Meta:
        abstract = True


class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    logo = models.ImageField(upload_to="organizations/", blank=True, null=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Organizations"

    def __str__(self):
        return self.name


class Branch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="branches"
    )
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    logo = models.ImageField(upload_to="branches/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["organization"]),
            models.Index(fields=["code"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "super_admin")
        return self.create_user(email, password, **extra_fields)


ROLE_CHOICES = [
    ("super_admin", "Super Admin"),
    ("branch_admin", "Branch Admin"),
    ("teacher", "Teacher"),
    ("student", "Student"),
    ("parent", "Parent"),
]


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=False, blank=True, null=True)
    branch = models.ForeignKey(
        Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name="users"
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="student")
    phone = models.CharField(max_length=20, blank=True)
    photo = models.ImageField(upload_to="users/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email.split("@")[0]
        super().save(*args, **kwargs)

    class Meta:
        ordering = ["email"]

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    @property
    def get_role_display_name(self):
        return dict(ROLE_CHOICES).get(self.role, self.role)


class Plan(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    max_students = models.IntegerField(default=100)
    max_teachers = models.IntegerField(default=20)
    max_branches = models.IntegerField(default=1)
    max_storage_gb = models.IntegerField(default=5)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["price"]

    def __str__(self):
        return f"{self.name} - ${self.price}/mo"


class Subscription(models.Model):
    organization = models.OneToOneField(
        Organization, on_delete=models.CASCADE, related_name="subscription"
    )
    plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, blank=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    auto_renew = models.BooleanField(default=True)
    grace_period_days = models.IntegerField(default=3)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return (
            f"{self.organization.name} - {self.plan.name if self.plan else 'No Plan'}"
        )

    @property
    def is_expired(self):
        from django.utils import timezone

        return timezone.now() > self.end_date

    def is_within_grace_period(self):
        from django.utils import timezone
        from datetime import timedelta

        grace_end = self.end_date + timedelta(days=self.grace_period_days)
        return timezone.now() <= grace_end


class AuditLog(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    branch = models.ForeignKey(
        Branch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=255)
    model_name = models.CharField(max_length=100)
    object_id = models.UUIDField(null=True, blank=True)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        verbose_name_plural = "Audit Logs"

    def __str__(self):
        return f"{self.action} - {self.model_name} - {self.timestamp}"
