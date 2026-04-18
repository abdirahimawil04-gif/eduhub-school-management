from rest_framework import serializers
from .models import Student
from accounts.serializers import UserSerializer, BranchListSerializer


class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    full_name = serializers.SerializerMethodField()
    class_section_name = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            "id",
            "user",
            "branch",
            "branch_name",
            "class_section",
            "class_section_name",
            "admission_number",
            "first_name",
            "last_name",
            "full_name",
            "gender",
            "date_of_birth",
            "photo",
            "phone",
            "address",
            "parent_name",
            "parent_phone",
            "parent_email",
            "roll_number",
            "admission_date",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "admission_number"]

    def get_full_name(self, obj):
        return obj.full_name

    def get_class_section_name(self, obj):
        return obj.class_section.name if obj.class_section else None


class StudentCreateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Student
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
            "parent_name",
            "parent_phone",
            "parent_email",
            "roll_number",
            "class_section",
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
                password=password or "student123",
                first_name=validated_data["first_name"],
                last_name=validated_data["last_name"],
                role="student",
                branch=validated_data.get("branch"),
            )
        elif email:
            user = User.objects.get(email=email)
        else:
            user = User.objects.create_user(
                email=f"student_{validated_data['admission_number']}@school.com",
                password=password or "student123",
                first_name=validated_data["first_name"],
                last_name=validated_data["last_name"],
                role="student",
                branch=validated_data.get("branch"),
            )

        student = Student.objects.create(user=user, **validated_data)
        return student


class StudentListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    class_section_name = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            "id",
            "admission_number",
            "full_name",
            "gender",
            "photo",
            "phone",
            "roll_number",
            "class_section",
            "class_section_name",
            "is_active",
        ]

    def get_full_name(self, obj):
        return obj.full_name

    def get_class_section_name(self, obj):
        return obj.class_section.name if obj.class_section else None
