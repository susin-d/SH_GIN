from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'students', views.StudentViewSet)
router.register(r'teachers', views.TeacherViewSet)
router.register(r'classes', views.ClassViewSet)
router.register(r'fees', views.FeeViewSet)
router.register(r'attendance', views.AttendanceViewSet)
router.register(r'timetable', views.TimetableViewSet)
router.register(r'leaves', views.LeaveRequestViewSet, basename='leave')
router.register(r'reports', views.ReportViewSet, basename='report')

# The API URLs are now determined automatically by the router.
# Additionally, we include the login URLs.
urlpatterns = [
    # Auth endpoints
    path('auth/login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', views.LogoutView.as_view(), name='auth_logout'),
    path('auth/user/', views.CurrentUserView.as_view(), name='current_user'),

    # Include all router-generated URLs
    path('', include(router.urls)),
]