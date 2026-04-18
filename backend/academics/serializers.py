from rest_framework import serializers
from .models import AcademicYear, ClassSection, Subject, Exam, ExamResult
from accounts.serializers import BranchListSerializer
from teacher.serializers import TeacherListSerializer


class AcademicYearSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = AcademicYear
        fields = [
            "id",
            "branch",
            "branch_name",
            "name",
            "start_date",
            "end_date",
            "is_current",
            "created_at",
        ]
        read_only_fields = ["created_at"]


class ClassSectionSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    class_teacher_name = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()
    subject_count = serializers.SerializerMethodField()

    class Meta:
        model = ClassSection
        fields = [
            "id",
            "branch",
            "branch_name",
            "name",
            "class_level",
            "section",
            "class_teacher",
            "class_teacher_name",
            "student_count",
            "subject_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_class_teacher_name(self, obj):
        return obj.class_teacher.full_name if obj.class_teacher else None

    def get_student_count(self, obj):
        return obj.students.count()

    def get_subject_count(self, obj):
        return obj.subjects.count()


class ClassSectionListSerializer(serializers.ModelSerializer):
    class_teacher_name = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = ClassSection
        fields = [
            "id",
            "name",
            "class_level",
            "section",
            "class_teacher_name",
            "student_count",
        ]

    def get_class_teacher_name(self, obj):
        return obj.class_teacher.full_name if obj.class_teacher else None

    def get_student_count(self, obj):
        return obj.students.count()


class SubjectSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    class_name = serializers.CharField(source="class_section.name", read_only=True)
    teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = [
            "id",
            "branch",
            "branch_name",
            "name",
            "code",
            "class_section",
            "class_name",
            "teacher",
            "teacher_name",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def get_teacher_name(self, obj):
        return obj.teacher.full_name if obj.teacher else None


class SubjectListSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = ["id", "name", "code", "class_section", "teacher_name"]

    def get_teacher_name(self, obj):
        return obj.teacher.full_name if obj.teacher else None


class ExamSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    class_name = serializers.CharField(source="class_section.name", read_only=True)
    academic_year_name = serializers.CharField(
        source="academic_year.name", read_only=True
    )
    subject_count = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = [
            "id",
            "branch",
            "branch_name",
            "academic_year",
            "academic_year_name",
            "name",
            "exam_type",
            "class_section",
            "class_name",
            "start_date",
            "end_date",
            "subject_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_subject_count(self, obj):
        return obj.class_section.subjects.count()


class ExamListSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source="class_section.name", read_only=True)

    class Meta:
        model = Exam
        fields = [
            "id",
            "name",
            "exam_type",
            "class_section",
            "class_name",
            "start_date",
            "end_date",
        ]


class ExamResultSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_admission = serializers.SerializerMethodField()
    subject_name = serializers.SerializerMethodField()
    exam_name = serializers.SerializerMethodField()

    class Meta:
        model = ExamResult
        fields = [
            "id",
            "exam",
            "exam_name",
            "student",
            "student_name",
            "student_admission",
            "subject",
            "subject_name",
            "marks",
            "grade",
            "remarks",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_student_name(self, obj):
        return obj.student.full_name if obj.student else None

    def get_student_admission(self, obj):
        return obj.student.admission_number if obj.student else None

    def get_subject_name(self, obj):
        return obj.subject.name

    def get_exam_name(self, obj):
        return obj.exam.name


class ExamResultCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamResult
        fields = ["exam", "student", "subject", "marks", "remarks"]
