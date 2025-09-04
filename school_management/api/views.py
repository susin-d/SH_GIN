from rest_framework import viewsets, status, generics, views
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.db import models
from django.db.models import Sum, Count
from .models import *
from .serializers import *

# === Public & Authentication Views ===

class HealthCheckView(views.APIView):
    """A public endpoint to check if the backend is running."""
    permission_classes = [AllowAny]
    def get(self, request, *args, **kwargs):
        return Response({"status": "ok", "message": "Backend is connected and running."})

class CustomTokenObtainPairView(TokenObtainPairView):
    """Login endpoint. Returns tokens and user data."""
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

class CurrentUserView(generics.RetrieveAPIView):
    """Returns the currently authenticated user's data."""
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    def get_object(self):
        return self.request.user

class LogoutView(views.APIView):
    """Handles logout by blacklisting the refresh token."""
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)

# === Dashboard Views ===

class StudentDashboardView(views.APIView):
    """Provides all necessary data for the student dashboard in a single endpoint."""
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        user = self.request.user
        if user.role != User.Role.STUDENT:
            return Response({"error": "User is not a student"}, status=status.HTTP_403_FORBIDDEN)
        try:
            student = Student.objects.get(user=user)
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        attendance_records = student.attendance_records.all()
        total_days = attendance_records.count()
        present_days = attendance_records.filter(status__in=[Attendance.Status.PRESENT, Attendance.Status.LATE]).count()
        attendance_rate = (present_days / total_days * 100) if total_days > 0 else 100

        stats_data = {"attendanceRate": round(attendance_rate, 1), "currentGPA": 3.7, "completedAssignments": 28, "totalAssignments": 32, "upcomingDeadlines": 5, "currentGrade": "A-"}
        schedule_data = Timetable.objects.filter(school_class=student.school_class)
        grades_data = student.grades.all().order_by('-graded_date')
        assignments_data = Assignment.objects.filter(school_class=student.school_class).order_by('due_date')
        
        subjects_data = []
        unique_subjects = schedule_data.values('subject', 'teacher').distinct()
        for sub in unique_subjects:
            teacher_instance = Teacher.objects.get(pk=sub['teacher'])
            subjects_data.append({"id": len(subjects_data) + 1, "name": sub['subject'], "teacher": f"{teacher_instance.user.first_name} {teacher_instance.user.last_name}", "grade": "A-", "attendance": 95, "nextClass": "Tomorrow 9:00 AM"})
        
        payload = {
            "stats": stats_data, "subjects": subjects_data,
            "assignments": AssignmentSerializer(assignments_data, many=True).data,
            "schedule": TimetableSerializer(schedule_data, many=True).data,
            "grades": GradeSerializer(grades_data, many=True).data,
        }
        return Response(payload)

# === Admin Action Views ===

class AdminUserUpdateView(generics.GenericAPIView):
    """Endpoint for admins to change any user's username and/or password."""
    serializer_class = AdminUserUpdateSerializer
    permission_classes = [IsAdminUser]
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.get(pk=serializer.validated_data['user_id'])
        if serializer.validated_data.get('username'):
            user.username = serializer.validated_data['username']
        if serializer.validated_data.get('password'):
            user.set_password(serializer.validated_data['password'])
        user.save()
        return Response({"message": "User updated successfully."}, status=status.HTTP_200_OK)

class FeeActionsView(views.APIView):
    """Handles complex actions and reports related to fees."""
    permission_classes = [IsAdminUser]
    def post(self, request, *args, **kwargs):
        action = request.data.get("action")
        if action == "create_class_fee":
            school_class = SchoolClass.objects.get(pk=request.data.get("class_id"))
            count = 0
            for student in school_class.students.all():
                Fee.objects.create(student=student, amount=request.data.get("amount"), due_date=request.data.get("due_date"))
                count += 1
            return Response({"message": f"Fee created for {count} students in {school_class.name}."}, status=status.HTTP_201_CREATED)
        elif action == "send_reminders":
            count = 0
            for fee in Fee.objects.filter(status__in=[Fee.Status.UNPAID, Fee.Status.PARTIAL]):
                Notification.objects.create(user=fee.student.user, title="Fee Payment Reminder", message=f"Reminder: Fee of ${fee.amount} due on {fee.due_date}.")
                count += 1
            return Response({"message": f"{count} payment reminders sent."}, status=status.HTTP_200_OK)
        return Response({"error": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request, *args, **kwargs):
        if request.query_params.get("action") == "generate_report":
            fees = Fee.objects.select_related('student__user').all().order_by('student__user__last_name')
            html = render_to_string('fees_report.html', {'fees': fees})
            return HttpResponse(html)
        return Response({"error": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)

# === Model ViewSets ===

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().order_by('first_name', 'last_name')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related('user').all()
    serializer_class = StudentSerializer

class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.select_related('user').all()
    serializer_class = TeacherSerializer

    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        teacher = self.get_object()
        classes_taught = SchoolClass.objects.filter(teacher=teacher.user)
        students = Student.objects.filter(school_class__in=classes_taught).distinct()
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def classes(self, request, pk=None):
        teacher = self.get_object()
        classes_taught = SchoolClass.objects.filter(teacher=teacher.user)
        serializer = SchoolClassSerializer(classes_taught, many=True)
        return Response(serializer.data)

class SchoolClassViewSet(viewsets.ModelViewSet):
    queryset = SchoolClass.objects.all()
    serializer_class = SchoolClassSerializer

class FeeTypeViewSet(viewsets.ModelViewSet):
    queryset = FeeType.objects.all().order_by('category', 'name')
    serializer_class = FeeTypeSerializer
    permission_classes = [IsAdminUser]

class FeeViewSet(viewsets.ModelViewSet):
    queryset = Fee.objects.all()
    serializer_class = FeeSerializer

class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all().order_by('-id')
    serializer_class = LeaveRequestSerializer

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer

class TimetableViewSet(viewsets.ModelViewSet):
    queryset = Timetable.objects.all()
    serializer_class = TimetableSerializer

class ReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]
    @action(detail=False, methods=['get'])
    def academic(self, request):
        return Response({
            "total_students": Student.objects.count(),
            "total_teachers": Teacher.objects.count(),
            "total_classes": SchoolClass.objects.count(),
        })
    
    @action(detail=False, methods=['get'], url_path='fees-summary')
    def fees_summary(self, request):
        paid_fees = Fee.objects.filter(status='paid')
        unpaid_fees = Fee.objects.filter(status__in=['unpaid', 'partial'])
        pie_chart_data = {
            'paid_count': paid_fees.count(),
            'paid_total': paid_fees.aggregate(total=Sum('amount'))['total'] or 0,
            'unpaid_count': unpaid_fees.count(),
            'unpaid_total': unpaid_fees.aggregate(total=Sum('amount'))['total'] or 0,
        }
        class_breakdown = unpaid_fees.values('student__school_class__name') \
            .annotate(total_pending=Sum('amount'), student_count=Count('student', distinct=True)) \
            .order_by('-total_pending')
        return Response({"pie_chart": pie_chart_data, "class_breakdown": list(class_breakdown)})
class ClassViewSet(viewsets.ModelViewSet):
    queryset = SchoolClass.objects.all()
    serializer_class = SchoolClassSerializer

    @action(detail=True, methods=['get'])
    def details(self, request, pk=None):
        """Get detailed information about a specific class including students and teacher."""
        try:
            school_class = self.get_object()
            students = Student.objects.filter(school_class=school_class).select_related('user')
            teacher = school_class.teacher

            data = {
                'class_info': SchoolClassSerializer(school_class).data,
                'teacher': UserSerializer(teacher.user).data if teacher else None,
                'students': StudentSerializer(students, many=True).data,
                'total_students': students.count()
            }
            return Response(data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class StudentDetailView(views.APIView):
    """Get detailed information about a specific student."""
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        try:
            student = Student.objects.select_related('user').get(pk=student_id)
            # Check if user has permission to view this student
            if request.user.role == 'student' and request.user != student.user:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

            # Get student's attendance, grades, fees, etc.
            attendance_records = student.attendance_records.all()
            grades = student.grades.all().order_by('-graded_date')
            fees = Fee.objects.filter(student=student)

            data = {
                'student': StudentSerializer(student).data,
                'attendance': AttendanceSerializer(attendance_records, many=True).data,
                'grades': GradeSerializer(grades, many=True).data,
                'fees': FeeSerializer(fees, many=True).data,
                'attendance_rate': (attendance_records.filter(status__in=['present', 'late']).count() / attendance_records.count() * 100) if attendance_records.count() > 0 else 0
            }
            return Response(data)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PeriodViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing the school's period time slots.
    """
    queryset = Period.objects.all()
    serializer_class = PeriodSerializer
    permission_classes = [IsAdminUser] # Only principals can edit period timings

class TaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing teacher tasks.
    """
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return tasks for the current teacher user."""
        if self.request.user.role == User.Role.TEACHER:
            try:
                teacher = Teacher.objects.get(user=self.request.user)
                return Task.objects.filter(teacher=teacher)
            except Teacher.DoesNotExist:
                return Task.objects.none()
        elif self.request.user.role == User.Role.PRINCIPAL:
            # Principals can see all tasks
            return Task.objects.all()
        return Task.objects.none()

    def perform_create(self, serializer):
        """Set the teacher when creating a task."""
        if self.request.user.role == User.Role.TEACHER:
            try:
                teacher = Teacher.objects.get(user=self.request.user)
                serializer.save(teacher=teacher)
            except Teacher.DoesNotExist:
                raise serializers.ValidationError("Teacher profile not found.")
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """Mark a task as completed."""
        task = self.get_object()
        task.mark_completed()
        serializer = self.get_serializer(task)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_in_progress(self, request, pk=None):
        """Mark a task as in progress."""
        task = self.get_object()
        task.mark_in_progress()
        serializer = self.get_serializer(task)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def today_tasks(self, request):
        """Get tasks for today."""
        today = models.timezone.now().date()
        queryset = self.get_queryset().filter(due_date=today)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming_tasks(self, request):
        """Get upcoming tasks (next 7 days)."""
        today = models.timezone.now().date()
        next_week = today + models.timedelta(days=7)
        queryset = self.get_queryset().filter(
            due_date__gte=today,
            due_date__lte=next_week
        ).order_by('due_date', 'due_time')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)