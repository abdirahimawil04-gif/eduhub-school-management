from rest_framework import serializers
from accounts.models import User, Organization, Branch, Plan, Subscription
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class TokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = [
            "id",
            "name",
            "logo",
            "address",
            "phone",
            "email",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class BranchSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(
        source="organization.name", read_only=True
    )
    student_count = serializers.SerializerMethodField()
    teacher_count = serializers.SerializerMethodField()

    class Meta:
        model = Branch
        fields = [
            "id",
            "organization",
            "organization_name",
            "name",
            "code",
            "address",
            "phone",
            "email",
            "logo",
            "is_active",
            "created_at",
            "updated_at",
            "student_count",
            "teacher_count",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_student_count(self, obj):
        return obj.students.count()

    def get_teacher_count(self, obj):
        return obj.teachers.count()


class BranchListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id", "name", "code", "logo", "is_active"]


class UserSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source="get_role_display_name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "photo",
            "branch",
            "branch_name",
            "role",
            "role_display",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]
        extra_kwargs = {"password": {"write_only": True}}

    def get_full_name(self, obj):
        return obj.get_full_name()


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
            "photo",
            "branch",
            "role",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source="get_role_display_name", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "photo",
            "branch",
            "branch_name",
            "role",
            "role_display",
            "is_active",
            "is_staff",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters")
        return value


class PlanSerializer(serializers.ModelSerializer):
    price = serializers.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        model = Plan
        fields = [
            "id",
            "name",
            "price",
            "max_students",
            "max_teachers",
            "max_branches",
            "max_storage_gb",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["price"] = str(instance.price)
        return data


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source="plan.name", read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    organization_name = serializers.CharField(
        source="organization.name", read_only=True
    )

    class Meta:
        model = Subscription
        fields = [
            "id",
            "organization",
            "organization_name",
            "plan",
            "plan_name",
            "start_date",
            "end_date",
            "is_active",
            "auto_renew",
            "is_expired",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "is_expired"]


class SubscriptionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = [
            "organization",
            "plan",
            "start_date",
            "end_date",
            "is_active",
            "auto_renew",
        ]
