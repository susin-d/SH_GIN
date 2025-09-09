from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

# === User and Profile Models ===

class User(AbstractUser):
    class Role(models.TextChoices):
        PRINCIPAL = "principal", "Principal"
        TEACHER = "teacher", "Teacher"
        STUDENT = "student", "Student"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.STUDENT)

class Period(models.Model):
    period_number = models.PositiveIntegerField(unique=True, help_text="e.g., 1 for 1st period")
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        ordering = ['period_number']

    def __str__(self):
        return f"Period {self.period_number} ({self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')})"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    class_name = models.CharField(max_length=100, blank=True, null=True)
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

class Assignment(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateField()
    school_class = models.ForeignKey(SchoolClass, on_delete=models.CASCADE, related_name='assignments')

    def __str__(self):
        return f"{self.title} for {self.school_class.name}"

class Grade(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='grades')
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    score = models.PositiveIntegerField() # Score out of 100
    graded_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"Grade for {self.student} on {self.assignment.title}: {self.score}%"

# === Finance Models ===

class FeeType(models.Model):
    class Category(models.TextChoices):
        ADMISSION = "Admission", "Admission"
        ANNUAL = "Annual", "Annual"
        TUITION = "Tuition", "Tuition"
        TRANSPORT = "Transport", "Transport"
        OTHER = "Other", "Other"

    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=255, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=20, choices=Category.choices)

    def __str__(self):
        return f"{self.name} ({self.category}) - ₹{self.amount}"

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

# === Leave & Notification Models ===

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

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"

# === Task Management Models ===

class Task(models.Model):
    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        URGENT = 'urgent', 'Urgent'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    class TaskType(models.TextChoices):
        LESSON_PLANNING = 'lesson_planning', 'Lesson Planning'
        GRADE_ASSIGNMENTS = 'grade_assignments', 'Grade Assignments'
        ATTENDANCE_MARKING = 'attendance_marking', 'Attendance Marking'
        PARENT_MEETINGS = 'parent_meetings', 'Parent Meetings'
        CLASS_PREPARATION = 'class_preparation', 'Class Preparation'
        ADMINISTRATIVE = 'administrative', 'Administrative'
        OTHER = 'other', 'Other'

    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    task_type = models.CharField(max_length=20, choices=TaskType.choices, default=TaskType.OTHER)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    due_date = models.DateField()
    due_time = models.TimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['due_date', 'due_time', 'priority']

    def __str__(self):
        return f"{self.teacher.user.get_full_name()}: {self.title}"

    def mark_completed(self):
        """Mark the task as completed and set completion timestamp."""
        self.status = self.Status.COMPLETED
        self.completed_at = timezone.now()
        self.save()

    def mark_in_progress(self):
        """Mark the task as in progress."""
        self.status = self.Status.IN_PROGRESS
        self.save()