from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter
import uuid

from .models import Teacher
from .serializers import (
    TeacherSerializer,
    TeacherCreateSerializer,
    TeacherListSerializer,
)
from accounts.permissions import IsSuperAdminOrBranchAdmin
from accounts.utils import can_add_teacher, get_usage_stats


class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ["first_name", "last_name", "employee_id"]

    def get_permissions(self):
        if self.action in ["create", "destroy"]:
            return [IsSuperAdminOrBranchAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        queryset = Teacher.objects.select_related("user", "branch")

        if user.role == "super_admin":
            pass
        elif user.branch:
            queryset = queryset.filter(branch=user.branch)
        else:
            queryset = queryset.none()

        is_active = self.request.query_params.get("is_active", None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return TeacherCreateSerializer
        if self.action == "list":
            return TeacherListSerializer
        return TeacherSerializer

    def perform_create(self, serializer):
        if not can_add_teacher(self.request.user):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                {"error": "Teacher limit reached. Please upgrade your plan."}
            )

        employee_id = f"EMP-{uuid.uuid4().hex[:6].upper()}"
        serializer.save(employee_id=employee_id, branch=self.request.user.branch)

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
