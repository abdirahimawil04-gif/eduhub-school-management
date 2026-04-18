from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from accounts.models import Organization, Branch, Plan, Subscription
from student.models import Student
from teacher.models import Teacher
from academics.models import AcademicYear, ClassSection, Subject

User = get_user_model()


class Command(BaseCommand):
    help = "Creates demo data for the school management system"

    def handle(self, *args, **options):
        self.stdout.write("Creating demo data...")

        basic_plan, _ = Plan.objects.get_or_create(
            name="Basic",
            defaults={
                "price": 29.99,
                "max_students": 100,
                "max_teachers": 10,
                "max_branches": 1,
                "max_storage_gb": 5,
            },
        )
        pro_plan, _ = Plan.objects.get_or_create(
            name="Professional",
            defaults={
                "price": 79.99,
                "max_students": 500,
                "max_teachers": 50,
                "max_branches": 3,
                "max_storage_gb": 20,
            },
        )
        enterprise_plan, _ = Plan.objects.get_or_create(
            name="Enterprise",
            defaults={
                "price": 199.99,
                "max_students": 2000,
                "max_teachers": 200,
                "max_branches": 10,
                "max_storage_gb": 100,
            },
        )
        self.stdout.write(f"Created plans: Basic, Professional, Enterprise")

        org, _ = Organization.objects.get_or_create(
            name="Demo School Organization",
            defaults={
                "address": "123 Education Street",
                "phone": "+1234567890",
                "email": "admin@demo.com",
            },
        )

        branches_data = [
            {"name": "Main Campus", "code": "MAIN", "address": "123 Main Street"},
            {"name": "North Branch", "code": "NORTH", "address": "456 North Avenue"},
            {"name": "South Branch", "code": "SOUTH", "address": "789 South Road"},
        ]

        branches = []
        for data in branches_data:
            branch, created = Branch.objects.get_or_create(
                code=data["code"],
                defaults={
                    "organization": org,
                    "name": data["name"],
                    "address": data["address"],
                    "phone": "+1234567890",
                    "email": f"{data['code'].lower()}@school.com",
                },
            )
            branches.append(branch)
            if created:
                self.stdout.write(f"Created branch: {branch.name}")

        subscription, created = Subscription.objects.get_or_create(
            organization=org,
            defaults={
                "plan": pro_plan,
                "start_date": timezone.now(),
                "end_date": timezone.now() + timedelta(days=365),
                "is_active": True,
                "auto_renew": True,
            },
        )
        self.stdout.write(f"Created subscription for {org.name}")

        # Create Super Admin
        try:
            super_admin = User.objects.get(email="admin@school.com")
            super_admin.set_password("admin123")
            super_admin.save()
            self.stdout.write("Super admin already exists")
        except User.DoesNotExist:
            super_admin = User.objects.create_user(
                username="admin",
                email="admin@school.com",
                password="admin123",
                first_name="Super",
                last_name="Admin",
                role="super_admin",
                is_staff=True,
                is_superuser=True,
            )
            self.stdout.write("Created super admin")

        # Create branch admins, teachers, and academic data
        for branch in branches:
            # Create branch admin
            try:
                branch_admin = User.objects.get(
                    email=f"admin_{branch.code.lower()}@school.com"
                )
                branch_admin.set_password("admin123")
                branch_admin.save()
            except User.DoesNotExist:
                branch_admin = User.objects.create_user(
                    username=f"admin_{branch.code.lower()}",
                    email=f"admin_{branch.code.lower()}@school.com",
                    password="admin123",
                    first_name="Branch",
                    last_name="Admin",
                    role="branch_admin",
                    branch=branch,
                )
            self.stdout.write(f"Created branch admin for {branch.name}")

            # Create teacher
            try:
                teacher_user = User.objects.get(
                    email=f"teacher_{branch.code.lower()}@school.com"
                )
                teacher_user.set_password("teacher123")
                teacher_user.save()
            except User.DoesNotExist:
                teacher_user = User.objects.create_user(
                    username=f"teacher_{branch.code.lower()}",
                    email=f"teacher_{branch.code.lower()}@school.com",
                    password="teacher123",
                    first_name="John",
                    last_name="Teacher",
                    role="teacher",
                    branch=branch,
                )

            # Create or get teacher profile
            teacher, created = Teacher.objects.get_or_create(
                user=teacher_user,
                defaults={
                    "branch": branch,
                    "employee_id": f"EMP-{branch.code}-001",
                    "first_name": "John",
                    "last_name": "Teacher",
                    "gender": "male",
                    "date_of_birth": "1990-01-01",
                    "phone": "+1234567890",
                    "qualification": "M.Sc",
                    "experience": 5,
                    "join_date": "2020-01-01",
                },
            )

            # Create academic year
            year, created = AcademicYear.objects.get_or_create(
                branch=branch,
                name="2024-2025",
                defaults={
                    "start_date": "2024-04-01",
                    "end_date": "2025-03-31",
                    "is_current": True,
                },
            )

            # Create classes and subjects
            for level in [1, 2, 3]:
                class_section, created = ClassSection.objects.get_or_create(
                    branch=branch,
                    class_level=level,
                    section="A",
                    defaults={
                        "name": f"Class {level} - A",
                        "class_teacher": teacher if level == 1 else None,
                    },
                )

                subjects_list = ["Math", "Science", "English", "History"]
                for idx, subj_name in enumerate(subjects_list):
                    Subject.objects.get_or_create(
                        branch=branch,
                        class_section=class_section,
                        name=subj_name,
                        defaults={
                            "code": f"{subj_name[:3].upper()}{level}",
                            "teacher": teacher,
                        },
                    )

        # Create students for main branch
        main_branch = branches[0]
        for i in range(1, 11):
            try:
                student_user = User.objects.get(email=f"student{i}@school.com")
                student_user.set_password("student123")
                student_user.save()
            except User.DoesNotExist:
                student_user = User.objects.create_user(
                    username=f"student{i}",
                    email=f"student{i}@school.com",
                    password="student123",
                    first_name="Student",
                    last_name=f"{i}",
                    role="student",
                    branch=main_branch,
                )

            Student.objects.get_or_create(
                user=student_user,
                defaults={
                    "branch": main_branch,
                    "admission_number": f"ADM{str(i).zfill(4)}",
                    "first_name": "Student",
                    "last_name": f"{i}",
                    "gender": "male" if i % 2 == 0 else "female",
                    "date_of_birth": "2010-01-01",
                    "phone": "+1234567890",
                    "roll_number": str(i),
                    "parent_name": f"Parent {i}",
                    "parent_phone": "+1234567890",
                },
            )

        self.stdout.write(self.style.SUCCESS("Demo data created successfully!"))
        self.stdout.write("")
        self.stdout.write("Login credentials:")
        self.stdout.write("  Super Admin: admin@school.com / admin123")
        self.stdout.write("  Branch Admin: admin_main@school.com / admin123")
        self.stdout.write("  Teacher: teacher_main@school.com / teacher123")
