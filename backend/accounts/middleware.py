import logging
from django.http import JsonResponse
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

EXEMPT_URLS = [
    "/api/auth/login/",
    "/api/auth/token/",
    "/api/plans/",
    "/api/subscriptions/",
    "/api/stripe/",
    "/admin/",
]


def check_subscription_middleware(get_response):
    def middleware(request):
        if any(request.path.startswith(url) for url in EXEMPT_URLS):
            return get_response(request)

        if not request.user.is_authenticated:
            return get_response(request)

        if request.user.role == "super_admin":
            return get_response(request)

        if hasattr(request.user, "branch") and request.user.branch:
            organization = request.user.branch.organization

            if organization and hasattr(organization, "subscription"):
                subscription = organization.subscription

                if subscription.plan is None:
                    return JsonResponse(
                        {
                            "error": "No active subscription. Please subscribe to continue."
                        },
                        status=403,
                    )

                if not subscription.is_active:
                    return JsonResponse(
                        {"error": "Subscription inactive. Please renew to continue."},
                        status=403,
                    )

                if subscription.is_expired:
                    grace_days = getattr(subscription, "grace_period_days", 3)
                    if subscription.is_within_grace_period():
                        return get_response(request)
                    return JsonResponse(
                        {
                            "error": f"Subscription expired. Grace period of {grace_days} days has ended. Please renew."
                        },
                        status=403,
                    )

        return get_response(request)

    return middleware


def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def log_action(request, action, model_name, object_id=None, changes=None):
    from accounts.models import AuditLog, Branch

    try:
        branch = None
        if hasattr(request.user, "branch"):
            branch = request.user.branch

        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            branch=branch,
            action=action,
            model_name=model_name,
            object_id=object_id,
            changes=changes or {},
            ip_address=get_client_ip(request),
        )
    except Exception as e:
        logger.error(f"Failed to log audit action: {e}")
