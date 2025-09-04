# School Management Backend API Documentation

This document describes the REST API endpoints for the backend of the School Management System. The backend is built with Django and Django REST Framework.

## Base URL

`http://<server-address>/api/`

## Authentication
- Most endpoints require authentication (Token or Session based).

## Endpoints

### Students
- `GET /api/students/` — List all students
- `POST /api/students/` — Create a new student
- `GET /api/students/{id}/` — Retrieve a student
- `PUT /api/students/{id}/` — Update a student
- `DELETE /api/students/{id}/` — Delete a student

### Teachers
- `GET /api/teachers/` — List all teachers
- `POST /api/teachers/` — Create a new teacher
- `GET /api/teachers/{id}/` — Retrieve a teacher
- `PUT /api/teachers/{id}/` — Update a teacher
- `DELETE /api/teachers/{id}/` — Delete a teacher

### Fees
- `GET /api/fees/` — List all fees
- `POST /api/fees/` — Create a new fee record
- `GET /api/fees/{id}/` — Retrieve a fee record
- `PUT /api/fees/{id}/` — Update a fee record
- `DELETE /api/fees/{id}/` — Delete a fee record

### Timetable
- `GET /api/timetable/` — List timetable entries
- `POST /api/timetable/` — Create a timetable entry
- `GET /api/timetable/{id}/` — Retrieve a timetable entry
- `PUT /api/timetable/{id}/` — Update a timetable entry
- `DELETE /api/timetable/{id}/` — Delete a timetable entry

### Leave Management
- `GET /api/leaves/` — List leave requests
- `POST /api/leaves/` — Create a leave request
- `GET /api/leaves/{id}/` — Retrieve a leave request
- `PUT /api/leaves/{id}/` — Update a leave request
- `DELETE /api/leaves/{id}/` — Delete a leave request

### User Management
- `GET /api/users/` — List users
- `POST /api/users/` — Create a user
- `GET /api/users/{id}/` — Retrieve a user
- `PUT /api/users/{id}/` — Update a user
- `DELETE /api/users/{id}/` — Delete a user

## Error Codes
- `400 Bad Request` — Invalid input
- `401 Unauthorized` — Authentication required
- `403 Forbidden` — Permission denied
- `404 Not Found` — Resource not found
- `500 Internal Server Error` — Server error

## Example Request
```
GET /api/students/
Authorization: Token <your-token>
```

## Contact
For further details, contact the backend team or refer to the code in `school_management/api/`.
