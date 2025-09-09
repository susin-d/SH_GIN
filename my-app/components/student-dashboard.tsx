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
import { Calendar, FileText, BarChart3, Clock, CheckCircle, AlertCircle, Download, Eye, Loader2, Heart, Settings, GraduationCap } from "lucide-react"
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
          const data = response.data as any
          setStats(data.stats)
          setSubjects(data.subjects || [])
          setAssignments(data.assignments || [])
          setSchedule(data.schedule || [])
          setGrades(data.grades || [])
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
        <div className="text-muted-foreground">Loading Your Dashboard...</div>
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
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Sidebar for Student Tools */}
      <aside className="w-full lg:w-64 lg:flex-shrink-0 animate-slide-up">
        <Card className="h-full backdrop-blur-sm bg-white/90 dark:bg-slate-800/90 border-white/20 dark:border-slate-700/20 shadow-xl">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-3 text-foreground">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              Student Tools
            </CardTitle>
            <CardDescription className="text-sm font-medium">
              Academic Management
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Button variant="outline" className="w-full h-12 flex items-center gap-3 justify-start hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300 border-2 hover:border-blue-300 dark:hover:border-blue-600 font-medium" onClick={() => setActiveTab("overview")}>
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Assignments</span>
              </Button>
              <Button variant="outline" className="w-full h-12 flex items-center gap-3 justify-start hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 transition-all duration-300 border-2 hover:border-green-300 dark:hover:border-green-600 font-medium" onClick={() => setActiveTab("timetable")}>
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Timetable</span>
              </Button>
              <Button variant="outline" className="w-full h-12 flex items-center gap-3 justify-start hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-300 border-2 hover:border-purple-300 dark:hover:border-purple-600 font-medium" onClick={() => setActiveTab("grades")}>
                <BarChart3 className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Grades</span>
              </Button>
              <Button variant="outline" className="w-full h-12 flex items-center gap-3 justify-start hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 dark:hover:from-orange-900/20 dark:hover:to-yellow-900/20 transition-all duration-300 border-2 hover:border-orange-300 dark:hover:border-orange-600 font-medium" onClick={() => setActiveTab("fees")}>
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Fees</span>
              </Button>
              <Button variant="outline" className="w-full h-12 flex items-center gap-3 justify-start hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 transition-all duration-300 border-2 hover:border-red-300 dark:hover:border-red-600 font-medium" onClick={() => setActiveTab("leave")}>
                <Clock className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Leave</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 space-y-6">
        {/* Top Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={handleHealthCheck}>
            <Heart className="h-4 w-4 mr-2" />
            Health Check
          </Button>
        </div>

        {/* Stats Overview - Enhanced Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
        <Card className="stats-card group hover:scale-105 transition-all duration-300 border-0 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-white/90">Current GPA</CardTitle>
            <BarChart3 className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-white mb-1">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-lg">Loading</span>
                </div>
              ) : (
                stats?.currentGPA ?? "N/A"
              )}
            </div>
            <p className="text-xs text-white/70 font-medium">Grade: {stats?.currentGrade ?? "N/A"}</p>
          </CardContent>
        </Card>
        <Card className="stats-card-green group hover:scale-105 transition-all duration-300 border-0 shadow-xl" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-white/90">Attendance</CardTitle>
            <CheckCircle className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-white mb-1">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-lg">Loading</span>
                </div>
              ) : (
                `${stats?.attendanceRate ?? "N/A"}%`
              )}
            </div>
            <p className="text-xs text-white/70 font-medium">Overall rate</p>
          </CardContent>
        </Card>
        <Card className="stats-card-orange group hover:scale-105 transition-all duration-300 border-0 shadow-xl" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-white/90">Assignments</CardTitle>
            <FileText className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-white mb-1">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-lg">Loading</span>
                </div>
              ) : (
                `${stats?.completedAssignments ?? "N/A"}/${stats?.totalAssignments ?? "N/A"}`
              )}
            </div>
            <p className="text-xs text-white/70 font-medium">Completion rate</p>
          </CardContent>
        </Card>
        <Card className="stats-card-purple group hover:scale-105 transition-all duration-300 border-0 shadow-xl" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-white/90">Upcoming</CardTitle>
            <AlertCircle className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-white mb-1">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-lg">Loading</span>
                </div>
              ) : (
                stats?.upcomingDeadlines ?? "N/A"
              )}
            </div>
            <p className="text-xs text-white/70 font-medium">Deadlines this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Enhanced Layout */}
      <Card className="backdrop-blur-sm bg-white/90 dark:bg-slate-800/90 border-white/20 dark:border-slate-700/20 shadow-xl animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-t-lg">
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Settings className="h-5 w-5 text-white" />
            </div>
            Quick Actions
          </CardTitle>
          <CardDescription className="text-base font-medium">
            Access common student tasks with one click
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
          <Button variant="outline" className="h-24 flex-col gap-3 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-300 border-2 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transform hover:scale-105" onClick={() => setActiveTab("timetable")}>
            <Calendar className="h-6 w-6 text-blue-600" />
            <span className="text-sm font-semibold">Today's Schedule</span>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-3 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 transition-all duration-300 border-2 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg transform hover:scale-105" onClick={() => setActiveTab("grades")}>
            <BarChart3 className="h-6 w-6 text-green-600" />
            <span className="text-sm font-semibold">Recent Grades</span>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-3 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-300 border-2 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg transform hover:scale-105" onClick={() => setActiveTab("overview")}>
            <FileText className="h-6 w-6 text-purple-600" />
            <span className="text-sm font-semibold">Assignments</span>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-3 hover:bg-gradient-to-br hover:from-orange-50 hover:to-yellow-50 dark:hover:from-orange-900/20 dark:hover:to-yellow-900/20 transition-all duration-300 border-2 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-lg transform hover:scale-105" onClick={() => setActiveTab("fees")}>
            <AlertCircle className="h-6 w-6 text-orange-600" />
            <span className="text-sm font-semibold">Fee Status</span>
          </Button>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 h-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg">
          <TabsTrigger value="overview" className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300">
            Overview
          </TabsTrigger>
          <TabsTrigger value="timetable" className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all duration-300">
            Timetable
          </TabsTrigger>
          <TabsTrigger value="grades" className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300">
            Grades
          </TabsTrigger>
          <TabsTrigger value="fees" className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white transition-all duration-300">
            My Fees
          </TabsTrigger>
          <TabsTrigger value="leave" className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300">
            Leave
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
           <div className="flex justify-end mb-4">
             <Button variant="outline" size="sm" onClick={handleHealthCheck}>
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
      </main>
    </div>
  )
}