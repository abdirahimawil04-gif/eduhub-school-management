from rest_framework import serializers
from .models import FeeStructure, Invoice, InvoiceItem, Payment
from accounts.serializers import BranchListSerializer
from student.serializers import StudentListSerializer
from teacher.serializers import TeacherListSerializer


class FeeStructureSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    class_name = serializers.CharField(source="class_section.name", read_only=True)

    class Meta:
        model = FeeStructure
        fields = [
            "id",
            "branch",
            "branch_name",
            "class_section",
            "class_name",
            "name",
            "description",
            "amount",
            "due_date",
            "frequency",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class InvoiceItemSerializer(serializers.ModelSerializer):
    fee_structure_name = serializers.CharField(
        source="fee_structure.name", read_only=True
    )

    class Meta:
        model = InvoiceItem
        fields = ["id", "fee_structure", "fee_structure_name", "description", "amount"]


class InvoiceSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    items = InvoiceItemSerializer(many=True, read_only=True)
    pending_amount = serializers.FloatField(read_only=True)
    is_paid = serializers.BooleanField(read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id",
            "branch",
            "branch_name",
            "student",
            "student_name",
            "invoice_number",
            "issue_date",
            "due_date",
            "status",
            "total_amount",
            "paid_amount",
            "pending_amount",
            "is_paid",
            "notes",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["invoice_number", "created_at", "updated_at"]

    def get_student_name(self, obj):
        return obj.student.full_name


class InvoiceCreateSerializer(serializers.ModelSerializer):
    items = serializers.ListField(child=serializers.DictField(), write_only=True)

    class Meta:
        model = Invoice
        fields = ["student", "issue_date", "due_date", "notes", "items"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        branch = self.context["branch"]

        invoice_number = f"INV-{branch.code}-{timezone.now().strftime('%Y%m%d%H%M%S')}"

        total_amount = sum(item.get("amount", 0) for item in items_data)

        invoice = Invoice.objects.create(
            branch=branch,
            invoice_number=invoice_number,
            total_amount=total_amount,
            **validated_data,
        )

        for item_data in items_data:
            InvoiceItem.objects.create(
                invoice=invoice,
                description=item_data.get("description", ""),
                amount=item_data.get("amount", 0),
                fee_structure_id=item_data.get("fee_structure_id"),
            )

        return invoice


class PaymentSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(
        source="invoice.invoice_number", read_only=True
    )
    received_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            "id",
            "invoice",
            "invoice_number",
            "amount",
            "payment_date",
            "payment_method",
            "transaction_id",
            "notes",
            "received_by",
            "received_by_name",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def get_received_by_name(self, obj):
        return obj.received_by.full_name if obj.received_by else None


class PaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "invoice",
            "amount",
            "payment_date",
            "payment_method",
            "transaction_id",
            "notes",
        ]


class FinanceDashboardSerializer(serializers.Serializer):
    total_invoiced = serializers.FloatField()
    total_collected = serializers.FloatField()
    total_pending = serializers.FloatField()
    paid_invoices = serializers.IntegerField()
    partial_invoices = serializers.IntegerField()
    overdue_invoices = serializers.IntegerField()
