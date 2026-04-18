from rest_framework import serializers
from .models import Attendance, TeacherAttendance
from student.serializers import StudentListSerializer
from teacher.serializers import TeacherListSerializer


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_admission = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    marked_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = [
            "id",
            "student",
            "student_name",
            "student_admission",
            "branch",
            "branch_name",
            "date",
            "status",
            "marked_by",
            "marked_by_name",
            "remarks",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def get_student_name(self, obj):
        return obj.student.full_name

    def get_student_admission(self, obj):
        return obj.student.admission_number

    def get_marked_by_name(self, obj):
        return obj.marked_by.full_name if obj.marked_by else None


class AttendanceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ["student", "date", "status", "remarks"]


class AttendanceMarkSerializer(serializers.Serializer):
    date = serializers.DateField()
    class_section = serializers.UUIDField()
    attendance = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField())
    )


class TeacherAttendanceSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    marked_by_name = serializers.SerializerMethodField()

    class Meta:
        model = TeacherAttendance
        fields = [
            "id",
            "teacher",
            "teacher_name",
            "branch",
            "branch_name",
            "date",
            "status",
            "marked_by",
            "marked_by_name",
            "remarks",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def get_teacher_name(self, obj):
        return obj.teacher.full_name

    def get_marked_by_name(self, obj):
        return obj.marked_by.get_full_name() if obj.marked_by else None


class TeacherAttendanceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherAttendance
        fields = ["teacher", "date", "status", "remarks"]


class AttendanceSummarySerializer(serializers.Serializer):
    date = serializers.DateField()
    total_students = serializers.IntegerField()
    present = serializers.IntegerField()
    absent = serializers.IntegerField()
    late = serializers.IntegerField()
    leave = serializers.IntegerField()
    present_percentage = serializers.FloatField()
