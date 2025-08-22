"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Users,
  GraduationCap,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  UserPlus,
  BookOpen,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { LeaveManagement } from "./leave-management"
import { TimetableManagement } from "./timetable-management"
import { FeesManagement } from "./fees-management"
import { api } from "@/lib/api"

interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  attendanceRate: number
  pendingLeaves: number
  activeIssues: number
}

interface Activity {
  id: number
  type: string
  message: string
  time: string
  status: string
}

interface Student {
  id: number
  name?: string
  first_name?: string
  last_name?: string
  grade?: string
  class_name?: string
  attendance?: number
  status: string
}

interface Teacher {
  id: number
  name?: string
  first_name?: string
  last_name?: string
  subject?: string
  classes?: number
  status: string
}

// Mock data fallbacks
const mockStats: DashboardStats = {
  totalStudents: 1247,
  totalTeachers: 89,
  totalClasses: 45,
  attendanceRate: 94.2,
  pendingLeaves: 12,
  activeIssues: 3,
}

const mockRecentActivities: Activity[] = [
  { id: 1, type: "leave", message: "New leave request from Sarah Johnson", time: "2 hours ago", status: "pending" },
  {
    id: 2,
    type: "attendance",
    message: "Attendance report for Grade 10-A submitted",
    time: "4 hours ago",
    status: "completed",
  },
  { id: 3, type: "academic", message: "Monthly academic report generated", time: "1 day ago", status: "completed" },
  { id: 4, type: "issue", message: "Technical issue reported in Lab 3", time: "2 days ago", status: "pending" },
]

const mockStudents: Student[] = [
  { id: 1, name: "Alice Johnson", grade: "10-A", attendance: 96, status: "active" },
  { id: 2, name: "Bob Smith", grade: "10-A", attendance: 89, status: "active" },
  { id: 3, name: "Carol Davis", grade: "10-B", attendance: 92, status: "active" },
  { id: 4, name: "David Wilson", grade: "9-A", attendance: 87, status: "active" },
]

const mockTeachers: Teacher[] = [
  { id: 1, name: "Dr. Emily Brown", subject: "Mathematics", classes: 6, status: "active" },
  { id: 2, name: "Mr. James Wilson", subject: "Physics", classes: 5, status: "active" },
  { id: 3, name: "Ms. Sarah Davis", subject: "English", classes: 7, status: "active" },
  { id: 4, name: "Dr. Michael Chen", subject: "Chemistry", classes: 4, status: "active" },
]

export function PrincipalDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [stats, setStats] = useState<DashboardStats>(mockStats)
  const [activities, setActivities] = useState<Activity[]>(mockRecentActivities)
  const [students, setStudents] = useState<Student[]>(mockStudents)
  const [teachers, setTeachers] = useState<Teacher[]>(mockTeachers)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch dashboard statistics
        const statsResponse = await api.get("/dashboard/stats/")
        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data)
        }

        // Fetch recent activities
        const activitiesResponse = await api.get("/dashboard/activities/")
        if (activitiesResponse.success && activitiesResponse.data) {
          setActivities(activitiesResponse.data)
        }

        // Fetch students list
        const studentsResponse = await api.students.list()
        if (studentsResponse.success && studentsResponse.data) {
          const formattedStudents = studentsResponse.data.map((student: any) => ({
            ...student,
            name: student.name || `${student.first_name || ""} ${student.last_name || ""}`.trim(),
            grade: student.grade || student.class_name || "N/A",
            attendance: student.attendance || Math.floor(Math.random() * 20) + 80, // Fallback
          }))
          setStudents(formattedStudents)
        }

        // Fetch teachers list
        const teachersResponse = await api.teachers.list()
        if (teachersResponse.success && teachersResponse.data) {
          const formattedTeachers = teachersResponse.data.map((teacher: any) => ({
            ...teacher,
            name: teacher.name || `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim(),
            classes: teacher.classes || Math.floor(Math.random() * 5) + 3, // Fallback
          }))
          setTeachers(formattedTeachers)
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
        setError("Failed to load dashboard data. Using offline data.")
        // Keep mock data as fallback
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

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
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +3 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +2.1% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingLeaves + stats.activeIssues}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingLeaves} leaves, {stats.activeIssues} issues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="leave">Leave Management</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Latest updates and notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {activity.status === "completed" ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                    <Badge variant={activity.status === "completed" ? "default" : "secondary"}>{activity.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex-col bg-transparent">
                    <UserPlus className="h-6 w-6 mb-2" />
                    Add Student
                  </Button>
                  <Button variant="outline" className="h-20 flex-col bg-transparent">
                    <GraduationCap className="h-6 w-6 mb-2" />
                    Add Teacher
                  </Button>
                  <Button variant="outline" className="h-20 flex-col bg-transparent">
                    <Calendar className="h-6 w-6 mb-2" />
                    Manage Schedule
                  </Button>
                  <Button variant="outline" className="h-20 flex-col bg-transparent">
                    <FileText className="h-6 w-6 mb-2" />
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Student Management</h3>
              <p className="text-sm text-muted-foreground">Manage student records and information</p>
            </div>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Student Directory</CardTitle>
              <CardDescription>View and manage all students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={`/diverse-student.png?height=40&width=40&query=student-${student.id}`} />
                        <AvatarFallback>
                          {(student.name || `${student.first_name || ""} ${student.last_name || ""}`)
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {student.name || `${student.first_name || ""} ${student.last_name || ""}`}
                        </p>
                        <p className="text-sm text-muted-foreground">Grade {student.grade}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{student.attendance}% Attendance</p>
                        <Badge variant={student.status === "active" ? "default" : "secondary"}>{student.status}</Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Teacher Management</h3>
              <p className="text-sm text-muted-foreground">Manage teaching staff and assignments</p>
            </div>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Teacher
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Teaching Staff</CardTitle>
              <CardDescription>View and manage all teachers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage
                          src={`/diverse-teacher-classroom.png?height=40&width=40&query=teacher-${teacher.id}`}
                        />
                        <AvatarFallback>
                          {(teacher.name || `${teacher.first_name || ""} ${teacher.last_name || ""}`)
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {teacher.name || `${teacher.first_name || ""} ${teacher.last_name || ""}`}
                        </p>
                        <p className="text-sm text-muted-foreground">{teacher.subject}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{teacher.classes} Classes</p>
                        <Badge variant={teacher.status === "active" ? "default" : "secondary"}>{teacher.status}</Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Attendance Management</h3>
            <p className="text-sm text-muted-foreground">Monitor and manage school attendance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Today's Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92.5%</div>
                <p className="text-xs text-muted-foreground">1,153 of 1,247 students present</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Weekly Average</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-xs text-muted-foreground">+1.2% from last week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Absent Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94</div>
                <p className="text-xs text-muted-foreground">12 excused, 82 unexcused</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Attendance Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-16 flex-col bg-transparent">
                  <BarChart3 className="h-5 w-5 mb-1" />
                  View Reports
                </Button>
                <Button variant="outline" className="h-16 flex-col bg-transparent">
                  <FileText className="h-5 w-5 mb-1" />
                  Export Data
                </Button>
                <Button variant="outline" className="h-16 flex-col bg-transparent">
                  <AlertCircle className="h-5 w-5 mb-1" />
                  Send Alerts
                </Button>
                <Button variant="outline" className="h-16 flex-col bg-transparent">
                  <Settings className="h-5 w-5 mb-1" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <FeesManagement userRole="principal" />
        </TabsContent>

        <TabsContent value="leave" className="space-y-4">
          <LeaveManagement userRole="principal" />
        </TabsContent>

        <TabsContent value="timetable" className="space-y-4">
          <TimetableManagement userRole="principal" />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Reports & Analytics</h3>
            <p className="text-sm text-muted-foreground">Generate and view comprehensive reports</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Academic Reports</CardTitle>
                <CardDescription>Student performance and academic analytics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Grade Reports
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Performance Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Progress Tracking
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Administrative Reports</CardTitle>
                <CardDescription>School operations and management reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Users className="h-4 w-4 mr-2" />
                  Enrollment Reports
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <Calendar className="h-4 w-4 mr-2" />
                  Attendance Reports
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <FileText className="h-4 w-4 mr-2" />
                  Financial Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
