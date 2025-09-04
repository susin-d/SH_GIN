# School Management Information System (SM_GIN_Ver.1.0)

A comprehensive school management system built with Next.js (React) frontend and Django REST Framework backend, designed to streamline educational administration and enhance the learning experience.

## 🌟 Features

### 🎓 **Multi-Role Dashboard System**
- **Principal Dashboard**: Complete administrative oversight with user management, fee tracking, and system analytics
- **Teacher Dashboard**: Daily task management, student progress tracking, and class management
- **Student Dashboard**: Personal academic tracking, fee management, and assignment submissions

### 📊 **Core Functionality**
- **User Management**: Role-based access control (Principal, Teacher, Student)
- **Academic Management**: Classes, subjects, timetables, and assignments
- **Financial Management**: Fee structure, payments, and billing
- **Attendance Tracking**: Daily attendance monitoring and reporting
- **Grade Management**: Assignment grading and academic performance tracking
- **Task Management**: Daily task tracking for teachers with priority levels
- **Leave Management**: Request and approval system for leave applications

### 🔧 **Technical Features**
- **Real-time Updates**: Live data synchronization across all dashboards
- **Responsive Design**: Mobile-friendly interface with modern UI components
- **API-First Architecture**: RESTful APIs with comprehensive documentation
- **Authentication & Security**: JWT-based authentication with role-based permissions
- **Database Management**: SQLite with Django ORM for data persistence

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - Modern UI component library
- **Lucide React** - Beautiful icon library
- **React Hook Form** - Form management
- **Axios** - HTTP client for API calls

### Backend
- **Django 4.2** - Python web framework
- **Django REST Framework** - API development toolkit
- **Django Simple JWT** - JSON Web Token authentication
- **SQLite** - Database (development)
- **PostgreSQL** - Database (production-ready)

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/susin-d/SH_GIN.git
   cd SM_GIN_Ver.1.0
   ```

2. **Backend Setup**
   ```bash
   cd school_management

   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate

   # Install dependencies
   pip install -r requirements.txt

   # Run migrations
   python manage.py migrate

   # Seed database with sample data
   python manage.py seed_data

   # Start Django server
   python manage.py runserver
   ```

3. **Frontend Setup**
   ```bash
   cd my-app

   # Install dependencies
   npm install

   # Start Next.js development server
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/api/

## 📋 Usage

### Default Login Credentials
- **Principal**: `principal` / `demo`
- **Teacher**: `teacher1` / `demo`
- **Student**: `student1` / `demo`

### Key Workflows

#### For Principals
1. **User Management**: Create and manage teachers and students
2. **System Overview**: Monitor school statistics and performance
3. **Fee Management**: Configure fee structures and monitor payments
4. **Leave Approvals**: Review and approve leave requests

#### For Teachers
1. **Daily Tasks**: View and manage daily teaching tasks
2. **Class Management**: Access student lists and class details
3. **Grade Management**: Submit and track student grades
4. **Attendance**: Mark daily attendance for students

#### For Students
1. **Academic Tracking**: View grades and academic progress
2. **Fee Management**: Monitor fee payments and due dates
3. **Timetable Access**: View class schedules
4. **Leave Requests**: Submit leave applications

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/user/` - Get current user info

### Core Resources
- `/api/users/` - User management
- `/api/students/` - Student operations
- `/api/teachers/` - Teacher operations
- `/api/classes/` - Class management
- `/api/tasks/` - Task management (teachers)
- `/api/fees/` - Fee management
- `/api/attendance/` - Attendance tracking
- `/api/timetable/` - Schedule management

### Task Management (New Feature)
- `GET /api/tasks/` - List user's tasks
- `GET /api/tasks/today_tasks/` - Get today's tasks
- `GET /api/tasks/upcoming_tasks/` - Get upcoming tasks
- `POST /api/tasks/{id}/mark_completed/` - Mark task as completed
- `POST /api/tasks/{id}/mark_in_progress/` - Mark task as in progress

## 🗄️ Database Schema

### Key Models
- **User**: Base user model with role-based permissions
- **Student/Teacher**: Profile models extending User
- **SchoolClass**: Class management with teacher assignments
- **Task**: Daily task management for teachers
- **Fee**: Financial transaction tracking
- **Attendance**: Daily attendance records
- **Grade**: Academic performance tracking

## 🔧 Development

### Project Structure
```
SM_GIN_Ver.1.0/
├── my-app/                 # Next.js Frontend
│   ├── app/               # Next.js App Router
│   ├── components/        # React Components
│   ├── lib/              # Utilities & API client
│   └── public/           # Static assets
├── school_management/     # Django Backend
│   ├── api/              # Django REST API
│   │   ├── models.py     # Database models
│   │   ├── views.py      # API views
│   │   ├── serializers.py # Data serializers
│   │   └── urls.py       # URL routing
│   └── school_management/ # Django settings
└── README.md             # This file
```

### Environment Variables

Create `.env` files in both directories:

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

**Backend (.env)**
```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use TypeScript for all frontend code
- Write comprehensive tests
- Update documentation for new features
- Ensure responsive design

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by real-world school management needs
- Designed for scalability and maintainability

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the codebase comments

---

**Version**: 1.0.0
**Last Updated**: September 2025
**Maintainer**: Development Team
