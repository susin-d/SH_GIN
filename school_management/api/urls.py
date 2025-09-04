from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from .views import StudentDashboardView, AdminUserUpdateView, StudentDetailView # Import AdminUserUpdateView
from .views import FeeActionsView # Import the new view

router = DefaultRouter()
# --- REGISTER THE NEW UserViewSet ---
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'fee-types', views.FeeTypeViewSet, basename='feetype')
router.register(r'students', views.StudentViewSet, basename='student')
router.register(r'teachers', views.TeacherViewSet, basename='teacher')
router.register(r'classes', views.ClassViewSet, basename='class')
router.register(r'fees', views.FeeViewSet, basename='fee')
router.register(r'attendance', views.AttendanceViewSet, basename='attendance')
router.register(r'timetable', views.TimetableViewSet, basename='timetable')
router.register(r'leaves', views.LeaveRequestViewSet, basename='leave')
router.register(r'reports', views.ReportViewSet, basename='report')
router.register(r'periods', views.PeriodViewSet, basename='period')
router.register(r'tasks', views.TaskViewSet, basename='task')

urlpatterns = [
    # --- ADD THE NEW PATH FOR CREDENTIAL CHANGE ---
    path('admin/update-user/', AdminUserUpdateView.as_view(), name='admin_update_user'),
    path('fees/actions/', FeeActionsView.as_view(), name='fee_actions'),

    # ... (keep all other paths)
    path('health/', views.HealthCheckView.as_view(), name='health_check'),
    path('student/dashboard/', StudentDashboardView.as_view(), name='student_dashboard'),
    path('student/<int:student_id>/details/', StudentDetailView.as_view(), name='student_details'),
    path('auth/login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', views.LogoutView.as_view(), name='auth_logout'),
    path('auth/user/', views.CurrentUserView.as_view(), name='current_user'),
    path('', include(router.urls)),
]