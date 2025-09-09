"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { api, apiClient } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  Users,
  FileText,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit,
  Send,
  Loader2,
  Heart,
  Settings,
  Download,
  Eye,
} from "lucide-react"
import { LeaveManagement } from "./leave-management"
import { TimetableManagement } from "./timetable-management"
import { FeesManagement } from "./fees-management"

// --- TypeScript Interfaces for API Data ---
interface SchoolClass {
  id: number
  name: string
  students: any[] // The backend `SchoolClass` model doesn't have a direct students field, so this might be empty
}

interface StudentFromAPI {
  user: {
    id: number
    first_name: string
    last_name: string
  }
  school_class: string
}

interface TeacherStats {
  total_classes: number
  total_students: number
}

export function TeacherDashboard() {
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("classes")

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

  const handleViewClassDetails = async (classId: number) => {
    try {
      const response = await api.classes.details(classId)
      if (response.success) {
        const data = response.data as any
        toast({
          title: "Class Details",
          description: `Class has ${data.total_students} students taught by ${data.teacher?.first_name || 'Unknown'}`,
        })
      } else {
        throw new Error(response.message)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load class details.",
      })
    }
  }

  const handleViewStudentDetails = async (studentId: number) => {
    try {
      const response = await api.students.details(studentId)
      if (response.success) {
        const data = response.data as any
        const student = data.student
        toast({
          title: "Student Details",
          description: `${student.user.first_name} ${student.user.last_name} - Attendance: ${data.attendance_rate}%`,
        })
      } else {
        throw new Error(response.message)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load student details.",
      })
    }
  }

  const handleMarkTaskCompleted = async (taskId: number) => {
    try {
      const response = await api.tasks.markCompleted(taskId)
      if (response.success) {
        toast({
          title: "Task Completed",
          description: "Task has been marked as completed!",
        })
        // Refresh tasks
        const tasksRes = await api.tasks.list()
        const todayTasksRes = await api.tasks.todayTasks()
        if (tasksRes.success) setTasks(tasksRes.data as any[])
        if (todayTasksRes.success) setTodayTasks(todayTasksRes.data as any[])
      } else {
        throw new Error(response.message)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update task.",
      })
    }
  }

  const handleMarkTaskInProgress = async (taskId: number) => {
    try {
      const response = await api.tasks.markInProgress(taskId)
      if (response.success) {
        toast({
          title: "Task Updated",
          description: "Task has been marked as in progress!",
        })
        // Refresh tasks
        const tasksRes = await api.tasks.list()
        const todayTasksRes = await api.tasks.todayTasks()
        if (tasksRes.success) setTasks(tasksRes.data as any[])
        if (todayTasksRes.success) setTodayTasks(todayTasksRes.data as any[])
      } else {
        throw new Error(response.message)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update task.",
      })
    }
  }

  // --- State for Live API Data ---
  const [stats, setStats] = useState<TeacherStats | null>(null)
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [students, setStudents] = useState<StudentFromAPI[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [todayTasks, setTodayTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false)
      return
    }

    const fetchTeacherData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Fetch all required data in parallel for performance
        const [classesRes, studentsRes, tasksRes, todayTasksRes] = await Promise.all([
          api.teachers.classes(currentUser.id),
          apiClient.get(`/teachers/${currentUser.id}/students/`),
          api.tasks.list(),
          api.tasks.todayTasks(),
        ])

        if (classesRes.success && Array.isArray(classesRes.data)) {
          setClasses(classesRes.data)
        } else {
          throw new Error(classesRes.message || "Failed to fetch your classes.")
        }

        if (studentsRes.success && Array.isArray(studentsRes.data)) {
          setStudents(studentsRes.data)
        } else {
          // It's possible a teacher has no students yet, so don't throw an error, just warn.
          console.warn(studentsRes.message || "Could not fetch students for this teacher.")
          setStudents([])
        }

        if (tasksRes.success && Array.isArray(tasksRes.data)) {
          setTasks(tasksRes.data as any[])
        }

        if (todayTasksRes.success && Array.isArray(todayTasksRes.data)) {
          setTodayTasks(todayTasksRes.data as any[])
        }

        // Calculate stats based on the fetched data
        const totalStudents = Array.isArray(studentsRes.data) ? studentsRes.data.length : 0
        setStats({
          total_classes: Array.isArray(classesRes.data) ? classesRes.data.length : 0,
          total_students: totalStudents,
        })
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred while loading your dashboard.")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeacherData()
  }, [currentUser])

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

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Sidebar for Teacher Tools */}
      <aside className="w-full lg:w-64 lg:flex-shrink-0 animate-slide-up">
        <Card className="h-full backdrop-blur-sm bg-white/90 dark:bg-slate-800/90 border-white/20 dark:border-slate-700/20 shadow-xl">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-3 text-foreground">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              Teacher Tools
            </CardTitle>
            <CardDescription className="text-sm font-medium">
              Teaching Management
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Button variant="outline" className="w-full h-12 flex items-center gap-3 justify-start hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300 border-2 hover:border-blue-300 dark:hover:border-blue-600 font-medium" onClick={() => setActiveTab("classes")}>
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">My Classes</span>
              </Button>
              <Button variant="outline" className="w-full h-12 flex items-center gap-3 justify-start hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 transition-all duration-300 border-2 hover:border-green-300 dark:hover:border-green-600 font-medium" onClick={() => setActiveTab("students")}>
                <Users className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Students</span>
              </Button>
              <Button variant="outline" className="w-full h-12 flex items-center gap-3 justify-start hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-300 border-2 hover:border-purple-300 dark:hover:border-purple-600 font-medium" onClick={() => setActiveTab("tasks")}>
                <CheckCircle className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Tasks</span>
              </Button>
              <Button variant="outline" className="w-full h-12 flex items-center gap-3 justify-start hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 dark:hover:from-orange-900/20 dark:hover:to-yellow-900/20 transition-all duration-300 border-2 hover:border-orange-300 dark:hover:border-orange-600 font-medium" onClick={() => setActiveTab("assignments")}>
                <FileText className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Assignments</span>
              </Button>
              <Button variant="outline" className="w-full h-12 flex items-center gap-3 justify-start hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 transition-all duration-300 border-2 hover:border-red-300 dark:hover:border-red-600 font-medium" onClick={() => setActiveTab("leave")}>
                <Clock className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Leave</span>
              </Button>
              <Button variant="outline" className="w-full h-12 flex items-center gap-3 justify-start hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 dark:hover:from-indigo-900/20 dark:hover:to-blue-900/20 transition-all duration-300 border-2 hover:border-indigo-300 dark:hover:border-indigo-600 font-medium" onClick={() => setActiveTab("timetable")}>
                <Clock className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium">Schedule</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 space-y-6">
        {/* Top Action Buttons - Consistent Right Alignment */}
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
            <CardTitle className="text-sm font-semibold text-white/90">My Classes</CardTitle>
            <BookOpen className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-white mb-1">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-lg">Loading</span>
                </div>
              ) : (
                stats?.total_classes ?? 0
              )}
            </div>
            <p className="text-xs text-white/70 font-medium">Assigned classes</p>
          </CardContent>
        </Card>
        <Card className="stats-card-green group hover:scale-105 transition-all duration-300 border-0 shadow-xl" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-white/90">Total Students</CardTitle>
            <Users className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-white mb-1">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-lg">Loading</span>
                </div>
              ) : (
                stats?.total_students ?? 0
              )}
            </div>
            <p className="text-xs text-white/70 font-medium">Across all classes</p>
          </CardContent>
        </Card>
        <Card className="stats-card-orange group hover:scale-105 transition-all duration-300 border-0 shadow-xl" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-white/90">Attendance Rate</CardTitle>
            <BarChart3 className="h-5 w-5 text-white/80" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-white mb-1">91.5%</div>
            <p className="text-xs text-white/70 font-medium">Overall performance</p>
          </CardContent>
        </Card>
        <Card className="stats-card-purple group hover:scale-105 transition-all duration-300 border-0 shadow-xl" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-white/90">Pending Tasks</CardTitle>
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
                todayTasks.filter((task: any) => task.status === 'pending').length
              )}
            </div>
            <p className="text-xs text-white/70 font-medium">Due today</p>
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
            Access common teaching tasks with one click
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
          <Button variant="outline" className="h-24 flex-col gap-3 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-300 border-2 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transform hover:scale-105" onClick={() => setActiveTab("tasks")}>
            <CheckCircle className="h-6 w-6 text-blue-600" />
            <span className="text-sm font-semibold">Today's Tasks</span>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-3 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 transition-all duration-300 border-2 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg transform hover:scale-105" onClick={() => setActiveTab("students")}>
            <Users className="h-6 w-6 text-green-600" />
            <span className="text-sm font-semibold">Student List</span>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-3 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-300 border-2 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg transform hover:scale-105" onClick={() => setActiveTab("classes")}>
            <BookOpen className="h-6 w-6 text-purple-600" />
            <span className="text-sm font-semibold">My Classes</span>
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-3 hover:bg-gradient-to-br hover:from-orange-50 hover:to-yellow-50 dark:hover:from-orange-900/20 dark:hover:to-yellow-900/20 transition-all duration-300 border-2 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-lg transform hover:scale-105" onClick={() => setActiveTab("timetable")}>
            <Clock className="h-6 w-6 text-orange-600" />
            <span className="text-sm font-semibold">My Schedule</span>
          </Button>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg">
          <TabsTrigger value="classes" className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300">
            My Classes
          </TabsTrigger>
          <TabsTrigger value="students" className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all duration-300">
            Students
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300">
            Tasks
          </TabsTrigger>
          <TabsTrigger value="assignments" className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white transition-all duration-300">
            Assignments
          </TabsTrigger>
          <TabsTrigger value="leave" className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300">
            My Leave
          </TabsTrigger>
          <TabsTrigger value="timetable" className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300">
            Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((classItem) => (
              <Card key={classItem.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{classItem.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => handleViewClassDetails(classItem.id)}>
                      <FileText className="h-4 w-4 mr-2" /> View Class Details
                    </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Students</CardTitle>
              <CardDescription>
                An overview of all {students.length} students in your classes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students.map((student) => (
                  <div key={student.user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>
                          {student.user.first_name?.[0]}{student.user.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{student.user.first_name} {student.user.last_name}</p>
                        <p className="text-sm text-muted-foreground">Class {student.school_class}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleViewStudentDetails(student.user.id)}>View Details</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Tasks</CardTitle>
                <CardDescription>
                  Tasks scheduled for today ({todayTasks.length} tasks)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todayTasks.length > 0 ? (
                    todayTasks.map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={task.priority === 'urgent' ? 'destructive' : task.priority === 'high' ? 'secondary' : 'outline'}>
                              {task.priority_display}
                            </Badge>
                            <Badge variant="outline">{task.task_type_display}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {task.status === 'pending' && (
                            <Button size="sm" variant="outline" onClick={() => handleMarkTaskInProgress(task.id)}>
                              Start
                            </Button>
                          )}
                          {task.status !== 'completed' && (
                            <Button size="sm" variant="default" onClick={() => handleMarkTaskCompleted(task.id)}>
                              Complete
                            </Button>
                          )}
                          {task.status === 'completed' && (
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No tasks for today! 🎉</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Tasks</CardTitle>
                <CardDescription>
                  Overview of all your tasks ({tasks.length} total)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {tasks.length > 0 ? (
                    tasks.map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-muted-foreground">Due: {task.due_date}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={task.status === 'completed' ? 'default' : task.status === 'in_progress' ? 'secondary' : 'outline'}>
                              {task.status_display}
                            </Badge>
                            <Badge variant={task.priority === 'urgent' ? 'destructive' : task.priority === 'high' ? 'secondary' : 'outline'}>
                              {task.priority_display}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {task.status === 'pending' && (
                            <Button size="sm" variant="outline" onClick={() => handleMarkTaskInProgress(task.id)}>
                              Start
                            </Button>
                          )}
                          {task.status !== 'completed' && (
                            <Button size="sm" variant="default" onClick={() => handleMarkTaskCompleted(task.id)}>
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No tasks found. Create your first task!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assignments">
          <div className="space-y-6">
            {/* Assignment Management Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Assignment Management</h2>
                <p className="text-muted-foreground">Create and manage assignments for your classes</p>
              </div>
              <Button className="bg-gradient-to-r from-gradient-primary to-gradient-secondary hover:from-gradient-primary/90 hover:to-gradient-secondary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </div>

            {/* Assignment Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-gradient-primary">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Assignments</p>
                      <p className="text-2xl font-bold">12</p>
                    </div>
                    <FileText className="h-8 w-8 text-gradient-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-gradient-secondary">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending Submissions</p>
                      <p className="text-2xl font-bold">8</p>
                    </div>
                    <Clock className="h-8 w-8 text-gradient-secondary" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-gradient-accent">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Graded</p>
                      <p className="text-2xl font-bold">4</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-gradient-accent" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Assignment List */}
            <Card>
              <CardHeader>
                <CardTitle>All Assignments</CardTitle>
                <CardDescription>Manage assignments across all your classes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Sample Assignment Items */}
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-gradient-primary to-gradient-secondary rounded-lg">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Mathematics Chapter 5 - Algebra</h4>
                          <p className="text-sm text-muted-foreground">Class 10-A • Due: Dec 15, 2024</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-gradient-to-r from-gradient-primary/10 to-gradient-secondary/10 text-gradient-primary">
                        15/20 Submitted
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-gradient-secondary to-gradient-primary rounded-lg">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Science Lab Report - Chemical Reactions</h4>
                          <p className="text-sm text-muted-foreground">Class 9-B • Due: Dec 18, 2024</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-gradient-to-r from-gradient-secondary/10 to-gradient-primary/10 text-gradient-secondary">
                        8/25 Submitted
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-gradient-accent to-gradient-primary rounded-lg">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold">English Literature Essay</h4>
                          <p className="text-sm text-muted-foreground">Class 10-A • Due: Dec 20, 2024</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-gradient-to-r from-gradient-accent/10 to-gradient-primary/10 text-gradient-accent">
                        12/20 Submitted
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Submissions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Submissions</CardTitle>
                <CardDescription>Latest assignment submissions from students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">John Doe</p>
                        <p className="text-sm text-muted-foreground">Mathematics Chapter 5 - Algebra</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Submitted 2h ago</Badge>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" className="bg-gradient-to-r from-gradient-primary to-gradient-secondary">
                        Grade
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>SM</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Sarah Miller</p>
                        <p className="text-sm text-muted-foreground">Science Lab Report - Chemical Reactions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Submitted 4h ago</Badge>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" className="bg-gradient-to-r from-gradient-primary to-gradient-secondary">
                        Grade
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>RJ</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Robert Johnson</p>
                        <p className="text-sm text-muted-foreground">English Literature Essay</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Submitted 6h ago</Badge>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" className="bg-gradient-to-r from-gradient-primary to-gradient-secondary">
                        Grade
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leave">
          <LeaveManagement userRole="teacher" />
        </TabsContent>

        <TabsContent value="timetable">
          <TimetableManagement userRole="teacher" />
        </TabsContent>
      </Tabs>
      </main>
    </div>
  )
}