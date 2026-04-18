from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from core.views import APIRootView

urlpatterns = [
    path("", APIRootView.as_view(), name="api-root"),
    path("admin/", admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/students/", include("student.urls")),
    path("api/teachers/", include("teacher.urls")),
    path("api/academics/", include("academics.urls")),
    path("api/attendance/", include("attend.urls")),
    path("api/finance/", include("financeapp.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
