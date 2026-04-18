from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import AcademicYear, ClassSection, Subject, Exam, ExamResult
from .serializers import (
    AcademicYearSerializer,
    ClassSectionSerializer,
    ClassSectionListSerializer,
    SubjectSerializer,
    SubjectListSerializer,
    ExamSerializer,
    ExamListSerializer,
    ExamResultSerializer,
    ExamResultCreateSerializer,
)
from accounts.permissions import IsSuperAdminOrBranchAdminOrTeacher


class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrBranchAdminOrTeacher]

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return AcademicYear.objects.all()
        return AcademicYear.objects.filter(branch=user.branch)


class ClassSectionViewSet(viewsets.ModelViewSet):
    queryset = ClassSection.objects.all()
    serializer_class = ClassSectionSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrBranchAdminOrTeacher]

    def get_queryset(self):
        user = self.request.user
        if user.role == "super_admin":
            return ClassSection.objects.all()
        return ClassSection.objects.filter(branch=user.branch)

    def get_serializer_class(self):
        if self.action == "list":
            return ClassSectionListSerializer
        return ClassSectionSerializer


class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrBranchAdminOrTeacher]

    def get_queryset(self):
        user = self.request.user
        queryset = Subject.objects.select_related("branch", "class_section", "teacher")

        if user.role == "super_admin":
            pass
        elif user.branch:
            queryset = queryset.filter(branch=user.branch)

        class_id = self.request.query_params.get("class", None)
        if class_id:
            queryset = queryset.filter(class_section_id=class_id)

        return queryset

    def get_serializer_class(self):
        if self.action == "list":
            return SubjectListSerializer
        return SubjectSerializer


class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrBranchAdminOrTeacher]

    def get_queryset(self):
        user = self.request.user
        queryset = Exam.objects.select_related(
            "branch", "class_section", "academic_year"
        )

        if user.role == "super_admin":
            pass
        elif user.branch:
            queryset = queryset.filter(branch=user.branch)

        class_id = self.request.query_params.get("class", None)
        if class_id:
            queryset = queryset.filter(class_section_id=class_id)

        return queryset

    def get_serializer_class(self):
        if self.action == "list":
            return ExamListSerializer
        return ExamSerializer


class ExamResultViewSet(viewsets.ModelViewSet):
    queryset = ExamResult.objects.all()
    serializer_class = ExamResultSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrBranchAdminOrTeacher]

    def get_queryset(self):
        user = self.request.user
        queryset = ExamResult.objects.select_related("exam", "subject")

        if user.role == "super_admin":
            pass
        elif user.branch:
            queryset = queryset.filter(exam__branch=user.branch)

        exam_id = self.request.query_params.get("exam", None)
        if exam_id:
            queryset = queryset.filter(exam_id=exam_id)

        student_id = self.request.query_params.get("student", None)
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        return queryset

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return ExamResultCreateSerializer
        return ExamResultSerializer

    @action(detail=False, methods=["post"])
    def bulk_create(self, request):
        results = request.data.get("results", [])
        created = []
        for result_data in results:
            result, created = ExamResult.objects.update_or_create(
                exam_id=result_data.get("exam"),
                student_id=result_data.get("student_id"),
                subject_id=result_data.get("subject"),
                defaults={
                    "marks": result_data.get("marks"),
                    "remarks": result_data.get("remarks", ""),
                },
            )
            created.append(result)
        return Response({"created": len(created)}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def student_results(self, request):
        student_id = request.query_params.get("student_id")
        if not student_id:
            return Response(
                {"error": "student_id required"}, status=status.HTTP_400_BAD_REQUEST
            )

        results = ExamResult.objects.filter(student_id=student_id).select_related(
            "exam", "subject"
        )
        return Response(ExamResultSerializer(results, many=True).data)
