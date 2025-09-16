from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from .models import *

# === User and Auth Serializers ===

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'phone', 'address', 'class_name', 'subject', 'date_of_birth', 'gender',
            'emergency_contact', 'emergency_phone', 'blood_group', 'nationality', 'religion',
            'aadhar_number', 'pan_number', 'marital_status', 'languages_known', 'medical_conditions',
            'alternate_phone', 'whatsapp_number', 'personal_email', 'permanent_address',
            'city', 'state', 'pincode', 'country'
        ]

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'profile']
        extra_kwargs = {
            'username': {'required': False},
            'email': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False},
            'role': {'required': False},
        }

class SchoolSerializer(serializers.ModelSerializer):
    principal = UserSerializer(read_only=True)
    class Meta:
        model = School
        fields = '__all__'

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
    school_class = serializers.CharField(source='school_class.name', read_only=True) # Display class name

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

        # Handle profile updates
        profile_data = user_data.get('profile', {})
        if profile_data:
            profile, created = UserProfile.objects.get_or_create(user=user)
            for field, value in profile_data.items():
                if value is not None:  # Only update non-null values
                    setattr(profile, field, value)
            profile.save()

        # Note: school_class is read-only in serializer, handle separately if needed
        instance.save()
        return instance

class TeacherSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    class Meta:
        model = Teacher
        fields = '__all__'

    @transaction.atomic
    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user

        user.email = user_data.get('email', user.email)
        user.first_name = user_data.get('first_name', user.first_name)
        user.last_name = user_data.get('last_name', user.last_name)
        user.save()

        # Handle profile updates
        profile_data = user_data.get('profile', {})
        if profile_data:
            profile, created = UserProfile.objects.get_or_create(user=user)
            for field, value in profile_data.items():
                if value is not None:  # Only update non-null values
                    setattr(profile, field, value)
            profile.save()

        # Update teacher-specific fields
        instance.hire_date = validated_data.get('hire_date', instance.hire_date)
        instance.qualification = validated_data.get('qualification', instance.qualification)
        instance.experience_years = validated_data.get('experience_years', instance.experience_years)
        instance.specialization = validated_data.get('specialization', instance.specialization)
        instance.save()
        return instance

class PeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Period
        fields = '__all__'

class TimetableSerializer(serializers.ModelSerializer):
    teacher = TeacherSerializer(read_only=True, allow_null=True)
    day_of_week_display = serializers.CharField(source='get_day_of_week_display', read_only=True)

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

