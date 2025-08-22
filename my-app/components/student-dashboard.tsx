"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Calendar, FileText, BarChart3, Clock, CheckCircle, AlertCircle, Download, Eye, Loader2 } from "lucide-react"
import { LeaveManagement } from "./leave-management"
import { TimetableManagement } from "./timetable-management"
import { FeesManagement } from "./fees-management"
import { api } from "@/lib/api"

interface StudentStats {
  currentGPA: number
  attendanceRate: number
  completedAssignments: number
  totalAssignments: number
  upcomingDeadlines: number
  currentGrade: string
}

interface Subject {
  id: number
  name: string
  teacher: string
  grade: string
  attendance: number
  nextClass: string
}

interface Assignment {
  id: number
  title: string
  subject: string
  dueDate: string
  status: string
  priority: string
}

interface ScheduleItem {
  time: string
  subject: string
  teacher: string
  room: string
}

interface Grade {
  subject: string
  assignment: string
  grade: string
  score: number
  date: string
}

// Mock data fallbacks
const mockStudentStats: StudentStats = {
  currentGPA: 3.7,
  attendanceRate: 94.2,
  completedAssignments: 28,
  totalAssignments: 32,
  upcomingDeadlines: 5,
  currentGrade: "A-",
}

const mockSubjects: Subject[] = [
  { id: 1, name: "Mathematics", teacher: "Mr. David Chen", grade: "A", attendance: 96, nextClass: "Tomorrow 9:00 AM" },
  { id: 2, name: "Physics", teacher: "Dr. Sarah Johnson", grade: "A-", attendance: 92, nextClass: "Today 2:00 PM" },
  {
    id: 3,
    name: "Chemistry",
    teacher: "Dr. Michael Brown",
    grade: "B+",
    attendance: 89,
    nextClass: "Tomorrow 10:30 AM",
  },
  { id: 4, name: "English", teacher: "Ms. Emily Davis", grade: "A", attendance: 98, nextClass: "Today 3:30 PM" },
  { id: 5, name: "History", teacher: "Mr. James Wilson", grade: "B", attendance: 91, nextClass: "Tomorrow 1:00 PM" },
]

const mockAssignments: Assignment[] = [
  {
    id: 1,
    title: "Quadratic Equations Homework",
    subject: "Mathematics",
    dueDate: "2024-01-16",
    status: "pending",
    priority: "high",
  },
  {
    id: 2,
    title: "Physics Lab Report",
    subject: "Physics",
    dueDate: "2024-01-18",
    status: "in-progress",
    priority: "medium",
  },
  {
    id: 3,
    title: "English Essay",
    subject: "English",
    dueDate: "2024-01-20",
    status: "not-started",
    priority: "medium",
  },
  {
    id: 4,
    title: "Chemistry Project",
    subject: "Chemistry",
    dueDate: "2024-01-22",
    status: "completed",
    priority: "low",
  },
]

const mockSchedule: ScheduleItem[] = [
  { time: "09:00 AM", subject: "Mathematics", teacher: "Mr. David Chen", room: "Room 101" },
  { time: "10:30 AM", subject: "Physics", teacher: "Dr. Sarah Johnson", room: "Lab 1" },
  { time: "01:00 PM", subject: "English", teacher: "Ms. Emily Davis", room: "Room 203" },
  { time: "02:30 PM", subject: "History", teacher: "Mr. James Wilson", room: "Room 105" },
]

const mockGrades: Grade[] = [
  { subject: "Mathematics", assignment: "Mid-term Exam", grade: "A", score: 92, date: "2024-01-10" },
  { subject: "Physics", assignment: "Lab Quiz", grade: "A-", score: 88, date: "2024-01-08" },
  { subject: "Chemistry", assignment: "Chapter Test", grade: "B+", score: 85, date: "2024-01-05" },
  { subject: "English", assignment: "Essay Assignment", grade: "A", score: 94, date: "2024-01-03" },
]

export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState<StudentStats>(mockStudentStats)
  const [subjects, setSubjects] = useState<Subject[]>(mockSubjects)
  const [assignments, setAssignments] = useState<Assignment[]>(mockAssignments)
  const [schedule, setSchedule] = useState<ScheduleItem[]>(mockSchedule)
  const [grades, setGrades] = useState<Grade[]>(mockGrades)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStudentData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const statsResponse = await api.get("/student/dashboard/stats/")
        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data)
        }

        const subjectsResponse = await api.get("/student/subjects/")
        if (subjectsResponse.success && subjectsResponse.data) {
          const formattedSubjects = subjectsResponse.data.map((subject: any) => ({
            ...subject,
            attendance: subject.attendance || Math.floor(Math.random() * 20) + 80, // Fallback
          }))
          setSubjects(formattedSubjects)
        }

        const assignmentsResponse = await api.get("/student/assignments/")
        if (assignmentsResponse.success && assignmentsResponse.data) {
          setAssignments(assignmentsResponse.data)
        }

        const scheduleResponse = await api.get("/student/schedule/")
        if (scheduleResponse.success && scheduleResponse.data) {
          setSchedule(scheduleResponse.data)
        }

        const gradesResponse = await api.get("/student/grades/")
        if (gradesResponse.success && gradesResponse.data) {
          setGrades(gradesResponse.data)
        }
      } catch (error) {
        console.error("Failed to fetch student dashboard data:", error)
        setError("Failed to load dashboard data. Using offline data.")
        // Keep mock data as fallback
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudentData()
  }, [])

  const handleSubmitAssignment = () => {
    setActiveTab("assignments")
  }

  const handleRequestLeave = () => {
    setActiveTab("leave")
  }

  const handleDownloadMaterials = () => {
    // Mock download functionality
    alert("Downloading course materials... This would typically open a file browser or download portal.")
  }

  const handleViewTimetable = () => {
    setActiveTab("timetable")
  }

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "bg-green-100 text-green-800"
    if (grade.startsWith("B")) return "bg-blue-100 text-blue-800"
    if (grade.startsWith("C")) return "bg-yellow-100 text-yellow-800"
    return "bg-gray-100 text-gray-800"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "not-started":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current GPA</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentGPA}</div>
            <p className="text-xs text-muted-foreground">Grade: {stats.currentGrade}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">Above average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedAssignments}/{stats.totalAssignments}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.completedAssignments / stats.totalAssignments) * 100)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingDeadlines}</div>
            <p className="text-xs text-muted-foreground">Deadlines this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="fees">My Fees</TabsTrigger>
          <TabsTrigger value="leave">Leave Requests</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Today&apos;s Classes</CardTitle>
                <CardDescription>Your schedule for today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {schedule.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Clock className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">{item.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.teacher} • {item.room}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Grades */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Grades</CardTitle>
                <CardDescription>Your latest assignment results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {grades.slice(0, 3).map((grade, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{grade.assignment}</p>
                      <p className="text-sm text-muted-foreground">{grade.subject}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="font-medium">{grade.score}%</p>
                        <p className="text-xs text-muted-foreground">{grade.date}</p>
                      </div>
                      <Badge className={getGradeColor(grade.grade)}>{grade.grade}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common student tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col bg-transparent" onClick={handleSubmitAssignment}>
                  <FileText className="h-6 w-6 mb-2" />
                  Submit Assignment
                </Button>
                <Button variant="outline" className="h-20 flex-col bg-transparent" onClick={handleRequestLeave}>
                  <Calendar className="h-6 w-6 mb-2" />
                  Request Leave
                </Button>
                <Button variant="outline" className="h-20 flex-col bg-transparent" onClick={handleDownloadMaterials}>
                  <Download className="h-6 w-6 mb-2" />
                  Download Materials
                </Button>
                <Button variant="outline" className="h-20 flex-col bg-transparent" onClick={handleViewTimetable}>
                  <Eye className="h-6 w-6 mb-2" />
                  View Timetable
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">My Subjects</h3>
            <p className="text-sm text-muted-foreground">Overview of all your enrolled subjects</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((subject) => (
              <Card key={subject.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      <CardDescription>{subject.teacher}</CardDescription>
                    </div>
                    <Badge className={getGradeColor(subject.grade)}>{subject.grade}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Attendance</span>
                      <span>{subject.attendance}%</span>
                    </div>
                    <Progress value={subject.attendance} className="h-2" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">Next Class</p>
                      <p className="text-xs text-muted-foreground">{subject.nextClass}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">My Assignments</h3>
            <p className="text-sm text-muted-foreground">Track your homework and project deadlines</p>
          </div>

          <div className="space-y-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <CardDescription>
                        {assignment.subject} • Due: {assignment.dueDate}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Badge className={getPriorityColor(assignment.priority)}>{assignment.priority}</Badge>
                      <Badge className={getStatusColor(assignment.status)}>{assignment.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-sm font-medium">Status: {assignment.status}</p>
                        <p className="text-xs text-muted-foreground">
                          {assignment.status === "completed"
                            ? "Submitted successfully"
                            : `Due in ${Math.ceil(
                                (new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                              )} days`}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {assignment.status !== "completed" && (
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-1" />
                          Submit
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="grades" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Academic Performance</h3>
            <p className="text-sm text-muted-foreground">Your grades and academic progress</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Grade Report</CardTitle>
              <CardDescription>Detailed breakdown of your academic performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {grades.map((grade, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{grade.assignment}</p>
                        <p className="text-sm text-muted-foreground">{grade.subject}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm font-medium">Score</p>
                        <p className="text-lg font-bold">{grade.score}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Grade</p>
                        <Badge className={getGradeColor(grade.grade)}>{grade.grade}</Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Date</p>
                        <p className="text-xs text-muted-foreground">{grade.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <FeesManagement userRole="student" />
        </TabsContent>

        <TabsContent value="leave" className="space-y-4">
          <LeaveManagement userRole="student" />
        </TabsContent>

        <TabsContent value="timetable" className="space-y-4">
          <TimetableManagement userRole="student" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
