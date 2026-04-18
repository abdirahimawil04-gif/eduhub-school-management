import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from rest_framework.test import APIClient

client = APIClient()
response = client.post(
    "/api/accounts/login/",
    {"email": "admin@school.com", "password": "admin123"},
    format="json",
)
print("Status:", response.status_code)
print("Response:", response.content.decode())
