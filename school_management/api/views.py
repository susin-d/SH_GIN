from rest_framework import viewsets, status, generics, views
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import *
from .serializers import *

# === Authentication Views ===

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Login endpoint. Returns access token, refresh token, and user data.
    """
    serializer_class = CustomTokenObtainPairSerializer

class CurrentUserView(generics.RetrieveAPIView):
    """
    Returns the currently authenticated user's data.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class LogoutView(views.APIView):
    """
    Handles logout by blacklisting the refresh token.
    The frontend should also remove tokens from local storage.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)

# === Model ViewSets ===

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related('user', 'user__profile').all()
    serializer_class = StudentSerializer

    @action(detail=True, methods=['get'])
    def fees(self, request, pk=None):
        student = self.get_object()
        fees = student.fees.all()
        serializer = FeeSerializer(fees, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        student = self.get_object()
        records = student.attendance_records.all()
        serializer = AttendanceSerializer(records, many=True)
        return Response(serializer.data)

class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.select_related('user', 'user__profile').all()
    serializer_class = TeacherSerializer

    @action(detail=True, methods=['get'])
    def classes(self, request, pk=None):
        teacher = self.get_object()
        classes = SchoolClass.objects.filter(teacher=teacher.user)
        serializer = SchoolClassSerializer(classes, many=True)
        return Response(serializer.data)

class ClassViewSet(viewsets.ModelViewSet):
    queryset = SchoolClass.objects.all()
    serializer_class = SchoolClassSerializer

    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        school_class = self.get_object()
        students = school_class.students.all()
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def timetable(self, request, pk=None):
        school_class = self.get_object()
        entries = school_class.timetable_entries.all()
        serializer = TimetableSerializer(entries, many=True)
        return Response(serializer.data)

class FeeViewSet(viewsets.ModelViewSet):
    queryset = Fee.objects.all()
    serializer_class = FeeSerializer
    
    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        fee = self.get_object()
        # In a real app, you'd integrate a payment gateway here.
        # For now, we'll just mark it as paid.
        fee.status = Fee.Status.PAID
        fee.save()
        return Response({'status': 'Payment successful'}, status=status.HTTP_200_OK)

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer

    @action(detail=False, methods=['get'], url_path='class/(?P<class_id>[^/.]+)')
    def by_class(self, request, class_id=None):
        queryset = self.get_queryset().filter(student__school_class_id=class_id)
        date = request.query_params.get('date', None)
        if date:
            queryset = queryset.filter(date=date)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class TimetableViewSet(viewsets.ModelViewSet):
    queryset = Timetable.objects.all()
    serializer_class = TimetableSerializer

    @action(detail=False, methods=['get'], url_path='class/(?P<class_id>[^/.]+)')
    def by_class(self, request, class_id=None):
        queryset = self.get_queryset().filter(school_class_id=class_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    # Note: approve/reject is handled by the default PATCH/PUT methods
    # as the client sends `{ "status": "approved" }`.

class ReportViewSet(viewsets.ViewSet):
    """
    A ViewSet for generating various reports.
    """
    def list(self, request):
        return Response({"message": "Available reports: /attendance, /fees, /academic"})

    @action(detail=False, methods=['get'])
    def attendance(self, request):
        # Example: Filter attendance by query params like class, date_range, etc.
        params = request.query_params
        # ... Add filtering logic here based on params ...
        return Response({"report_type": "attendance", "filters": params, "data": "..."})

    @action(detail=False, methods=['get'])
    def fees(self, request):
        params = request.query_params
        # ... Add filtering logic here ...
        return Response({"report_type": "fees", "filters": params, "data": "..."})

    @action(detail=False, methods=['get'])
    def academic(self, request):
        params = request.query_params
        # ... Add filtering logic here ...
        return Response({"report_type": "academic", "filters": params, "data": "..."})