import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

import django

django.setup()

from rest_framework.test import APIClient

client = APIClient(enforce_csrf_checks=False)

print("=" * 50)
print("API ENDPOINT TESTS")
print("=" * 50)

token = None

# Test 1: Login as super admin
print("\n1. SUPER ADMIN LOGIN")
response = client.post(
    "/api/accounts/login/", data={"email": "admin@school.com", "password": "admin123"}
)
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"   Email: {data.get('user', {}).get('email')}")
    print(f"   Role: {data.get('user', {}).get('role')}")

# Test 2: Get plans (public)
print("\n2. GET PLANS (public)")
response = client.get("/api/accounts/plans/")
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    plans = response.json()
    if isinstance(plans, dict):
        plans = plans.get("results", [])
    print(f"   Found {len(plans)} plans")
    for p in plans:
        print(
            f"     - {p.get('name')}: ${p.get('price')} ({p.get('max_students')} students)"
        )

# Test 3: Login as branch admin
print("\n3. BRANCH ADMIN LOGIN")
response = client.post(
    "/api/accounts/login/",
    data={"email": "admin_main@school.com", "password": "admin123"},
)
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    user = response.json().get("user", {})
    print(f"   Email: {user.get('email')}")
    print(f"   Role: {user.get('role')}")
    token = response.json().get("access")

if token:
    client.credentials(HTTP_AUTHORIZATION="Bearer " + token)

    # Test 4: Get subscription
    print("\n4. MY SUBSCRIPTION")
    response = client.get("/api/accounts/subscriptions/my_subscription/")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        sub = response.json()
        print(f"   Plan: {sub.get('plan_name')}")
        print(f"   Active: {sub.get('is_active')}")

    # Test 5: Get students
    print("\n5. GET STUDENTS")
    response = client.get("/api/students/")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, dict):
            print(f"   Total: {data.get('count') or len(data.get('results', []))}")
        else:
            print(f"   Total: {len(data)}")

    # Test 6: Search students
    print("\n6. SEARCH STUDENTS (search=Student)")
    response = client.get("/api/students/?search=Student")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   Success!")

    # Test 7: Get usage stats
    print("\n7. USAGE STATS")
    response = client.get("/api/students/usage/")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        stats = response.json()
        print(
            f"   Students: {stats.get('students', {}).get('current')}/{stats.get('students', {}).get('limit')}"
        )
        print(
            f"   Teachers: {stats.get('teachers', {}).get('current')}/{stats.get('teachers', {}).get('limit')}"
        )

    # Test 8: Get teachers
    print("\n8. GET TEACHERS")
    response = client.get("/api/teachers/")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        if isinstance(data, dict):
            print(f"   Total: {data.get('count') or len(data.get('results', []))}")
        else:
            print(f"   Total: {len(data)}")

print("\n" + "=" * 50)
print("ALL TESTS COMPLETED!")
print("=" * 50)
