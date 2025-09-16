from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import *
from datetime import date, time

class Command(BaseCommand):
    help = 'Create demo data for the school management system'

    def handle(self, *args, **options):
        self.stdout.write('Creating demo data...')

        # Create Principal
        principal_user, created = User.objects.get_or_create(
            username='principal_demo',
            defaults={
                'email': 'principal@demo.com',
                'first_name': 'Dr. Sarah',
                'last_name': 'Johnson',
                'role': User.Role.PRINCIPAL
            }
        )
        if created:
            principal_user.set_password('demo123')
            principal_user.save()

        principal_profile, created = UserProfile.objects.get_or_create(
            user=principal_user,
            defaults={
                'phone': '+91 9876543210',
                'address': '123 School Street, Education City, Mumbai',
                'date_of_birth': date(1975, 5, 15),
                'gender': 'female',
                'emergency_contact': 'Mike Johnson',
                'emergency_phone': '+91 9876543211',
                'blood_group': 'O+',
                'nationality': 'Indian',
                'religion': 'Christian'
            }
        )

        # Create School
        school, created = School.objects.get_or_create(
            name='Demo International School',
            defaults={
                'address': '456 Education Avenue, Knowledge City, Mumbai - 400001',
                'phone': '+91 9876543200',
                'email': 'info@demo.edu.in',
                'principal': principal_user,
                'established_year': 2005
            }
        )

        # Create Classes (10 classes)
        classes_data = [
            {'name': 'Nursery', 'teacher_name': 'Ms. Emily Davis'},
            {'name': 'LKG', 'teacher_name': 'Ms. Sophia Wilson'},
            {'name': 'UKG', 'teacher_name': 'Ms. Olivia Brown'},
            {'name': 'Class 1', 'teacher_name': 'Mr. James Miller'},
            {'name': 'Class 2', 'teacher_name': 'Ms. Isabella Garcia'},
            {'name': 'Class 3', 'teacher_name': 'Mr. Benjamin Rodriguez'},
            {'name': 'Class 4', 'teacher_name': 'Ms. Charlotte Martinez'},
            {'name': 'Class 5', 'teacher_name': 'Mr. Henry Lee'},
            {'name': 'Class 6', 'teacher_name': 'Ms. Amelia Taylor'},
            {'name': 'Class 7', 'teacher_name': 'Mr. Lucas Anderson'}
        ]

        teachers = []
        classes = []

        for class_data in classes_data:
            # Create Class
            school_class, created = SchoolClass.objects.get_or_create(
                name=class_data['name']
            )
            classes.append(school_class)

            # Create Teacher for this class
            teacher_username = f"teacher_{class_data['name'].lower().replace(' ', '_')}"
            teacher_user, created = User.objects.get_or_create(
                username=teacher_username,
                defaults={
                    'email': f"{teacher_username}@demo.edu.in",
                    'first_name': class_data['teacher_name'].split()[1],
                    'last_name': class_data['teacher_name'].split()[2] if len(class_data['teacher_name'].split()) > 2 else class_data['teacher_name'].split()[1],
                    'role': User.Role.TEACHER
                }
            )
            if created:
                teacher_user.set_password('demo123')
                teacher_user.save()

            teacher, created = Teacher.objects.get_or_create(
                user=teacher_user,
                defaults={
                    'hire_date': date(2018, 6, 1),
                    'qualification': 'B.Ed., M.A. Education',
                    'experience_years': 6,
                    'specialization': f"Primary Education - {class_data['name']}"
                }
            )

            # Create Teacher Profile
            UserProfile.objects.get_or_create(
                user=teacher_user,
                defaults={
                    'phone': f"+91 9876543{len(teachers)+10}",
                    'address': f"{len(teachers)+100} Teacher Colony, School Campus",
                    'date_of_birth': date(1985 + len(teachers), 3, 15),
                    'gender': 'female' if len(teachers) % 2 == 0 else 'male',
                    'emergency_contact': f"Spouse {teacher_user.first_name}",
                    'emergency_phone': f"+91 9876543{len(teachers)+20}",
                    'blood_group': 'A+' if len(teachers) % 2 == 0 else 'B+',
                    'nationality': 'Indian',
                    'religion': 'Hindu'
                }
            )

            teachers.append(teacher)
            school_class.teacher = teacher_user
            school_class.save()

        # Create Subjects (8 subjects)
        subjects_data = [
            {'name': 'Mathematics', 'teacher': teachers[3]},  # Class 1 teacher
            {'name': 'English', 'teacher': teachers[4]},      # Class 2 teacher
            {'name': 'Science', 'teacher': teachers[5]},      # Class 3 teacher
            {'name': 'Social Studies', 'teacher': teachers[6]}, # Class 4 teacher
            {'name': 'Hindi', 'teacher': teachers[7]},        # Class 5 teacher
            {'name': 'Computer Science', 'teacher': teachers[8]}, # Class 6 teacher
            {'name': 'Art & Craft', 'teacher': teachers[9]},  # Class 7 teacher
            {'name': 'Physical Education', 'teacher': teachers[0]} # Nursery teacher
        ]

        subjects = []
        for subject_data in subjects_data:
            subject_name = subject_data['name']
            teacher = subject_data['teacher']
            subjects.append((subject_name, teacher))

        # Create Periods
        periods_data = [
            {'period_number': 1, 'start_time': time(8, 0), 'end_time': time(8, 45)},
            {'period_number': 2, 'start_time': time(8, 45), 'end_time': time(9, 30)},
            {'period_number': 3, 'start_time': time(9, 30), 'end_time': time(10, 15)},
            {'period_number': 4, 'start_time': time(10, 15), 'end_time': time(11, 0)},
            {'period_number': 5, 'start_time': time(11, 0), 'end_time': time(11, 45)},
            {'period_number': 6, 'start_time': time(11, 45), 'end_time': time(12, 30)},
            {'period_number': 7, 'start_time': time(13, 30), 'end_time': time(14, 15)},
            {'period_number': 8, 'start_time': time(14, 15), 'end_time': time(15, 0)}
        ]

        periods = []
        for period_data in periods_data:
            period, created = Period.objects.get_or_create(
                period_number=period_data['period_number'],
                defaults={
                    'start_time': period_data['start_time'],
                    'end_time': period_data['end_time']
                }
            )
            periods.append(period)

        # Create Timetable
        days = ['MON', 'TUE', 'WED', 'THU', 'FRI']

        for class_obj in classes:
            for day_idx, day in enumerate(days):
                # Assign subjects to periods for each day
                for period_idx, period in enumerate(periods[:6]):  # Only first 6 periods for classes
                    if period_idx < len(subjects):
                        subject_name, teacher = subjects[period_idx]

                        Timetable.objects.get_or_create(
                            school_class=class_obj,
                            day_of_week=day,
                            start_time=period.start_time,
                            end_time=period.end_time,
                            defaults={
                                'subject': subject_name,
                                'teacher': teacher
                            }
                        )

        # Create some sample students
        for i in range(5):  # 5 students per class
            for class_obj in classes[:5]:  # Only for first 5 classes
                student_username = f"student_{class_obj.name.lower().replace(' ', '_')}_{i+1}"
                student_user, created = User.objects.get_or_create(
                    username=student_username,
                    defaults={
                        'email': f"{student_username}@demo.edu.in",
                        'first_name': f"Student{i+1}",
                        'last_name': class_obj.name.replace(' ', ''),
                        'role': User.Role.STUDENT
                    }
                )
                if created:
                    student_user.set_password('demo123')
                    student_user.save()

                student, created = Student.objects.get_or_create(
                    user=student_user,
                    defaults={
                        'school_class': class_obj,
                        'admission_date': date(2023, 6, 1),
                        'roll_number': f"{class_obj.name[-1] if class_obj.name[-1].isdigit() else 'N'}{i+1:02d}",
                        'father_name': f"Father{i+1} {class_obj.name.replace(' ', '')}",
                        'mother_name': f"Mother{i+1} {class_obj.name.replace(' ', '')}"
                    }
                )

                # Create Student Profile
                UserProfile.objects.get_or_create(
                    user=student_user,
                    defaults={
                        'phone': f"+91 9876543{i+30}",
                        'address': f"{i+200} Student Hostel, School Campus",
                        'date_of_birth': date(2010 + i, 6, 15),
                        'gender': 'male' if i % 2 == 0 else 'female',
                        'emergency_contact': f"Parent{i+1}",
                        'emergency_phone': f"+91 9876543{i+40}",
                        'blood_group': 'A+' if i % 3 == 0 else 'B+' if i % 3 == 1 else 'O+',
                        'nationality': 'Indian',
                        'religion': 'Hindu',
                        'aadhar_number': f"123456789{i+100:03d}",
                        'pan_number': f"ABCDE{i+1:03d}F"
                    }
                )

        self.stdout.write(self.style.SUCCESS('Demo data created successfully!'))
        self.stdout.write(f'Created:')
        self.stdout.write(f'- 1 Principal')
        self.stdout.write(f'- 10 Classes')
        self.stdout.write(f'- 10 Teachers')
        self.stdout.write(f'- 8 Subjects')
        self.stdout.write(f'- 25 Students')
        self.stdout.write(f'- Complete timetable for all classes')
        self.stdout.write(f'- Sample profiles for all users')
        self.stdout.write('')
        self.stdout.write('Demo login credentials:')
        self.stdout.write('Principal: principal@demo.com / demo123')
        self.stdout.write('Teacher: teacher_class_1@demo.edu.in / demo123')
        self.stdout.write('Student: student_class_1_1@demo.edu.in / demo123')