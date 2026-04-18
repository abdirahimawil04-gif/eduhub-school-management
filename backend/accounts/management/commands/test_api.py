from django.core.management.base import BaseCommand
from rest_framework.test import APIClient


class Command(BaseCommand):
    help = "Test the API endpoints"

    def handle(self, *args, **options):
        client = APIClient()

        self.stdout.write(self.style.SUCCESS("=" * 50))
        self.stdout.write(self.style.SUCCESS("API TESTING"))
        self.stdout.write(self.style.SUCCESS("=" * 50))

        # Test 1: Login as super admin
        response = client.post(
            "/api/auth/login/", {"email": "admin@school.com", "password": "admin123"}
        )
        self.stdout.write(self.style.SUCCESS("\n1. SUPER ADMIN LOGIN"))
        self.stdout.write(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Email: {data.get('user', {}).get('email')}")
            print(f"   Role: {data.get('user', {}).get('role')}")
        else:
            self.stdout.write(self.style.ERROR(f"   Error: {response.status_code}"))

        # Test 2: Get plans (public)
        response = client.get("/api/plans/")
        self.stdout.write(self.style.SUCCESS("\n2. GET PLANS (PUBLIC)"))
        self.stdout.write(f"   Status: {response.status_code}")
        if response.status_code == 200:
            plans = response.json()
            for p in plans:
                self.stdout.write(
                    f"   - {p['name']}: ${p['price']} ({p['max_students']} students)"
                )

        response = client.post(
            "/api/auth/login/",
            {"email": "admin_main@school.com", "password": "admin123"},
        )
        if response.status_code == 200:
            token = response.json().get("access")
            client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

            # Test 3: Get subscription
            response = client.get("/api/subscriptions/my_subscription/")
            self.stdout.write(self.style.SUCCESS("\n3. MY SUBSCRIPTION"))
            self.stdout.write(f"   Status: {response.status_code}")
            if response.status_code == 200:
                sub = response.json()
                print(f"   Plan: {sub.get('plan_name')}")
                print(f"   Active: {sub.get('is_active')}")

            # Test 4: Get students
            response = client.get("/api/students/")
            self.stdout.write(self.style.SUCCESS("\n4. GET STUDENTS"))
            self.stdout.write(f"   Status: {response.status_code}")
            self.stdout.write(f"   Total: {len(response.json())}")

            # Test 5: Search students
            response = client.get("/api/students/?search=Student")
            self.stdout.write(self.style.SUCCESS("\n5. SEARCH STUDENTS"))
            self.stdout.write(f"   Status: {response.status_code}")
            self.stdout.write(f"   Found: {len(response.json())}")

            # Test 6: Usage stats
            response = client.get("/api/students/usage/")
            self.stdout.write(self.style.SUCCESS("\n6. USAGE STATS"))
            self.stdout.write(f"   Status: {response.status_code}")
            if response.status_code == 200:
                stats = response.json()
                print(
                    f"   Students: {stats.get('students', {}).get('current')}/{stats.get('students', {}).get('limit')}"
                )

        self.stdout.write(self.style.SUCCESS("\n" + "=" * 50))
        self.stdout.write(self.style.SUCCESS("ALL TESTS COMPLETED!"))
        self.stdout.write(self.style.SUCCESS("=" * 50))
