def can_add_student(user):
    if not hasattr(user, "branch") or not user.branch:
        return False

    organization = user.branch.organization
    if not organization or not hasattr(organization, "subscription"):
        return False

    from student.models import Student
    from accounts.models import Subscription

    subscription = organization.subscription
    if not subscription or not subscription.plan:
        return False

    plan = subscription.plan
    current_count = Student.objects.filter(branch=user.branch).count()

    return current_count < plan.max_students


def can_add_teacher(user):
    if not hasattr(user, "branch") or not user.branch:
        return False

    organization = user.branch.organization
    if not organization or not hasattr(organization, "subscription"):
        return False

    from teacher.models import Teacher
    from accounts.models import Subscription

    subscription = organization.subscription
    if not subscription or not subscription.plan:
        return False

    plan = subscription.plan
    current_count = Teacher.objects.filter(branch=user.branch).count()

    return current_count < plan.max_teachers


def can_add_branch(user):
    if not hasattr(user, "branch") or not user.branch:
        return False

    organization = user.branch.organization
    if not organization or not hasattr(organization, "subscription"):
        return False

    from accounts.models import Branch, Subscription

    subscription = organization.subscription
    if not subscription or not subscription.plan:
        return False

    plan = subscription.plan
    current_count = Branch.objects.filter(organization=organization).count()

    return current_count < plan.max_branches


def get_usage_stats(user):
    if not hasattr(user, "branch") or not user.branch:
        return None

    from student.models import Student
    from teacher.models import Teacher
    from accounts.models import Branch, Subscription

    organization = user.branch.organization
    if not organization or not hasattr(organization, "subscription"):
        return None

    subscription = organization.subscription
    if not subscription or not subscription.plan:
        return None

    plan = subscription.plan

    return {
        "students": {
            "current": Student.objects.filter(branch=user.branch).count(),
            "limit": plan.max_students,
        },
        "teachers": {
            "current": Teacher.objects.filter(branch=user.branch).count(),
            "limit": plan.max_teachers,
        },
        "branches": {
            "current": Branch.objects.filter(organization=organization).count(),
            "limit": plan.max_branches,
        },
        "storage_gb": {
            "current": 0,
            "limit": plan.max_storage_gb,
        },
    }


def check_subscription_limits(user, resource_type):
    if resource_type == "student":
        return can_add_student(user)
    elif resource_type == "teacher":
        return can_add_teacher(user)
    elif resource_type == "branch":
        return can_add_branch(user)
    return True
