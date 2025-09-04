"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import {
  Users,
  GraduationCap,
  BookOpen,
  Clock,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Heart,
} from "lucide-react"

// Import all the management "sub-dashboard" components
import { UserManagement } from "./user-management"
import { StudentManagement } from "./student-management"
import { TeacherManagement } from "./teacher-management"
import { FeesManagement } from "./fees-management"
import { LeaveManagement } from "./leave-management"
import { TimetableManagement } from "./timetable-management"

// Define the types for our views and data
type PrincipalView = "overview" | "users" | "students" | "teachers" | "fees" | "leave" | "timetable"

interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  pendingLeaves: number
  totalClasses: number
}

// Reusable wrapper for a consistent look and feel
const ManagementViewWrapper = ({ title, description, onBack, children }: {
  title: string,
  description: string,
  onBack: () => void,
  children: React.ReactNode
}) => (
  <div className="space-y-4">
    <div className="flex items-center space-x-4">
      <Button variant="outline" size="icon" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
    {children}
  </div>
)

export function PrincipalDashboard() {
  const { toast } = useToast()
  const [view, setView] = useState<PrincipalView>("overview")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    // This effect now fetches all the core lists for the entire dashboard
    const fetchDashboardData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [studentsRes, teachersRes, leavesRes, classesRes] = await Promise.all([
          api.students.list(),
          api.teachers.list(),
          api.leaves.list(),
          api.classes.list(),
        ])

        if (!studentsRes.success || !teachersRes.success || !leavesRes.success || !classesRes.success) {
          throw new Error("Failed to fetch one or more data sources.")
        }
        
        // Set the lists to state
        setStudents(studentsRes.data)
        setTeachers(teachersRes.data)

        // Calculate stats from the fetched data to ensure consistency
        setStats({
          totalStudents: studentsRes.data.length,
          totalTeachers: teachersRes.data.length,
          totalClasses: classesRes.data.length,
          pendingLeaves: leavesRes.data.filter((l: any) => l.status === "pending").length,
        })
      } catch (err: any) {
        setError("Failed to load dashboard data.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  const OverviewDashboard = () => (
    <div className="space-y-6">
      {/* Health Check Button */}
      <div className="flex justify-end">
        <Button variant="enhanced" size="sm" onClick={handleHealthCheck}>
          <Heart className="h-4 w-4 mr-2" />
          Health Check
        </Button>
      </div>

      {error && <Card className="border-red-200 bg-red-50"><CardContent className="pt-4"><p>{error}</p></CardContent></Card>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.totalStudents}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.totalTeachers}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.totalClasses}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.pendingLeaves}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Management Dashboards</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setView("users")}>
            <Users className="h-6 w-6" /> User Administration
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setView("students")}>
            <GraduationCap className="h-6 w-6" /> Student Management
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setView("teachers")}>
            <Users className="h-6 w-6" /> Teacher Management
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setView("fees")}>
            <BookOpen className="h-6 w-6" /> Fees Management
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setView("leave")}>
            <Clock className="h-6 w-6" /> Leave Management
          </Button>
          <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => setView("timetable")}>
            <Calendar className="h-6 w-6" /> Timetable Management
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  switch (view) {
    case "users":
      return <ManagementViewWrapper title="User Administration" onBack={() => setView("overview")}><UserManagement /></ManagementViewWrapper>
    case "students":
      return <ManagementViewWrapper title="Student Management" onBack={() => setView("overview")}><StudentManagement initialStudents={students} /></ManagementViewWrapper>
    case "teachers":
      return <ManagementViewWrapper title="Teacher Management" onBack={() => setView("overview")}><TeacherManagement initialTeachers={teachers} /></ManagementViewWrapper>
    case "fees":
      return <ManagementViewWrapper title="Fees Management" onBack={() => setView("overview")}><FeesManagement userRole="principal" /></ManagementViewWrapper>
    case "leave":
      return <ManagementViewWrapper title="Leave Management" onBack={() => setView("overview")}><LeaveManagement userRole="principal" /></ManagementViewWrapper>
    case "timetable":
       return <ManagementViewWrapper title="Timetable Management" onBack={() => setView("overview")}><TimetableManagement userRole="principal" /></ManagementViewWrapper>
    default:
      return <OverviewDashboard />
  }
}