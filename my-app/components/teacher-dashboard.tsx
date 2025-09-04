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
        if (tasksRes.success) setTasks(tasksRes.data)
        if (todayTasksRes.success) setTodayTasks(todayTasksRes.data)
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

  return (
    <div className="space-y-6">
      {/* Health Check Button */}
      <div className="flex justify-end">
        <Button variant="enhanced" size="sm" onClick={handleHealthCheck}>
          <Heart className="h-4 w-4 mr-2" />
          Health Check
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_classes ?? "N/A"}</div>
            <p className="text-xs text-muted-foreground">Total assigned classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_students ?? "N/A"}</div>
            <p className="text-xs text-muted-foreground">Across all your classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">91.5%</div>
            <p className="text-xs text-muted-foreground">(Demo Data)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayTasks.filter((task: any) => task.status === 'pending').length}</div>
            <p className="text-xs text-muted-foreground">Due today</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-6">
          <TabsTrigger value="classes">My Classes</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="leave">My Leave</TabsTrigger>
          <TabsTrigger value="timetable">My Schedule</TabsTrigger>
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
                            <Button size="sm" variant="enhanced" onClick={() => handleMarkTaskCompleted(task.id)}>
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
                            <Button size="sm" variant="enhanced" onClick={() => handleMarkTaskCompleted(task.id)}>
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
          <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
              <CardDescription>This feature is under construction.</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="leave">
          <LeaveManagement userRole="teacher" />
        </TabsContent>

        <TabsContent value="timetable">
          <TimetableManagement userRole="teacher" />
        </TabsContent>
      </Tabs>
    </div>
  )
}