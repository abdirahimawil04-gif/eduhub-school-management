from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView,
    LogoutView,
    CurrentUserView,
    OrganizationViewSet,
    BranchViewSet,
    UserViewSet,
    PlanViewSet,
    SubscriptionViewSet,
)

router = DefaultRouter()
router.register(r"organizations", OrganizationViewSet, basename="organization")
router.register(r"branches", BranchViewSet, basename="branch")
router.register(r"users", UserViewSet, basename="user")
router.register(r"plans", PlanViewSet, basename="plan")
router.register(r"subscriptions", SubscriptionViewSet, basename="subscription")

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", CurrentUserView.as_view(), name="current_user"),
    path("", include(router.urls)),
]
