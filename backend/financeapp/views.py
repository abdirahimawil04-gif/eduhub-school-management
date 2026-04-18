from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Sum

from .models import FeeStructure, Invoice, InvoiceItem, Payment
from .serializers import (
    FeeStructureSerializer,
    InvoiceSerializer,
    InvoiceCreateSerializer,
    PaymentSerializer,
    PaymentCreateSerializer,
    FinanceDashboardSerializer,
)
from accounts.permissions import IsSuperAdminOrBranchAdminOrTeacher
from teacher.models import Teacher


class FeeStructureViewSet(viewsets.ModelViewSet):
    queryset = FeeStructure.objects.all()
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrBranchAdminOrTeacher]

    def get_queryset(self):
        user = self.request.user
        queryset = FeeStructure.objects.select_related("branch", "class_section")

        if user.role == "super_admin":
            pass
        elif user.branch:
            queryset = queryset.filter(branch=user.branch)

        class_id = self.request.query_params.get("class", None)
        if class_id:
            queryset = queryset.filter(class_section_id=class_id)

        is_active = self.request.query_params.get("is_active", None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        return queryset

    def perform_create(self, serializer):
        serializer.save()


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrBranchAdminOrTeacher]

    def get_queryset(self):
        user = self.request.user
        queryset = Invoice.objects.select_related("branch", "student", "student__user")

        if user.role == "super_admin":
            pass
        elif user.branch:
            queryset = queryset.filter(branch=user.branch)

        student_id = self.request.query_params.get("student", None)
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        status_filter = self.request.query_params.get("status", None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by("-issue_date")

    def get_serializer_class(self):
        if self.action == "create":
            return InvoiceCreateSerializer
        return InvoiceSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["branch"] = self.request.user.branch
        return context

    @action(detail=True, methods=["post"])
    def add_payment(self, request, pk=None):
        invoice = self.get_object()
        serializer = PaymentCreateSerializer(data=request.data)

        if serializer.is_valid():
            try:
                teacher = Teacher.objects.get(user=request.user)
            except Teacher.DoesNotExist:
                teacher = None

            payment = Payment.objects.create(
                invoice=invoice, received_by=teacher, **serializer.validated_data
            )

            invoice.paid_amount += serializer.validated_data["amount"]

            if invoice.paid_amount >= invoice.total_amount:
                invoice.status = "paid"
            elif invoice.paid_amount > 0:
                invoice.status = "partial"

            invoice.save()

            return Response(
                PaymentSerializer(payment).data, status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["post"])
    def generate_bulk(self, request):
        class_section_id = request.data.get("class_section")
        fee_structure_ids = request.data.get("fee_structures", [])
        due_date = request.data.get("due_date")

        from academics.models import ClassSection

        class_section = ClassSection.objects.get(id=class_section_id)
        students = class_section.students.filter(is_active=True)

        created = []
        for student in students:
            total_amount = 0
            items = []

            for fs_id in fee_structure_ids:
                fee = FeeStructure.objects.get(id=fs_id)
                total_amount += fee.amount
                items.append(
                    {
                        "fee_structure": fee,
                        "description": fee.name,
                        "amount": fee.amount,
                    }
                )

            if total_amount > 0:
                invoice = Invoice.objects.create(
                    branch=class_section.branch,
                    student=student,
                    invoice_number=f"INV-{class_section.branch.code}-{timezone.now().strftime('%Y%m%d%H%M%S')}-{student.admission_number}",
                    issue_date=timezone.now().date(),
                    due_date=due_date,
                    status="sent",
                    total_amount=total_amount,
                )

                for item in items:
                    InvoiceItem.objects.create(
                        invoice=invoice,
                        fee_structure=item["fee_structure"],
                        description=item["description"],
                        amount=item["amount"],
                    )

                created.append(str(invoice.id))

        return Response(
            {"created": len(created), "invoices": created},
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"])
    def dashboard(self, request):
        user = request.user
        queryset = Invoice.objects.filter(branch=user.branch)

        total_invoiced = (
            queryset.aggregate(Sum("total_amount"))["total_amount__sum"] or 0
        )
        total_collected = (
            queryset.aggregate(Sum("paid_amount"))["paid_amount__sum"] or 0
        )

        return Response(
            {
                "total_invoiced": float(total_invoiced),
                "total_collected": float(total_collected),
                "total_pending": float(total_invoiced - total_collected),
                "paid_invoices": queryset.filter(status="paid").count(),
                "partial_invoices": queryset.filter(status="partial").count(),
                "overdue_invoices": queryset.filter(status="overdue").count(),
            }
        )


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Payment.objects.select_related("invoice", "received_by")

        if user.role == "super_admin":
            pass
        elif user.branch:
            queryset = queryset.filter(invoice__branch=user.branch)

        invoice_id = self.request.query_params.get("invoice", None)
        if invoice_id:
            queryset = queryset.filter(invoice_id=invoice_id)

        return queryset.order_by("-payment_date")

    def get_serializer_class(self):
        if self.action in ["create"]:
            return PaymentCreateSerializer
        return PaymentSerializer
