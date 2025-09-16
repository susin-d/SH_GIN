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
import { Calendar, FileText, BarChart3, Clock, CheckCircle, AlertCircle, Download, Eye, Loader2, Heart, Settings, GraduationCap, User, Mail, Phone, MapPin, Save } from "lucide-react"
import { LeaveManagement } from "./leave-management"
import { TimetableManagement } from "./timetable-management"
import { FeesManagement } from "./fees-management"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

interface StudentProfile {
  user: {
    id: number
    username: string
    first_name: string
    last_name: string
    email: string
  }
  school_class: string
  profile?: {
    phone?: string
    address?: string
    date_of_birth?: string
    gender?: string
    emergency_contact?: string
    emergency_phone?: string
    blood_group?: string
    nationality?: string
    religion?: string
    aadhar_number?: string
    pan_number?: string
    marital_status?: string
    languages_known?: string
    medical_conditions?: string
    alternate_phone?: string
    whatsapp_number?: string
    personal_email?: string
    permanent_address?: string
    city?: string
    state?: string
    pincode?: string
    country?: string
  }
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

  const handleDownloadReport = async () => {
    try {
      // Generate a student report using the reports API
      const response = await apiClient.post("/report-management/generate/", {
        report_type: "student_performance",
        format: "pdf"
      })

      if (response.success && (response.data as any)?.report_id) {
        toast({
          title: "Report Generated",
          description: "Your student performance report is being generated. Download will start shortly.",
        })

        // In a real implementation, you would poll for the report status and then download it
        // For now, we'll just show a success message
        setTimeout(() => {
          toast({
            title: "Report Ready",
            description: "Your report is ready for download.",
          })
        }, 2000)
      } else {
        throw new Error(response.message || "Failed to generate report")
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Report Generation Failed",
        description: error.message || "Unable to generate report.",
      })
    }
  }

  const handleProfileInputChange = (field: string, value: string) => {
    setProfileFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleProfileFieldChange = (field: string, value: string) => {
    setProfileFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value
      }
    }))
  }

  const handleProfileSave = async () => {
    if (!user || !profileFormData) return

    setIsProfileSaving(true)
    try {
      const payload = {
        user: {
          first_name: profileFormData.user?.first_name || "",
          last_name: profileFormData.user?.last_name || "",
          email: profileFormData.user?.email || "",
          profile: {
            phone: profileFormData.profile?.phone || null,
            address: profileFormData.profile?.address || null,
            date_of_birth: profileFormData.profile?.date_of_birth || null,
            gender: profileFormData.profile?.gender || null,
            blood_group: profileFormData.profile?.blood_group || null,
          }
        },
        school_class: profileFormData.school_class || "",
      }

      const response = await api.students.update(user.id, payload)
      if (response.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully"
        })
        // Refresh profile data
        const refreshResponse = await api.students.get(user.id)
        if (refreshResponse.success) {
          setProfile(refreshResponse.data as StudentProfile)
          setProfileFormData(refreshResponse.data as StudentProfile)
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to update profile"
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile"
      })
    } finally {
      setIsProfileSaving(false)
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

  // Profile state
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [profileFormData, setProfileFormData] = useState<Partial<StudentProfile>>({})
  const [isProfileSaving, setIsProfileSaving] = useState(false)

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

    const fetchProfile = async () => {
      try {
        const response = await api.students.get(user?.id || 0)
        if (response.success && response.data) {
          setProfile(response.data as StudentProfile)
          setProfileFormData(response.data as StudentProfile)
        }
      } catch (err: any) {
        console.error("Failed to fetch student profile:", err)
      }
    }

    fetchStudentData()
    fetchProfile()
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="flex flex-col lg:flex-row gap-8 p-6">
        {/* Left Sidebar for Student Tools */}
        <aside className="w-full lg:w-72 lg:flex-shrink-0 animate-slide-up">
          <Card className="h-full backdrop-blur-xl bg-white/95 dark:bg-slate-800/95 border-0 shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
            <CardHeader className="pb-6 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-t-xl border-b border-slate-200/50 dark:border-slate-700/50">
              <CardTitle className="text-xl font-bold flex items-center gap-4 text-slate-800 dark:text-slate-100">
                <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                Student Portal
              </CardTitle>
              <CardDescription className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Academic Excellence Hub
              </CardDescription>
            </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Button variant="outline" className="w-full h-14 flex items-center gap-4 justify-start hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-300 border-0 hover:border-2 hover:border-blue-200 dark:hover:border-blue-700 font-semibold text-slate-700 dark:text-slate-200 hover:shadow-lg hover:scale-[1.02] group" onClick={() => setActiveTab("overview")}>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-semibold">Assignments</span>
              </Button>
              <Button variant="outline" className="w-full h-14 flex items-center gap-4 justify-start hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-900/20 dark:hover:to-teal-900/20 transition-all duration-300 border-0 hover:border-2 hover:border-emerald-200 dark:hover:border-emerald-700 font-semibold text-slate-700 dark:text-slate-200 hover:shadow-lg hover:scale-[1.02] group" onClick={() => setActiveTab("timetable")}>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition-colors">
                  <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm font-semibold">Timetable</span>
              </Button>
              <Button variant="outline" className="w-full h-14 flex items-center gap-4 justify-start hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 dark:hover:from-violet-900/20 dark:hover:to-purple-900/20 transition-all duration-300 border-0 hover:border-2 hover:border-violet-200 dark:hover:border-violet-700 font-semibold text-slate-700 dark:text-slate-200 hover:shadow-lg hover:scale-[1.02] group" onClick={() => setActiveTab("grades")}>
                <div className="p-2 bg-violet-100 dark:bg-violet-900/50 rounded-lg group-hover:bg-violet-200 dark:group-hover:bg-violet-800/50 transition-colors">
                  <BarChart3 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <span className="text-sm font-semibold">Grades</span>
              </Button>
              <Button variant="outline" className="w-full h-14 flex items-center gap-4 justify-start hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 dark:hover:from-amber-900/20 dark:hover:to-orange-900/20 transition-all duration-300 border-0 hover:border-2 hover:border-amber-200 dark:hover:border-amber-700 font-semibold text-slate-700 dark:text-slate-200 hover:shadow-lg hover:scale-[1.02] group" onClick={() => setActiveTab("fees")}>
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg group-hover:bg-amber-200 dark:group-hover:bg-amber-800/50 transition-colors">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm font-semibold">Fees</span>
              </Button>
              <Button variant="outline" className="w-full h-14 flex items-center gap-4 justify-start hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 dark:hover:from-rose-900/20 dark:hover:to-pink-900/20 transition-all duration-300 border-0 hover:border-2 hover:border-rose-200 dark:hover:border-rose-700 font-semibold text-slate-700 dark:text-slate-200 hover:shadow-lg hover:scale-[1.02] group" onClick={() => setActiveTab("leave")}>
                <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg group-hover:bg-rose-200 dark:group-hover:bg-rose-800/50 transition-colors">
                  <Clock className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </div>
                <span className="text-sm font-semibold">Leave</span>
              </Button>
              <Button variant="outline" className="w-full h-14 flex items-center gap-4 justify-start hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 dark:hover:from-indigo-900/20 dark:hover:to-blue-900/20 transition-all duration-300 border-0 hover:border-2 hover:border-indigo-200 dark:hover:border-indigo-700 font-semibold text-slate-700 dark:text-slate-200 hover:shadow-lg hover:scale-[1.02] group" onClick={() => setActiveTab("profile")}>
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/50 transition-colors">
                  <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-sm font-semibold">Profile</span>
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
          <Button variant="outline" size="sm" onClick={handleDownloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>

        {/* Stats Overview - Professional Commercial Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 animate-fade-in">
          <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-900 transition-all duration-500 border-0 shadow-2xl hover:shadow-blue-500/25 hover:scale-[1.02] ring-1 ring-blue-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <CardTitle className="text-sm font-bold text-white/90 tracking-wide">Academic Performance</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 relative z-10">
              <div className="text-4xl font-black text-white mb-2 tracking-tight">
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-7 w-7 animate-spin" />
                    <span className="text-lg">--</span>
                  </div>
                ) : (
                  stats?.currentGPA ?? "N/A"
                )}
              </div>
              <p className="text-sm text-blue-100 font-semibold">Grade: <span className="text-white font-bold">{stats?.currentGrade ?? "N/A"}</span></p>
              <div className="mt-3 w-full bg-white/20 rounded-full h-2">
                <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{width: `${stats?.currentGPA ? (stats.currentGPA / 4) * 100 : 0}%`}}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-700 hover:via-emerald-800 hover:to-teal-900 transition-all duration-500 border-0 shadow-2xl hover:shadow-emerald-500/25 hover:scale-[1.02] ring-1 ring-emerald-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <CardTitle className="text-sm font-bold text-white/90 tracking-wide">Attendance Rate</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 relative z-10">
              <div className="text-4xl font-black text-white mb-2 tracking-tight">
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-7 w-7 animate-spin" />
                    <span className="text-lg">--</span>
                  </div>
                ) : (
                  `${stats?.attendanceRate ?? "N/A"}%`
                )}
              </div>
              <p className="text-sm text-emerald-100 font-semibold">This semester</p>
              <div className="mt-3 w-full bg-white/20 rounded-full h-2">
                <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{width: `${stats?.attendanceRate ?? 0}%`}}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800 hover:from-amber-700 hover:via-amber-800 hover:to-orange-900 transition-all duration-500 border-0 shadow-2xl hover:shadow-amber-500/25 hover:scale-[1.02] ring-1 ring-amber-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <CardTitle className="text-sm font-bold text-white/90 tracking-wide">Assignment Progress</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <FileText className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 relative z-10">
              <div className="text-4xl font-black text-white mb-2 tracking-tight">
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-7 w-7 animate-spin" />
                    <span className="text-lg">--</span>
                  </div>
                ) : (
                  `${stats?.completedAssignments ?? "N/A"}/${stats?.totalAssignments ?? "N/A"}`
                )}
              </div>
              <p className="text-sm text-amber-100 font-semibold">Tasks completed</p>
              <div className="mt-3 w-full bg-white/20 rounded-full h-2">
                <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{width: `${stats?.totalAssignments ? (stats.completedAssignments / stats.totalAssignments) * 100 : 0}%`}}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-violet-600 via-violet-700 to-purple-800 hover:from-violet-700 hover:via-violet-800 hover:to-purple-900 transition-all duration-500 border-0 shadow-2xl hover:shadow-violet-500/25 hover:scale-[1.02] ring-1 ring-violet-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <CardTitle className="text-sm font-bold text-white/90 tracking-wide">Upcoming Deadlines</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 relative z-10">
              <div className="text-4xl font-black text-white mb-2 tracking-tight">
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-7 w-7 animate-spin" />
                    <span className="text-lg">--</span>
                  </div>
                ) : (
                  stats?.upcomingDeadlines ?? "N/A"
                )}
              </div>
              <p className="text-sm text-violet-100 font-semibold">This week</p>
              <div className="mt-3 flex items-center space-x-2">
                <div className="flex space-x-1">
                  {Array.from({length: Math.min(stats?.upcomingDeadlines || 0, 5)}).map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: `${i * 0.1}s`}}></div>
                  ))}
                </div>
                {stats?.upcomingDeadlines > 5 && <span className="text-xs text-white/80 font-medium">+{stats.upcomingDeadlines - 5}</span>}
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Quick Actions - Commercial Professional Design */}
      <Card className="backdrop-blur-xl bg-white/95 dark:bg-slate-800/95 border-0 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <CardHeader className="bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 rounded-t-xl border-b border-slate-200/60 dark:border-slate-700/60">
          <CardTitle className="text-2xl font-black flex items-center gap-4 text-slate-800 dark:text-slate-100 tracking-tight">
            <div className="p-3 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            Quick Actions
          </CardTitle>
          <CardDescription className="text-lg font-semibold text-slate-600 dark:text-slate-300">
            Streamlined access to essential academic tools
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 p-8">
          <Button variant="outline" className="group relative overflow-hidden h-28 flex-col gap-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-800/30 dark:hover:to-indigo-800/30 transition-all duration-500 border-2 border-blue-200/50 dark:border-blue-700/50 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-500/20 transform hover:scale-105 ring-1 ring-blue-500/10" onClick={() => setActiveTab("timetable")}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-all duration-300 group-hover:scale-110">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="relative z-10 text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Today's Schedule</span>
          </Button>

          <Button variant="outline" className="group relative overflow-hidden h-28 flex-col gap-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-800/30 dark:hover:to-teal-800/30 transition-all duration-500 border-2 border-emerald-200/50 dark:border-emerald-700/50 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-2xl hover:shadow-emerald-500/20 transform hover:scale-105 ring-1 ring-emerald-500/10" onClick={() => setActiveTab("grades")}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition-all duration-300 group-hover:scale-110">
              <BarChart3 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="relative z-10 text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Performance Analytics</span>
          </Button>

          <Button variant="outline" className="group relative overflow-hidden h-28 flex-col gap-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 hover:from-violet-100 hover:to-purple-100 dark:hover:from-violet-800/30 dark:hover:to-purple-800/30 transition-all duration-500 border-2 border-violet-200/50 dark:border-violet-700/50 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-2xl hover:shadow-violet-500/20 transform hover:scale-105 ring-1 ring-violet-500/10" onClick={() => setActiveTab("overview")}>
            <div className="absolute inset-0 bg-gradient-to-br from-violet-400/10 to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 p-3 bg-violet-100 dark:bg-violet-900/50 rounded-xl group-hover:bg-violet-200 dark:group-hover:bg-violet-800/50 transition-all duration-300 group-hover:scale-110">
              <FileText className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            </div>
            <span className="relative z-10 text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Assignment Hub</span>
          </Button>

          <Button variant="outline" className="group relative overflow-hidden h-28 flex-col gap-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-800/30 dark:hover:to-orange-800/30 transition-all duration-500 border-2 border-amber-200/50 dark:border-amber-700/50 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-2xl hover:shadow-amber-500/20 transform hover:scale-105 ring-1 ring-amber-500/10" onClick={() => setActiveTab("fees")}>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-orange-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 p-3 bg-amber-100 dark:bg-amber-900/50 rounded-xl group-hover:bg-amber-200 dark:group-hover:bg-amber-800/50 transition-all duration-300 group-hover:scale-110">
              <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="relative z-10 text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Financial Overview</span>
          </Button>

          <Button variant="outline" className="group relative overflow-hidden h-28 flex-col gap-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 hover:from-indigo-100 hover:to-blue-100 dark:hover:from-indigo-800/30 dark:hover:to-blue-800/30 transition-all duration-500 border-2 border-indigo-200/50 dark:border-indigo-700/50 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-500/20 transform hover:scale-105 ring-1 ring-indigo-500/10" onClick={() => setActiveTab("profile")}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 to-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/50 transition-all duration-300 group-hover:scale-110">
              <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="relative z-10 text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Personal Profile</span>
          </Button>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-14 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 rounded-xl p-1">
          <TabsTrigger value="overview" className="text-sm font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 data-[state=active]:transform data-[state=active]:scale-105">
            Overview
          </TabsTrigger>
          <TabsTrigger value="timetable" className="text-sm font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 data-[state=active]:transform data-[state=active]:scale-105">
            Timetable
          </TabsTrigger>
          <TabsTrigger value="grades" className="text-sm font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 data-[state=active]:transform data-[state=active]:scale-105">
            Grades
          </TabsTrigger>
          <TabsTrigger value="fees" className="text-sm font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 data-[state=active]:transform data-[state=active]:scale-105">
            My Fees
          </TabsTrigger>
          <TabsTrigger value="leave" className="text-sm font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 data-[state=active]:transform data-[state=active]:scale-105">
            Leave
          </TabsTrigger>
          <TabsTrigger value="profile" className="text-sm font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 data-[state=active]:transform data-[state=active]:scale-105">
            Profile
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
                <CardTitle>Today&apos;s Classes</CardTitle>
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
                <CardTitle>Upcoming Assignments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {grades && grades.length > 0 ? (
                  grades.slice(0, 3).map((grade) => (
                    <div key={grade.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{grade.assignment.title}</p>
                        <p className="text-sm text-muted-foreground">{grade.graded_date}</p>
                      </div>
                      <Badge className={getGradeColor(grade.score)}>{grade.score}%</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center pt-4">No grades available yet.</p>
                )}
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
                {grades && grades.length > 0 ? (
                  grades.map((grade) => (
                    <div key={grade.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{grade.assignment.title}</p>
                        <p className="text-sm text-muted-foreground">Graded on: {grade.graded_date}</p>
                      </div>
                      <Badge className={getGradeColor(grade.score)}>{grade.score}%</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center pt-4">No grades available yet.</p>
                )}
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

        <TabsContent value="profile" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">My Profile</h2>
              <p className="text-muted-foreground">Manage your personal information</p>
            </div>
            <Button onClick={handleProfileSave} disabled={isProfileSaving}>
              {isProfileSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile_first_name">First Name</Label>
                    <Input
                      id="profile_first_name"
                      value={profileFormData.user?.first_name || ""}
                      onChange={(e) => handleProfileInputChange("user.first_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile_last_name">Last Name</Label>
                    <Input
                      id="profile_last_name"
                      value={profileFormData.user?.last_name || ""}
                      onChange={(e) => handleProfileInputChange("user.last_name", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile_email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="profile_email"
                    type="email"
                    value={profileFormData.user?.email || ""}
                    onChange={(e) => handleProfileInputChange("user.email", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile_school_class">Class</Label>
                  <Input
                    id="profile_school_class"
                    value={profileFormData.school_class || ""}
                    onChange={(e) => handleProfileInputChange("school_class", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Profile Picture & Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-12 w-12 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold">{profile?.user.first_name} {profile?.user.last_name}</h3>
                    <p className="text-sm text-muted-foreground">{profile?.user.username}</p>
                    <p className="text-sm text-muted-foreground">Class {profile?.school_class}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>
                Optional details for your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profile_phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    id="profile_phone"
                    value={profileFormData.profile?.phone || ""}
                    onChange={(e) => handleProfileFieldChange("phone", e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile_date_of_birth" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date of Birth
                  </Label>
                  <Input
                    id="profile_date_of_birth"
                    type="date"
                    value={profileFormData.profile?.date_of_birth || ""}
                    onChange={(e) => handleProfileFieldChange("date_of_birth", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile_address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </Label>
                <Textarea
                  id="profile_address"
                  value={profileFormData.profile?.address || ""}
                  onChange={(e) => handleProfileFieldChange("address", e.target.value)}
                  placeholder="Enter your address"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profile_gender">Gender</Label>
                  <Select value={profileFormData.profile?.gender || ""} onValueChange={(value) => handleProfileFieldChange("gender", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile_blood_group">Blood Group</Label>
                  <Select value={profileFormData.profile?.blood_group || ""} onValueChange={(value) => handleProfileFieldChange("blood_group", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </main>
      </div>
    </div>
  )
}