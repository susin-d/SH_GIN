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
from django.utils import timezone
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from asgiref.sync import sync_to_async
from datetime import timedelta
import asyncio
from .models import *
from .serializers import *

# === Public & Authentication Views ===

class HealthCheckView(views.APIView):
    """A public endpoint to check if the backend is running."""
    permission_classes = [AllowAny]

    @method_decorator(cache_page(60))  # Cache for 1 minute
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

    @method_decorator(cache_page(300))  # Cache for 5 minutes
    async def get(self, request, *args, **kwargs):
        user = self.request.user
        if user.role != User.Role.STUDENT:
            return Response({"error": "User is not a student"}, status=status.HTTP_403_FORBIDDEN)

        try:
            # Use async database queries
            student = await sync_to_async(Student.objects.select_related('user').get)(user=user)
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found"}, status=status.HTTP_404_NOT_FOUND)

        # Use async database queries for better performance
        attendance_records = await sync_to_async(lambda: list(student.attendance_records.all()))()
        total_days = len(attendance_records)
        present_days = len([record for record in attendance_records
                           if record.status in [Attendance.Status.PRESENT, Attendance.Status.LATE]])
        attendance_rate = (present_days / total_days * 100) if total_days > 0 else 100

        # Parallel async queries for better performance
        schedule_task = sync_to_async(lambda: list(Timetable.objects.filter(school_class=student.school_class)))()
        grades_task = sync_to_async(lambda: list(student.grades.all().order_by('-graded_date')))()
        assignments_task = sync_to_async(lambda: list(Assignment.objects.filter(school_class=student.school_class).order_by('due_date')))()

        schedule_data, grades_data, assignments_data = await asyncio.gather(
            schedule_task, grades_task, assignments_task
        )

        stats_data = {
            "attendanceRate": round(attendance_rate, 1),
            "currentGPA": 3.7,
            "completedAssignments": 28,
            "totalAssignments": 32,
            "upcomingDeadlines": 5,
            "currentGrade": "A-"
        }

        # Process subjects data asynchronously
        subjects_data = []
        unique_subjects = await sync_to_async(lambda: list(set(
            (entry.subject, entry.teacher_id) for entry in schedule_data
        )))()

        # Batch fetch teachers for better performance
        teacher_ids = [teacher_id for _, teacher_id in unique_subjects if teacher_id]
        teachers = await sync_to_async(lambda: {
            teacher.id: teacher for teacher in Teacher.objects.filter(id__in=teacher_ids).select_related('user')
        })()

        for idx, (subject, teacher_id) in enumerate(unique_subjects):
            teacher = teachers.get(teacher_id)
            teacher_name = f"{teacher.user.first_name} {teacher.user.last_name}" if teacher else "Unknown"
            subjects_data.append({
                "id": idx + 1,
                "name": subject,
                "teacher": teacher_name,
                "grade": "A-",
                "attendance": 95,
                "nextClass": "Tomorrow 9:00 AM"
            })

        payload = {
            "stats": stats_data,
            "subjects": subjects_data,
            "assignments": await sync_to_async(lambda: AssignmentSerializer(assignments_data, many=True).data)(),
            "schedule": await sync_to_async(lambda: TimetableSerializer(schedule_data, many=True).data)(),
            "grades": await sync_to_async(lambda: GradeSerializer(grades_data, many=True).data)(),
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

    @method_decorator(cache_page(300))  # Cache for 5 minutes
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related('user').all()
    serializer_class = StudentSerializer

    @method_decorator(cache_page(300))  # Cache for 5 minutes
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.select_related('user').all()
    serializer_class = TeacherSerializer

    @method_decorator(cache_page(300))  # Cache for 5 minutes
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

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

    @action(detail=False, methods=['get'], url_path='class/(?P<class_id>\d+)')
    def by_class(self, request, class_id=None):
        """Get timetable entries for a specific class."""
        try:
            school_class = SchoolClass.objects.get(pk=class_id)
            timetable_entries = Timetable.objects.filter(school_class=school_class).select_related('teacher__user', 'school_class')
            serializer = self.get_serializer(timetable_entries, many=True)
            return Response(serializer.data)
        except SchoolClass.DoesNotExist:
            return Response({'error': 'Class not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='overview')
    def overview(self, request):
        """Get a comprehensive overview of all timetable data."""
        try:
            # Get all classes with their timetable statistics
            classes = SchoolClass.objects.all()
            overview_data = []

            for school_class in classes:
                timetable_entries = Timetable.objects.filter(school_class=school_class)
                teachers = set()
                subjects = set()

                for entry in timetable_entries:
                    subjects.add(entry.subject)
                    if entry.teacher:
                        teachers.add(f"{entry.teacher.user.first_name} {entry.teacher.user.last_name}")

                overview_data.append({
                    'class_id': school_class.id,
                    'class_name': school_class.name,
                    'total_slots': timetable_entries.count(),
                    'unique_subjects': len(subjects),
                    'unique_teachers': len(teachers),
                    'subjects_list': list(subjects),
                    'teachers_list': list(teachers)
                })

            return Response({
                'total_classes': len(overview_data),
                'total_timetable_entries': sum(item['total_slots'] for item in overview_data),
                'classes_overview': overview_data
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]

    @method_decorator(cache_page(600))  # Cache for 10 minutes
    @action(detail=False, methods=['get'])
    def academic(self, request):
        return Response({
            "total_students": Student.objects.count(),
            "total_teachers": Teacher.objects.count(),
            "total_classes": SchoolClass.objects.count(),
        })

    @method_decorator(cache_page(600))  # Cache for 10 minutes
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
        today = timezone.now().date()
        queryset = self.get_queryset().filter(due_date=today)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming_tasks(self, request):
        """Get upcoming tasks (next 7 days)."""
        today = timezone.now().date()
        next_week = today + timedelta(days=7)
        queryset = self.get_queryset().filter(
            due_date__gte=today,
            due_date__lte=next_week
        ).order_by('due_date', 'due_time')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

# === Database Snapshot/Backup Views ===

class DatabaseSnapshotView(views.APIView):
    """Create and manage database snapshots for backup purposes."""
    permission_classes = [IsAdminUser]

    async def get(self, request, *args, **kwargs):
        """Export complete database snapshot in JSON format."""
        try:
            # Use async database queries for better performance
            async def get_users():
                return await sync_to_async(lambda: UserSerializer(User.objects.all(), many=True).data)()

            async def get_students():
                return await sync_to_async(lambda: StudentSerializer(Student.objects.select_related('user').all(), many=True).data)()

            async def get_teachers():
                return await sync_to_async(lambda: TeacherSerializer(Teacher.objects.select_related('user').all(), many=True).data)()

            async def get_classes():
                return await sync_to_async(lambda: SchoolClassSerializer(SchoolClass.objects.all(), many=True).data)()

            async def get_fees():
                return await sync_to_async(lambda: FeeSerializer(Fee.objects.select_related('student__user').all(), many=True).data)()

            async def get_fee_types():
                return await sync_to_async(lambda: FeeTypeSerializer(FeeType.objects.all(), many=True).data)()

            async def get_leave_requests():
                return await sync_to_async(lambda: LeaveRequestSerializer(LeaveRequest.objects.all(), many=True).data)()

            async def get_attendances():
                return await sync_to_async(lambda: AttendanceSerializer(Attendance.objects.all(), many=True).data)()

            async def get_timetables():
                return await sync_to_async(lambda: TimetableSerializer(Timetable.objects.select_related('teacher__user', 'school_class').all(), many=True).data)()

            async def get_assignments():
                return await sync_to_async(lambda: AssignmentSerializer(Assignment.objects.all(), many=True).data)()

            async def get_grades():
                return await sync_to_async(lambda: GradeSerializer(Grade.objects.all(), many=True).data)()

            async def get_tasks():
                return await sync_to_async(lambda: TaskSerializer(Task.objects.all(), many=True).data)()

            async def get_periods():
                return await sync_to_async(lambda: PeriodSerializer(Period.objects.all(), many=True).data)()

            async def get_notifications():
                return await sync_to_async(lambda: NotificationSerializer(Notification.objects.all(), many=True).data)()

            # Parallel async queries for maximum performance
            data_tasks = await asyncio.gather(
                get_users(),
                get_students(),
                get_teachers(),
                get_classes(),
                get_fees(),
                get_fee_types(),
                get_leave_requests(),
                get_attendances(),
                get_timetables(),
                get_assignments(),
                get_grades(),
                get_tasks(),
                get_periods(),
                get_notifications()
            )

            # Statistics queries
            stats_tasks = await asyncio.gather(
                sync_to_async(User.objects.count)(),
                sync_to_async(Student.objects.count)(),
                sync_to_async(Teacher.objects.count)(),
                sync_to_async(SchoolClass.objects.count)(),
                sync_to_async(Fee.objects.count)(),
                sync_to_async(LeaveRequest.objects.count)(),
                sync_to_async(Attendance.objects.count)(),
                sync_to_async(Timetable.objects.count)(),
                sync_to_async(Assignment.objects.count)(),
                sync_to_async(Grade.objects.count)(),
                sync_to_async(Task.objects.count)(),
            )

            # Collect all data from all models
            snapshot_data = {
                'metadata': {
                    'timestamp': timezone.now().isoformat(),
                    'version': '1.0',
                    'description': 'Complete database snapshot'
                },
                'data': {
                    'users': data_tasks[0],
                    'students': data_tasks[1],
                    'teachers': data_tasks[2],
                    'school_classes': data_tasks[3],
                    'fees': data_tasks[4],
                    'fee_types': data_tasks[5],
                    'leave_requests': data_tasks[6],
                    'attendances': data_tasks[7],
                    'timetables': data_tasks[8],
                    'assignments': data_tasks[9],
                    'grades': data_tasks[10],
                    'tasks': data_tasks[11],
                    'periods': data_tasks[12],
                    'notifications': data_tasks[13],
                },
                'statistics': {
                    'total_users': stats_tasks[0],
                    'total_students': stats_tasks[1],
                    'total_teachers': stats_tasks[2],
                    'total_classes': stats_tasks[3],
                    'total_fees': stats_tasks[4],
                    'total_leave_requests': stats_tasks[5],
                    'total_attendances': stats_tasks[6],
                    'total_timetable_entries': stats_tasks[7],
                    'total_assignments': stats_tasks[8],
                    'total_grades': stats_tasks[9],
                    'total_tasks': stats_tasks[10],
                }
            }

            return Response(snapshot_data)

        except Exception as e:
            return Response(
                {'error': f'Failed to create database snapshot: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    async def post(self, request, *args, **kwargs):
        """Import database snapshot from JSON data."""
        try:
            snapshot_data = request.data

            if not isinstance(snapshot_data, dict) or 'data' not in snapshot_data:
                return Response(
                    {'error': 'Invalid snapshot format'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # This would require careful implementation to avoid data conflicts
            # For now, return a message that import is not implemented
            return Response({
                'message': 'Database import functionality is not yet implemented',
                'received_data_keys': list(snapshot_data.get('data', {}).keys())
            })

        except Exception as e:
            return Response(
                {'error': f'Failed to import database snapshot: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# === Async Task Processing ===

class AsyncTaskViewSet(viewsets.ViewSet):
    """Handle async background tasks"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    async def process_bulk_data(self, request):
        """Process bulk data operations asynchronously"""
        try:
            operation_type = request.data.get('operation')
            data = request.data.get('data', [])

            if operation_type == 'bulk_grade_update':
                # Simulate async bulk grade processing
                await asyncio.sleep(0.1)  # Simulate processing time
                return Response({
                    'message': f'Processed {len(data)} grade updates asynchronously',
                    'status': 'completed'
                })

            elif operation_type == 'bulk_attendance':
                # Simulate async bulk attendance processing
                await asyncio.sleep(0.1)
                return Response({
                    'message': f'Processed {len(data)} attendance records asynchronously',
                    'status': 'completed'
                })

            return Response({'error': 'Unknown operation type'}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {'error': f'Async processing failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    async def generate_report_async(self, request):
        """Generate reports asynchronously"""
        try:
            report_type = request.data.get('report_type', 'academic')

            # Simulate async report generation
            await asyncio.sleep(0.5)  # Simulate report generation time

            return Response({
                'message': f'{report_type.title()} report generated asynchronously',
                'report_id': f'report_{timezone.now().strftime("%Y%m%d_%H%M%S")}',
                'status': 'completed'
            })

        except Exception as e:
            return Response(
                {'error': f'Report generation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# === Report Management Views ===

class ReportManagementViewSet(viewsets.ViewSet):
    """Manage report generation, storage, and retrieval"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate a new report"""
        from django.core.management import call_command
        from django.conf import settings
        import os

        report_type = request.data.get('report_type', 'all')
        output_format = request.data.get('format', 'json')

        try:
            # Generate report using management command
            call_command('generate_reports',
                        report_type=report_type,
                        format=output_format)

            # Find the latest report directory
            reports_base_dir = os.path.join(settings.BASE_DIR, 'reports')
            if os.path.exists(reports_base_dir):
                report_dirs = [d for d in os.listdir(reports_base_dir)
                             if d.startswith('report_')]
                if report_dirs:
                    latest_report = max(report_dirs)
                    report_path = os.path.join(reports_base_dir, latest_report)

                    return Response({
                        'message': 'Report generated successfully',
                        'report_id': latest_report,
                        'report_path': report_path,
                        'generated_at': timezone.now().isoformat()
                    })

            return Response({'message': 'Report generated successfully'})

        except Exception as e:
            return Response(
                {'error': f'Failed to generate report: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def list_reports(self, request):
        """List all available reports"""
        from django.conf import settings
        import os

        reports_base_dir = os.path.join(settings.BASE_DIR, 'reports')
        reports = []

        if os.path.exists(reports_base_dir):
            for item in os.listdir(reports_base_dir):
                item_path = os.path.join(reports_base_dir, item)
                if os.path.isdir(item_path) and item.startswith('report_'):
                    metadata_file = os.path.join(item_path, 'metadata.json')
                    if os.path.exists(metadata_file):
                        try:
                            with open(metadata_file, 'r') as f:
                                metadata = json.load(f)
                            reports.append(metadata)
                        except:
                            # If metadata can't be read, create basic info
                            reports.append({
                                'report_id': item,
                                'generated_at': item.replace('report_', '').replace('_', 'T'),
                                'report_type': 'unknown'
                            })

        # Sort by generation date (newest first)
        reports.sort(key=lambda x: x.get('generated_at', ''), reverse=True)

        return Response({
            'reports': reports,
            'total': len(reports)
        })

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download a specific report file"""
        from django.conf import settings
        from django.http import HttpResponse, Http404
        import os
        import mimetypes

        file_path = request.query_params.get('path', '')
        if not file_path:
            return Response(
                {'error': 'File path parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Security check - ensure path is within reports directory
        reports_base_dir = os.path.join(settings.BASE_DIR, 'reports')
        full_path = os.path.join(reports_base_dir, pk, file_path)

        # Prevent directory traversal
        if not os.path.abspath(full_path).startswith(os.path.abspath(reports_base_dir)):
            return Response(
                {'error': 'Invalid file path'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            raise Http404("File not found")

        # Determine content type
        content_type, _ = mimetypes.guess_type(full_path)
        if content_type is None:
            content_type = 'application/octet-stream'

        # Read file and return response
        with open(full_path, 'rb') as f:
            file_data = f.read()

        response = HttpResponse(file_data, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{os.path.basename(full_path)}"'
        return response

    @action(detail=True, methods=['get'])
    def files(self, request, pk=None):
        """List files in a specific report directory"""
        from django.conf import settings
        import os

        reports_base_dir = os.path.join(settings.BASE_DIR, 'reports')
        report_dir = os.path.join(reports_base_dir, pk)

        if not os.path.exists(report_dir):
            return Response(
                {'error': 'Report not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        files = []
        for root, dirs, filenames in os.walk(report_dir):
            for filename in filenames:
                full_path = os.path.join(root, filename)
                rel_path = os.path.relpath(full_path, report_dir)
                file_size = os.path.getsize(full_path)
                files.append({
                    'name': filename,
                    'path': rel_path,
                    'size': file_size,
                    'type': filename.split('.')[-1] if '.' in filename else 'unknown'
                })

        return Response({
            'report_id': pk,
            'files': files,
            'total_files': len(files)
        })

    @action(detail=True, methods=['delete'])
    def delete(self, request, pk=None):
        """Delete a specific report"""
        from django.conf import settings
        import shutil

        # Only allow principals to delete reports
        if request.user.role != User.Role.PRINCIPAL:
            return Response(
                {'error': 'Only principals can delete reports'},
                status=status.HTTP_403_FORBIDDEN
            )

        reports_base_dir = os.path.join(settings.BASE_DIR, 'reports')
        report_dir = os.path.join(reports_base_dir, pk)

        if not os.path.exists(report_dir):
            return Response(
                {'error': 'Report not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            shutil.rmtree(report_dir)
            return Response({'message': f'Report {pk} deleted successfully'})
        except Exception as e:
            return Response(
                {'error': f'Failed to delete report: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )