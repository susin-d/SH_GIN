from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
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
        # Add user data to the login response to match the frontend client
        user_serializer = UserSerializer(self.user)
        data['user'] = user_serializer.data
        return data

# === Model Serializers ===

class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer() # Nest user data
    class Meta:
        model = Student
        fields = '__all__'

class TeacherSerializer(serializers.ModelSerializer):
    user = UserSerializer() # Nest user data
    class Meta:
        model = Teacher
        fields = '__all__'

class SchoolClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolClass
        fields = '__all__'

class FeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fee
        fields = '__all__'

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = '__all__'

class TimetableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Timetable
        fields = '__all__'

class LeaveRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ['user']

    def create(self, validated_data):
      # Attach the requesting user to the leave request on creation
      validated_data['user'] = self.context['request'].user
      return super().create(validated_data)