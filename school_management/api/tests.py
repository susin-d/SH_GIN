from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Student, Teacher, UserProfile, SchoolClass

User = get_user_model()

class ProfileUpdateAPITestCase(APITestCase):
    """Test cases for profile update functionality"""

    def setUp(self):
        """Set up test data"""
        # Create users
        self.student_user = User.objects.create_user(
            username='student1',
            email='student1@test.com',
            password='testpass123',
            first_name='John',
            last_name='Doe',
            role='student'
        )

        self.teacher_user = User.objects.create_user(
            username='teacher1',
            email='teacher1@test.com',
            password='testpass123',
            first_name='Jane',
            last_name='Smith',
            role='teacher'
        )

        # Create related objects
        self.school_class = SchoolClass.objects.create(name='10A')

        self.student = Student.objects.create(
            user=self.student_user,
            school_class=self.school_class
        )

        self.teacher = Teacher.objects.create(
            user=self.teacher_user,
            qualification='M.Ed',
            experience_years=5
        )

        # Create profiles
        self.student_profile = UserProfile.objects.create(
            user=self.student_user,
            phone='1234567890',
            address='123 Student St'
        )

        self.teacher_profile = UserProfile.objects.create(
            user=self.teacher_user,
            phone='0987654321',
            address='456 Teacher Ave'
        )

    def get_student_token(self):
        """Get JWT token for student"""
        refresh = RefreshToken.for_user(self.student_user)
        return str(refresh.access_token)

    def get_teacher_token(self):
        """Get JWT token for teacher"""
        refresh = RefreshToken.for_user(self.teacher_user)
        return str(refresh.access_token)

    def test_student_profile_update_basic_fields(self):
        """Test updating basic student profile fields"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.get_student_token()}')

        update_data = {
            'user': {
                'first_name': 'Johnny',
                'last_name': 'Updated',
                'email': 'johnny.updated@test.com'
            }
        }

        response = self.client.put(
            reverse('student-detail', kwargs={'pk': self.student_user.id}),
            update_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh from database
        self.student_user.refresh_from_db()
        self.assertEqual(self.student_user.first_name, 'Johnny')
        self.assertEqual(self.student_user.last_name, 'Updated')
        self.assertEqual(self.student_user.email, 'johnny.updated@test.com')

    def test_student_profile_update_with_profile_fields(self):
        """Test updating student profile with UserProfile fields"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.get_student_token()}')

        update_data = {
            'user': {
                'first_name': 'John',
                'last_name': 'Doe',
                'email': 'student1@test.com',
                'profile': {
                    'phone': '1112223333',
                    'address': 'Updated Student Address',
                    'date_of_birth': '2000-01-01',
                    'gender': 'male',
                    'blood_group': 'O+'
                }
            },
            'school_class': '10A'
        }

        response = self.client.put(
            reverse('student-detail', kwargs={'pk': self.student_user.id}),
            update_data,
            format='json'
        )

        if response.status_code != status.HTTP_200_OK:
            import json
            print(f"Response status: {response.status_code}")
            print(f"Response data: {json.dumps(response.data, indent=2)}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check UserProfile was updated
        self.student_profile.refresh_from_db()
        self.assertEqual(self.student_profile.phone, '1112223333')
        self.assertEqual(self.student_profile.address, 'Updated Student Address')
        self.assertEqual(str(self.student_profile.date_of_birth), '2000-01-01')
        self.assertEqual(self.student_profile.gender, 'male')
        self.assertEqual(self.student_profile.blood_group, 'O+')

    def test_teacher_profile_update_basic_fields(self):
        """Test updating basic teacher profile fields"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.get_teacher_token()}')

        update_data = {
            'user': {
                'first_name': 'Dr. Jane',
                'last_name': 'Smith-PhD',
                'email': 'dr.jane@test.com'
            },
            'qualification': 'Ph.D. in Education',
            'experience_years': 10,
            'specialization': 'Mathematics'
        }

        response = self.client.put(
            reverse('teacher-detail', kwargs={'pk': self.teacher_user.id}),
            update_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Refresh from database
        self.teacher_user.refresh_from_db()
        self.teacher.refresh_from_db()

        self.assertEqual(self.teacher_user.first_name, 'Dr. Jane')
        self.assertEqual(self.teacher_user.last_name, 'Smith-PhD')
        self.assertEqual(self.teacher.qualification, 'Ph.D. in Education')
        self.assertEqual(self.teacher.experience_years, 10)
        self.assertEqual(self.teacher.specialization, 'Mathematics')

    def test_teacher_profile_update_with_profile_fields(self):
        """Test updating teacher profile with UserProfile fields"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.get_teacher_token()}')

        update_data = {
            'user': {
                'first_name': 'Jane',
                'last_name': 'Smith',
                'email': 'teacher1@test.com',
                'profile': {
                    'phone': '4445556666',
                    'address': 'Updated Teacher Address',
                    'date_of_birth': '1980-05-15',
                    'gender': 'female',
                    'blood_group': 'A+'
                }
            },
            'qualification': 'M.Ed',
            'experience_years': 5
        }

        response = self.client.put(
            reverse('teacher-detail', kwargs={'pk': self.teacher_user.id}),
            update_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check UserProfile was updated
        self.teacher_profile.refresh_from_db()
        self.assertEqual(self.teacher_profile.phone, '4445556666')
        self.assertEqual(self.teacher_profile.address, 'Updated Teacher Address')
        self.assertEqual(str(self.teacher_profile.date_of_birth), '1980-05-15')
        self.assertEqual(self.teacher_profile.gender, 'female')
        self.assertEqual(self.teacher_profile.blood_group, 'A+')

    def test_unauthorized_profile_update(self):
        """Test that users cannot update other users' profiles"""
        # Student trying to update teacher's profile
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.get_student_token()}')

        update_data = {
            'user': {
                'first_name': 'Hacked',
                'email': 'hacked@test.com'
            }
        }

        response = self.client.put(
            reverse('teacher-detail', kwargs={'pk': self.teacher_user.id}),
            update_data,
            format='json'
        )

        # Should be forbidden or not found
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])

    def test_profile_update_validation(self):
        """Test validation for profile updates"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.get_student_token()}')

        # Invalid email format
        update_data = {
            'user': {
                'email': 'invalid-email'
            }
        }

        response = self.client.put(
            reverse('student-detail', kwargs={'pk': self.student_user.id}),
            update_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_profile_creation_on_update(self):
        """Test that UserProfile is created if it doesn't exist"""
        # Create a user without profile
        user_without_profile = User.objects.create_user(
            username='student2',
            email='student2@test.com',
            password='testpass123',
            role='student'
        )
        Student.objects.create(user=user_without_profile, school_class=self.school_class)

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {RefreshToken.for_user(user_without_profile).access_token}')

        update_data = {
            'user': {
                'profile': {
                    'phone': '7778889999',
                    'address': 'New Student Address'
                }
            },
        }

        response = self.client.put(
            reverse('student-detail', kwargs={'pk': user_without_profile.id}),
            update_data,
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check that profile was created
        profile = UserProfile.objects.get(user=user_without_profile)
        self.assertEqual(profile.phone, '7778889999')
        self.assertEqual(profile.address, 'New Student Address')

class HealthCheckTestCase(APITestCase):
    """Test health check endpoint"""

    def test_health_check(self):
        """Test that health check endpoint works"""
        response = self.client.get(reverse('health_check'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'ok')
        self.assertIn('message', response.data)
