import random
from django.core.management.base import BaseCommand
from faker import Faker
from django.db import transaction
from api.models import User, UserProfile, SchoolClass, Student, Teacher, Fee, Attendance

class Command(BaseCommand):
    help = 'Seeds the database with realistic demo data'

    @transaction.atomic
    def handle(self, *args, **kwargs):
        self.stdout.write("Deleting old data...")
        # Clear all existing data in the correct order to avoid constraint errors
        Attendance.objects.all().delete()
        Fee.objects.all().delete()
        Student.objects.all().delete()
        Teacher.objects.all().delete()
        SchoolClass.objects.all().delete()
        UserProfile.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

        self.stdout.write("Creating new data...")

        faker = Faker()

        # --- Create Principal (with Superuser permissions) ---
        principal_user, _ = User.objects.get_or_create(
            username='principal',
            defaults={
                'first_name': 'Sarah',
                'last_name': 'Johnson',
                'email': 'principal@school.edu',
                'role': User.Role.PRINCIPAL,
                'is_staff': True,
                'is_superuser': True  # <-- This grants full admin permissions
            }
        )
        principal_user.set_password('demo')
        principal_user.save()
        UserProfile.objects.get_or_create(user=principal_user, defaults={'phone': faker.phone_number(), 'address': faker.address()})
        self.stdout.write(f"Principal '{principal_user.username}' created with superuser rights.")

        # --- Create Teachers ---
        teachers = []
        for i in range(5):
            first_name = faker.first_name()
            last_name = faker.last_name()
            # Ensure unique usernames, even with random data
            username = f"{first_name.lower()}{last_name.lower()}{i}"
            teacher_user = User.objects.create_user(
                username=username,
                password='demo',
                first_name=first_name,
                last_name=last_name,
                email=f"{username}@school.edu",
                role=User.Role.TEACHER
            )
            UserProfile.objects.create(user=teacher_user, subject=random.choice(['Mathematics', 'Physics', 'History', 'Literature', 'Art']))
            Teacher.objects.create(user=teacher_user)
            teachers.append(teacher_user)
        self.stdout.write(f"{len(teachers)} Teachers created.")

        # --- Create Classes ---
        class_names = ["10-A", "10-B", "9-A", "9-B", "8-A"]
        classes = []
        for name in class_names:
            school_class = SchoolClass.objects.create(name=name, teacher=random.choice(teachers))
            classes.append(school_class)
        self.stdout.write(f"{len(classes)} Classes created.")

        # --- Create Students ---
        students = []
        for i in range(50):
            first_name = faker.first_name()
            last_name = faker.last_name()
            username = f"student{i+1}"
            student_user = User.objects.create_user(
                username=username,
                password='demo',
                first_name=first_name,
                last_name=last_name,
                email=f"{username}@school.edu",
                role=User.Role.STUDENT
            )
            assigned_class = random.choice(classes)
            student_profile = Student.objects.create(user=student_user, school_class=assigned_class)
            UserProfile.objects.create(user=student_user, class_name=assigned_class.name, address=faker.address())
            students.append(student_profile)
        self.stdout.write(f"{len(students)} Students created.")

        # --- Create Fees for Students ---
        for student in students:
            for _ in range(random.randint(1, 4)): # Each student gets 1-4 fee records
                Fee.objects.create(
                    student=student,
                    amount=random.choice([2500, 150, 300, 400]),
                    due_date=faker.date_between(start_date='-30d', end_date='+30d'),
                    status=random.choice([Fee.Status.PAID, Fee.Status.UNPAID, Fee.Status.PARTIAL])
                )
        self.stdout.write("Fees created for students.")

        # --- Create Attendance Records for Students ---
        for student in students:
            unique_dates = set()
            while len(unique_dates) < 10:
                random_date = faker.date_between(start_date='-30d', end_date='-1d')
                unique_dates.add(random_date)
            
            for unique_date in unique_dates:
                Attendance.objects.create(
                    student=student,
                    date=unique_date,
                    status=random.choice([
                        Attendance.Status.PRESENT, 
                        Attendance.Status.ABSENT, 
                        Attendance.Status.LATE
                    ])
                )
        self.stdout.write("Attendance records created for students.")

        self.stdout.write(self.style.SUCCESS('Successfully seeded the database!'))