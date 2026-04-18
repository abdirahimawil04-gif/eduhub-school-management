from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny


class APIRootView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "message": "School Management System API",
                "version": "1.0",
                "endpoints": {
                    "admin": "/admin/",
                    "accounts": "/api/accounts/",
                    "students": "/api/students/",
                    "teachers": "/api/teachers/",
                    "academics": "/api/academics/",
                    "attendance": "/api/attendance/",
                    "finance": "/api/finance/",
                },
            }
        )
