from rest_framework import serializers
from .models import Teacher
from accounts.serializers import UserSerializer


class TeacherSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    full_name = serializers.SerializerMethodField()
    class_teacher_of = serializers.SerializerMethodField()
    subjects_list = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = [
            "id",
            "user",
            "branch",
            "branch_name",
            "employee_id",
            "first_name",
            "last_name",
            "full_name",
            "gender",
            "date_of_birth",
            "photo",
            "phone",
            "address",
            "qualification",
            "experience",
            "salary",
            "join_date",
            "is_active",
            "class_teacher_of",
            "subjects_list",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "employee_id"]

    def get_full_name(self, obj):
        return obj.full_name

    def get_class_teacher_of(self, obj):
        if obj.class_teacher_of:
            return {
                "id": str(obj.class_teacher_of.id),
                "name": obj.class_teacher_of.name,
            }
        return None

    def get_subjects_list(self, obj):
        return [{"id": str(s.id), "name": s.name} for s in obj.subjects.all()]


class TeacherCreateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Teacher
        fields = [
            "email",
            "password",
            "first_name",
            "last_name",
            "gender",
            "date_of_birth",
            "photo",
            "phone",
            "address",
            "qualification",
            "experience",
            "salary",
            "join_date",
            "class_teacher_of",
            "subjects",
            "branch",
        ]

    def create(self, validated_data):
        from django.contrib.auth import get_user_model

        User = get_user_model()

        email = validated_data.pop("email", None)
        password = validated_data.pop("password", None)

        if email and not User.objects.filter(email=email).exists():
            user = User.objects.create_user(
                email=email,
                password=password or "teacher123",
                first_name=validated_data["first_name"],
                last_name=validated_data["last_name"],
                role="teacher",
                branch=validated_data.get("branch"),
            )
        elif email:
            user = User.objects.get(email=email)
        else:
            user = User.objects.create_user(
                email=f"teacher_{validated_data['employee_id']}@school.com",
                password=password or "teacher123",
                first_name=validated_data["first_name"],
                last_name=validated_data["last_name"],
                role="teacher",
                branch=validated_data.get("branch"),
            )

        teacher = Teacher.objects.create(user=user, **validated_data)
        return teacher


class TeacherListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = [
            "id",
            "employee_id",
            "full_name",
            "gender",
            "photo",
            "phone",
            "qualification",
            "is_active",
        ]

    def get_full_name(self, obj):
        return obj.full_name
