from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter
from django.db.models import Q

from .models import Student
from .serializers import (
    StudentSerializer,
    StudentCreateSerializer,
    StudentListSerializer,
)
from accounts.permissions import IsSuperAdminOrBranchAdminOrTeacher
from accounts.utils import can_add_student, get_usage_stats


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ["first_name", "last_name", "admission_number", "roll_number"]

    def get_permissions(self):
        if self.action in ["create", "destroy"]:
            return [IsSuperAdminOrBranchAdminOrTeacher()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        queryset = Student.objects.select_related("user", "branch")

        if user.role == "super_admin":
            pass
        elif user.branch:
            queryset = queryset.filter(branch=user.branch)
        else:
            queryset = queryset.none()

        class_id = self.request.query_params.get("class", None)
        if class_id:
            queryset = queryset.filter(class_section_id=class_id)

        is_active = self.request.query_params.get("is_active", None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return StudentCreateSerializer
        if self.action == "list":
            return StudentListSerializer
        return StudentSerializer

    def perform_create(self, serializer):
        if not can_add_student(self.request.user):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                {"error": "Student limit reached. Please upgrade your plan."}
            )

        serializer.save(branch=self.request.user.branch)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        queryset = self.get_queryset()
        return Response(
            {
                "total": queryset.count(),
                "active": queryset.filter(is_active=True).count(),
                "inactive": queryset.filter(is_active=False).count(),
            }
        )

    @action(detail=False, methods=["get"])
    def usage(self, request):
        stats = get_usage_stats(request.user)
        return Response(stats or {"error": "No subscription found"})
