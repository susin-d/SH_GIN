from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from .models import *

# === User and Auth Serializers ===

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['phone', 'address', 'class_name', 'subject']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'profile']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        serializer = UserSerializer(self.user)
        data['user'] = serializer.data
        return data

# === Admin Action Serializers ===

class AdminUserUpdateSerializer(serializers.Serializer):
    """
    Serializer for the admin action to update a user's credentials.
    """
    user_id = serializers.IntegerField(required=True)
    username = serializers.CharField(required=False, allow_blank=False)
    password = serializers.CharField(required=False, allow_blank=False, style={'input_type': 'password'})

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value
    
    def validate_password(self, value):
        validate_password(value)
        return value

# === Model Serializers with Create/Update Logic ===

class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    school_class = serializers.StringRelatedField() # Display class name instead of ID

    class Meta:
        model = Student
        fields = '__all__'

    @transaction.atomic
    def create(self, validated_data):
        user_data = validated_data.pop('user')
        # Note: Password should be set during creation, assuming a default or passed in
        user = User.objects.create_user(
            username=user_data['username'],
            email=user_data.get('email', ''),
            first_name=user_data.get('first_name', ''),
            last_name=user_data.get('last_name', ''),
            role=User.Role.STUDENT
        )
        student = Student.objects.create(user=user, **validated_data)
        return student

    @transaction.atomic
    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user

        user.email = user_data.get('email', user.email)
        user.first_name = user_data.get('first_name', user.first_name)
        user.last_name = user_data.get('last_name', user.last_name)
        user.save()

        instance.school_class = validated_data.get('school_class', instance.school_class)
        instance.save()
        return instance

class TeacherSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    class Meta:
        model = Teacher
        fields = '__all__'

class PeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Period
        fields = '__all__'

class TimetableSerializer(serializers.ModelSerializer):
    teacher = TeacherSerializer(read_only=True, allow_null=True)
    period = PeriodSerializer(read_only=True) # <-- Use the new serializer

    class Meta:
        model = Timetable
        fields = '__all__'

class FeeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeType
        fields = '__all__'

class FeeSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    class Meta:
        model = Fee
        fields = '__all__'

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = '__all__'

class LeaveRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ['user']
    def create(self, validated_data):
      validated_data['user'] = self.context['request'].user
      return super().create(validated_data)

class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ['id', 'title', 'description', 'due_date', 'school_class']
class SchoolClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolClass
        fields = '__all__'

class GradeSerializer(serializers.ModelSerializer):
    assignment = AssignmentSerializer(read_only=True)
    class Meta:
        model = Grade
        fields = ['id', 'assignment', 'score', 'graded_date']
class SetPasswordSerializer(serializers.Serializer):
    """
    Serializer for the set password action.
    Validates that a user_id and a new_password are provided.
    """
    user_id = serializers.IntegerField(required=True)
    new_password = serializers.CharField(required=True, style={'input_type': 'password'})

    def validate_new_password(self, value):
        # You can add password strength validation here if desired
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        return value

# === Task Serializers ===

class TaskSerializer(serializers.ModelSerializer):
    teacher = TeacherSerializer(read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    task_type_display = serializers.CharField(source='get_task_type_display', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'teacher', 'title', 'description', 'task_type', 'task_type_display',
            'priority', 'priority_display', 'status', 'status_display',
            'due_date', 'due_time', 'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'completed_at']

    def create(self, validated_data):
        # Set the teacher based on the current user
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            try:
                teacher = Teacher.objects.get(user=request.user)
                validated_data['teacher'] = teacher
            except Teacher.DoesNotExist:
                raise serializers.ValidationError("Teacher profile not found for current user.")
        return super().create(validated_data)

# === User and Auth Serializers ===

