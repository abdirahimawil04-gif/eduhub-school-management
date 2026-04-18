from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from student.models import Student
from teacher.models import Teacher

from .models import Organization, Branch, Plan, Subscription
from .serializers import (
    OrganizationSerializer,
    BranchSerializer,
    BranchListSerializer,
    UserSerializer,
    UserCreateSerializer,
    UserDetailSerializer,
    ChangePasswordSerializer,
    TokenObtainPairSerializer,
    PlanSerializer,
    SubscriptionSerializer,
    SubscriptionCreateSerializer,
)
from .permissions import IsSuperAdmin, IsSuperAdminOrBranchAdmin, IsBranchAdmin
from .utils import can_add_branch, check_subscription_limits, get_usage_stats
from .middleware import log_action

User = get_user_model()


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = TokenObtainPairSerializer


class LogoutView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
        except Exception:
            return Response(
                {"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST
            )


class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class = UserDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    @action(detail=False, methods=["get"])
    def dashboard(self, request):
        user = request.user
        data = {
            "id": user.id,
            "email": user.email,
            "full_name": user.get_full_name(),
            "role": user.role,
            "role_display": user.get_role_display_name(),
            "branch": BranchListSerializer(user.branch).data if user.branch else None,
        }

        if user.role == "super_admin":
            data["stats"] = {
                "total_branches": Branch.objects.filter(is_active=True).count(),
                "total_students": Student.objects.count(),
                "total_teachers": Teacher.objects.count(),
            }
        elif user.branch:
            data["stats"] = {
                "students": user.branch.students.count(),
                "teachers": user.branch.teachers.count(),
                "classes": user.branch.class_sections.count(),
            }

        return Response(data)


class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get_queryset(self):
        return Organization.objects.all()


class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create"]:
            return [IsSuperAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return Branch.objects.all()
        return Branch.objects.filter(id=user.branch.id)

    def perform_create(self, serializer):
        serializer.save(organization_id=self.request.data.get("organization"))

    @action(detail=False, methods=["get"])
    def switch(self, request):
        branch_id = request.query_params.get("branch_id")
        if branch_id and request.user.role == "super_admin":
            request.session["selected_branch"] = branch_id
            return Response({"message": "Branch switched"})
        return Response(
            {"error": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST
        )


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create", "destroy"]:
            return [IsSuperAdminOrBranchAdmin()]
        if self.action in ["update", "partial_update"]:
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return User.objects.all()
        elif user.branch:
            return User.objects.filter(branch=user.branch)
        return User.objects.filter(id=user.id)

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        if self.action in ["retrieve", "update", "partial_update"]:
            return UserDetailSerializer
        return UserSerializer

    @action(detail=False, methods=["post"])
    def change_password(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data["old_password"]):
                return Response(
                    {"error": "Invalid old password"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.set_password(serializer.validated_data["new_password"])
            user.save()
            return Response({"message": "Password changed successfully"})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PlanViewSet(viewsets.ModelViewSet):
    queryset = Plan.objects.filter(is_active=True)
    serializer_class = PlanSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Plan.objects.filter(is_active=True)


class SubscriptionViewSet(viewsets.ModelViewSet):
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsSuperAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return Subscription.objects.all()
        elif user.branch:
            return Subscription.objects.filter(organization=user.branch.organization)
        return Subscription.objects.none()

    def get_serializer_class(self):
        if self.action == "create":
            return SubscriptionCreateSerializer
        return SubscriptionSerializer

    def perform_create(self, serializer):
        log_action(
            self.request,
            "Created subscription",
            "Subscription",
            changes=serializer.validated_data,
        )
        serializer.save()

    @action(detail=False, methods=["get"])
    def my_subscription(self, request):
        if not request.user.branch:
            return Response(
                {"error": "No branch associated"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            sub = request.user.branch.organization.subscription
            return Response(SubscriptionSerializer(sub).data)
        except Subscription.DoesNotExist:
            return Response(
                {"error": "No subscription found"}, status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=["get"])
    def usage(self, request):
        stats = get_usage_stats(request.user)
        return Response(stats or {"error": "No subscription found"})
