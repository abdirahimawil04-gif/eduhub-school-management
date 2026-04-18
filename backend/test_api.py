#!/usr/bin/env python
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from django.test import Client

client = Client()

print("=" * 50)
print("API TESTING")
print("=" * 50)

# Test 1: Login as super admin
response = client.post(
    "/api/auth/login/", {"email": "admin@school.com", "password": "admin123"}
)
print("\n1. SUPER ADMIN LOGIN")
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"   Email: {data.get('user', {}).get('email')}")
    print(f"   Role: {data.get('user', {}).get('role')}")
else:
    print(f"   Error: {response.content[:200]}")

# Test 2: Get plans (public)
response = client.get("/api/plans/")
print("\n2. GET PLANS (PUBLIC)")
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    plans = response.json()
    for p in plans:
        print(f"   - {p['name']}: ${p['price']} ({p['max_students']} students)")
else:
    print(f"   Error: {response.content[:200]}")

# Test 3: Login as branch admin
response = client.post(
    "/api/auth/login/", {"email": "admin_main@school.com", "password": "admin123"}
)
print("\n3. BRANCH ADMIN LOGIN")
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    user_data = response.json().get("user", {})
    print(f"   Email: {user_data.get('email')}")
    print(f"   Role: {user_data.get('role')}")
    token = response.json().get("access")
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {token}"
else:
    print(f"   Error: {response.content[:200]}")

if token:
    # Need to set headers manually for Django test client
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {token}"

# Test 4: Get subscription
response = client.get("/api/subscriptions/my_subscription/")
print("\n4. MY SUBSCRIPTION")
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    sub = response.json()
    print(f"   Plan: {sub.get('plan_name')}")
    print(f"   Active: {sub.get('is_active')}")
    print(f"   Expired: {sub.get('is_expired')}")
else:
    print(f"   Error: {response.content[:200]}")

# Test 5: Get students
response = client.get("/api/students/")
print("\n5. GET STUDENTS")
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    print(f"   Total students: {len(response.json())}")
else:
    print(f"   Error: {response.content[:200]}")

# Test 6: Search students
response = client.get("/api/students/?search=Student")
print("\n6. SEARCH STUDENTS (search=Student)")
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    print(f"   Found: {len(response.json())}")
else:
    print(f"   Error: {response.content[:200]}")

# Test 7: Get usage stats
response = client.get("/api/students/usage/")
print("\n7. USAGE STATS")
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    stats = response.json()
    print(
        f"   Students: {stats.get('students', {}).get('current')}/{stats.get('students', {}).get('limit')}"
    )
else:
    print(f"   Error: {response.content[:200]}")

# Test 8: Get branches
response = client.get("/api/branches/")
print("\n8. GET BRANCHES")
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    print(f"   Total branches: {len(response.json())}")

print("\n" + "=" * 50)
print("ALL TESTS COMPLETED!")
print("=" * 50)
