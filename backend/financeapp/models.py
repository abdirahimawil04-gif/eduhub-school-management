import uuid
from django.db import models
from accounts.models import Branch
from academics.models import ClassSection
from student.models import Student
from teacher.models import Teacher


class FeeStructure(models.Model):
    FREQUENCY_CHOICES = [
        ("monthly", "Monthly"),
        ("termly", "Termly"),
        ("yearly", "Yearly"),
        ("one_time", "One Time"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="fee_structures"
    )
    class_section = models.ForeignKey(
        ClassSection, on_delete=models.CASCADE, related_name="fee_structures"
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    frequency = models.CharField(
        max_length=20, choices=FREQUENCY_CHOICES, default="termly"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - {self.class_section.name} - ${self.amount}"


class Invoice(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("sent", "Sent"),
        ("paid", "Paid"),
        ("partial", "Partial"),
        ("overdue", "Overdue"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="invoices"
    )
    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="invoices"
    )
    invoice_number = models.CharField(max_length=50, unique=True)
    issue_date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-issue_date"]

    def __str__(self):
        return f"{self.invoice_number} - {self.student.full_name}"

    @property
    def pending_amount(self):
        return self.total_amount - self.paid_amount

    @property
    def is_paid(self):
        return self.paid_amount >= self.total_amount


class InvoiceItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items")
    fee_structure = models.ForeignKey(
        FeeStructure, on_delete=models.CASCADE, null=True, blank=True
    )
    description = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.description} - ${self.amount}"


class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ("cash", "Cash"),
        ("bank_transfer", "Bank Transfer"),
        ("online", "Online"),
        ("cheque", "Cheque"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(
        Invoice, on_delete=models.CASCADE, related_name="payments"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    transaction_id = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    received_by = models.ForeignKey(
        Teacher,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="received_payments",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-payment_date"]

    def __str__(self):
        return f"{self.invoice.invoice_number} - ${self.amount} - {self.payment_date}"
