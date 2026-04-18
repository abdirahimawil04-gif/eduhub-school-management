from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet, TeacherAttendanceViewSet

router = DefaultRouter()
router.register(r"students", AttendanceViewSet, basename="student-attendance")
router.register(r"teachers", TeacherAttendanceViewSet, basename="teacher-attendance")

urlpatterns = [
    path("", include(router.urls)),
]
