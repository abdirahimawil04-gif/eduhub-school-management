from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone

from .models import Attendance, TeacherAttendance
from .serializers import (
    AttendanceSerializer,
    AttendanceCreateSerializer,
    AttendanceMarkSerializer,
    TeacherAttendanceSerializer,
    TeacherAttendanceCreateSerializer,
)
from accounts.permissions import IsSuperAdminOrBranchAdminOrTeacher
from student.models import Student
from teacher.models import Teacher
from academics.models import ClassSection


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrBranchAdminOrTeacher]

    def get_queryset(self):
        user = self.request.user
        queryset = Attendance.objects.select_related("student", "branch", "marked_by")

        if user.role == "super_admin":
            pass
        elif user.branch:
            queryset = queryset.filter(branch=user.branch)

        date = self.request.query_params.get("date", None)
        if date:
            queryset = queryset.filter(date=date)

        class_id = self.request.query_params.get("class", None)
        if class_id:
            queryset = queryset.filter(student__class_section_id=class_id)

        student_id = self.request.query_params.get("student", None)
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        return queryset.order_by("date", "student__first_name")

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return AttendanceCreateSerializer
        return AttendanceSerializer

    @action(detail=False, methods=["post"])
    def mark(self, request):
        date = request.data.get("date")
        class_section_id = request.data.get("class_section")
        attendance_list = request.data.get("attendance", [])

        if not date or not class_section_id:
            return Response(
                {"error": "date and class_section are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        class_section = ClassSection.objects.get(id=class_section_id)
        branch = class_section.branch
        marked_by = Teacher.objects.get(user=request.user)

        for att in attendance_list:
            student = Student.objects.get(id=att.get("student_id"))
            Attendance.objects.update_or_create(
                student=student,
                date=date,
                defaults={
                    "branch": branch,
                    "status": att.get("status", "present"),
                    "marked_by": marked_by,
                    "remarks": att.get("remarks", ""),
                },
            )

        return Response(
            {"message": "Attendance marked successfully"}, status=status.HTTP_200_OK
        )

    @action(detail=False, methods=["get"])
    def by_class(self, request):
        date = request.query_params.get("date")
        class_section_id = request.query_params.get("class")

        if not date or not class_section_id:
            return Response(
                {"error": "date and class required"}, status=status.HTTP_400_BAD_REQUEST
            )

        students = Student.objects.filter(
            class_section_id=class_section_id, is_active=True
        ).order_by("roll_number", "first_name")

        attendance_map = {}
        existing = Attendance.objects.filter(
            date=date, student__class_section_id=class_section_id
        )
        for att in existing:
            attendance_map[str(att.student.id)] = att

        result = []
        for student in students:
            att = attendance_map.get(str(student.id))
            result.append(
                {
                    "student_id": str(student.id),
                    "admission_number": student.admission_number,
                    "full_name": student.full_name,
                    "roll_number": student.roll_number,
                    "status": att.status if att else "present",
                    "remarks": att.remarks if att else "",
                }
            )

        return Response(result)

    @action(detail=False, methods=["get"])
    def summary(self, request):
        date = request.query_params.get("date")
        class_section_id = request.query_params.get("class")

        queryset = Attendance.objects.filter(date=date)
        if class_section_id:
            queryset = queryset.filter(student__class_section_id=class_section_id)

        total = queryset.count()
        present = queryset.filter(status="present").count()
        absent = queryset.filter(status="absent").count()
        late = queryset.filter(status="late").count()
        leave = queryset.filter(status="leave").count()

        return Response(
            {
                "date": date,
                "total_students": total,
                "present": present,
                "absent": absent,
                "late": late,
                "leave": leave,
                "present_percentage": round(
                    (present / total * 100) if total > 0 else 0, 2
                ),
            }
        )


class TeacherAttendanceViewSet(viewsets.ModelViewSet):
    queryset = TeacherAttendance.objects.all()
    serializer_class = TeacherAttendanceSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrBranchAdminOrTeacher]

    def get_queryset(self):
        user = self.request.user
        queryset = TeacherAttendance.objects.select_related(
            "teacher", "branch", "marked_by"
        )

        if user.role == "super_admin":
            pass
        elif user.branch:
            queryset = queryset.filter(branch=user.branch)

        date = self.request.query_params.get("date", None)
        if date:
            queryset = queryset.filter(date=date)

        return queryset.order_by("date", "teacher__first_name")

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return TeacherAttendanceCreateSerializer
        return TeacherAttendanceSerializer
