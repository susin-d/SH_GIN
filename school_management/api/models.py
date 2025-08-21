from django.db import models
from django.contrib.auth.models import AbstractUser

# === User and Profile Models ===

class User(AbstractUser):
    class Role(models.TextChoices):
        PRINCIPAL = "principal", "Principal"
        TEACHER = "teacher", "Teacher"
        STUDENT = "student", "Student"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.STUDENT)

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    # Student-specific
    class_name = models.CharField(max_length=100, blank=True, null=True)
    # Teacher-specific
    subject = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.user.username

# === Academic Models ===

class SchoolClass(models.Model):
    name = models.CharField(max_length=100, unique=True)
    teacher = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='taught_classes', limit_choices_to={'role': User.Role.TEACHER})
    
    def __str__(self):
        return self.name

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, limit_choices_to={'role': User.Role.STUDENT})
    school_class = models.ForeignKey(SchoolClass, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')

    def __str__(self):
        return self.user.get_full_name() or self.user.username

class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True, limit_choices_to={'role': User.Role.TEACHER})
    
    def __str__(self):
        return self.user.get_full_name() or self.user.username

class Attendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = 'present', 'Present'
        ABSENT = 'absent', 'Absent'
        LATE = 'late', 'Late'

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=10, choices=Status.choices)
    
    class Meta:
        unique_together = ('student', 'date')

class Timetable(models.Model):
    class Day(models.TextChoices):
        MONDAY = 'MON', 'Monday'
        TUESDAY = 'TUE', 'Tuesday'
        WEDNESDAY = 'WED', 'Wednesday'
        THURSDAY = 'THU', 'Thursday'
        FRIDAY = 'FRI', 'Friday'

    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='timetable_entries')
    day_of_week = models.CharField(max_length=3, choices=Day.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    subject = models.CharField(max_length=100)
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True)

# === Finance Models ===

class Fee(models.Model):
    class Status(models.TextChoices):
        PAID = 'paid', 'Paid'
        UNPAID = 'unpaid', 'Unpaid'
        PARTIAL = 'partial', 'Partial'

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='fees')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.UNPAID)
    
    def __str__(self):
        return f"Fee for {self.student} due {self.due_date} - {self.status}"

# === Leave Management Models ===

class LeaveRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leave_requests')
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)