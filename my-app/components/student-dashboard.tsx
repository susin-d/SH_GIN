"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
// --- FIX 1: Import both api and apiClient ---
import { api, apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Calendar, FileText, BarChart3, Clock, CheckCircle, AlertCircle, Download, Eye, Loader2, Heart } from "lucide-react"
import { LeaveManagement } from "./leave-management"
import { TimetableManagement } from "./timetable-management"
import { FeesManagement } from "./fees-management"

// --- TypeScript Interfaces for API Data ---
interface StudentStats {
  attendanceRate: number
  currentGPA: number
  completedAssignments: number
  totalAssignments: number
  upcomingDeadlines: number
  currentGrade: string
}

interface Subject {
  id: number
  name: string
  teacher: string
}

interface Assignment {
  id: number
  title: string
  description: string
  due_date: string
  school_class: number
}

interface TimetableEntry {
  id: number
  day_of_week: string
  start_time: string
  end_time: string
  subject: string
  teacher: {
    user: {
      first_name: string
      last_name: string
    }
  }
}

interface Grade {
  id: number
  assignment: {
    title: string
  }
  score: number
  graded_date: string
}

// Helper to format time strings (e.g., "09:00:00" -> "9:00 AM")
const formatTime = (timeStr: string) => {
  if (!timeStr) return ""
  const [hours, minutes] = timeStr.split(":")
  const date = new Date()
  date.setHours(parseInt(hours, 10))
  date.setMinutes(parseInt(minutes, 10))
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

export function StudentDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")

  const handleHealthCheck = async () => {
    try {
      const response = await api.health.check()
      if (response.success) {
        toast({
          title: "Health Check Successful",
          description: (response.data as any)?.message || "Server is running smoothly!",
        })
      } else {
        throw new Error(response.message)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Health Check Failed",
        description: error.message || "Unable to connect to server.",
      })
    }
  }

  // --- State for Live API Data ---
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [schedule, setSchedule] = useState<TimetableEntry[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchStudentData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // --- FIX 2: Use apiClient.get for the generic dashboard endpoint ---
        const response = await apiClient.get("/student/dashboard/")
        
        if (response.success && response.data) {
          setStats(response.data.stats)
          setSubjects(response.data.subjects)
          setAssignments(response.data.assignments)
          setSchedule(response.data.schedule)
          setGrades(response.data.grades)
        } else {
          throw new Error(response.message || "Failed to fetch dashboard data.")
        }
      } catch (err: any) {
        setError(err.message)
        console.error("Failed to fetch student dashboard data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudentData()
  }, [user])

  const getGradeColor = (grade: string | number) => {
    if (typeof grade === 'number') {
        if (grade >= 90) return "bg-green-100 text-green-800"
        if (grade >= 80) return "bg-blue-100 text-blue-800"
        if (grade >= 70) return "bg-yellow-100 text-yellow-800"
        return "bg-red-100 text-red-800"
    }
    if (grade.startsWith("A")) return "bg-green-100 text-green-800"
    if (grade.startsWith("B")) return "bg-blue-100 text-blue-800"
    return "bg-gray-100 text-gray-800"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading Your Dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const today = new Date().toLocaleString("en-US", { weekday: "short" }).toUpperCase()
  const todaySchedule = schedule.filter((item) => item.day_of_week === today)

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current GPA</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.currentGPA ?? "N/A"}</div>
            <p className="text-xs text-muted-foreground">Grade: {stats?.currentGrade ?? "N/A"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.attendanceRate ?? "N/A"}%</div>
            <p className="text-xs text-muted-foreground">Overall rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.completedAssignments ?? "N/A"}/{stats?.totalAssignments ?? "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">Completion rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.upcomingDeadlines ?? "N/A"}</div>
            <p className="text-xs text-muted-foreground">Deadlines this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="fees">My Fees</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
           <div className="flex justify-end mb-4">
             <Button variant="enhanced" size="sm" onClick={handleHealthCheck}>
               <Heart className="h-4 w-4 mr-2" />
               Health Check
             </Button>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Today&apos;s Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {todaySchedule.length > 0 ? (
                  todaySchedule.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{item.subject}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.teacher.user.first_name} {item.teacher.user.last_name}
                          </p>
                        </div>
                      </div>
                      <p className="font-medium">{formatTime(item.start_time)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center pt-4">No classes scheduled for today.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Grades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {grades.slice(0, 3).map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{grade.assignment.title}</p>
                      <p className="text-sm text-muted-foreground">{grade.graded_date}</p>
                    </div>
                    <Badge className={getGradeColor(grade.score)}>{grade.score}%</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="timetable" className="space-y-4">
          <TimetableManagement userRole="student" />
        </TabsContent>

        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grade Report</CardTitle>
              <CardDescription>Detailed breakdown of your academic performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {grades.map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{grade.assignment.title}</p>
                      <p className="text-sm text-muted-foreground">Graded on: {grade.graded_date}</p>
                    </div>
                    <Badge className={getGradeColor(grade.score)}>{grade.score}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <FeesManagement userRole="student" />
        </TabsContent>

        <TabsContent value="leave">
          <LeaveManagement userRole="student" />
        </TabsContent>
      </Tabs>
    </div>
  )
}