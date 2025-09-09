"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { api, apiClient } from "@/lib/api"
import { Zap, CheckCircle } from "lucide-react"
import {
  Users,
  GraduationCap,
  BookOpen,
  Clock,
  Loader2,
  AlertCircle,
  Calendar,
  Heart,
  FileText,
  Send,
  Plus,
  Settings,
  BarChart3,
  Menu,
} from "lucide-react"

// Management components are now in separate pages


// Define the types for our data

interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  pendingLeaves: number
  totalClasses: number
}


export function PrincipalDashboard() {
  const { toast } = useToast()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [asyncDemoLoading, setAsyncDemoLoading] = useState(false)
  const [asyncDemoResult, setAsyncDemoResult] = useState<string | null>(null)

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
        setStudents(studentsRes.data as any[])
        setTeachers(teachersRes.data as any[])

        // Calculate stats from the fetched data to ensure consistency
        setStats({
          totalStudents: (studentsRes.data as any[]).length,
          totalTeachers: (teachersRes.data as any[]).length,
          totalClasses: (classesRes.data as any[]).length,
          pendingLeaves: (leavesRes.data as any[]).filter((l: any) => l.status === "pending").length,
        })
      } catch (err: any) {
        setError("Failed to load dashboard data.")
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  const handleGenerateFeesReport = async () => {
    try {
      const response = await apiClient.get('/fees/actions/', {
        params: { action: 'generate_report' }
      });
      if (response.success) {
        // Open the HTML report in a new window
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(response.data);
          newWindow.document.close();
        }
        toast({
          title: "Fees Report Generated",
          description: "Report opened in new window.",
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Generate Report",
        description: error.message || "Unable to generate fees report.",
      });
    }
  };

  const handleAcademicReport = async () => {
    try {
      const response = await api.reports.generate({ report_type: "academic", format: "json" });
      if (response.success) {
        toast({
          title: "Academic Report Generated",
          description: "Report has been generated successfully. Check the Reports page to view and download it.",
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Generate Academic Report",
        description: error.message || "Unable to generate academic report.",
      });
    }
  };

  const handleFeesSummaryReport = async () => {
    try {
      const response = await api.reports.generate({ report_type: "financial", format: "json" });
      if (response.success) {
        toast({
          title: "Financial Report Generated",
          description: "Report has been generated successfully. Check the Reports page to view and download it.",
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Generate Financial Report",
        description: error.message || "Unable to generate financial report.",
      });
    }
  };

  const handleSendFeeReminders = async () => {
    try {
      const response = await api.fees.sendReminders();
      if (response.success) {
        toast({
          title: "Fee Reminders Sent",
          description: response.data.message || "Reminders sent successfully.",
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Send Reminders",
        description: error.message || "Unable to send fee reminders.",
      });
    }
  };

  const handleCreateClassFee = async () => {
    // For simplicity, use a hardcoded class and amount. In a real app, use a dialog.
    try {
      const response = await api.fees.createClassFee(1, 100, "2024-12-31"); // Example: class 1, $100, due end of year
      if (response.success) {
        toast({
          title: "Class Fee Created",
          description: response.data.message || "Fee created for class.",
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Create Class Fee",
        description: error.message || "Unable to create class fee.",
      });
    }
  };

  const handleViewAllTasks = async () => {
    try {
      const response = await api.tasks.list();
      if (response.success) {
        toast({
          title: "All Tasks",
          description: `Total tasks: ${response.data.length}`,
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Fetch Tasks",
        description: error.message || "Unable to fetch tasks.",
      });
    }
  };

  const handleManagePeriods = async () => {
    try {
      const response = await api.periods.list();
      if (response.success) {
        toast({
          title: "School Periods",
          description: `Total periods: ${(response.data as any[]).length}`,
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Fetch Periods",
        description: error.message || "Unable to fetch periods.",
      });
    }
  };

  const handleAsyncDemo = async () => {
    setAsyncDemoLoading(true);
    setAsyncDemoResult(null);

    try {
      // Test the async bulk data processing endpoint
      const response = await apiClient.post('/async-tasks/process_bulk_data/', {
        operation: 'bulk_grade_update',
        data: [
          { student_id: 1, grade: 'A', subject: 'Math' },
          { student_id: 2, grade: 'B+', subject: 'Science' },
          { student_id: 3, grade: 'A-', subject: 'English' }
        ]
      });

      if (response.success) {
        setAsyncDemoResult(`✅ ${response.data.message}`);
        toast({
          title: "Async Demo Successful",
          description: "Bulk grade update processed asynchronously!",
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      setAsyncDemoResult(`❌ Async processing failed: ${error.message}`);
      toast({
        variant: "destructive",
        title: "Async Demo Failed",
        description: error.message || "Unable to process async request.",
      });
    } finally {
      setAsyncDemoLoading(false);
    }
  };

  // CLEANED UP: The OverviewDashboard component is now clean and has no duplicated code.
  const OverviewDashboard = () => (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Sidebar for Management Links */}
      <aside className="w-full lg:w-64 lg:flex-shrink-0 animate-slide-up">
        <Card className="h-full backdrop-blur-sm bg-white/90 dark:bg-slate-800/90 border-white/20 dark:border-slate-700/20 shadow-xl">
          <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-3 text-foreground">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Menu className="h-5 w-5 text-white" />
              </div>
              Management
            </CardTitle>
            <CardDescription className="text-sm font-medium">
              Administrative Tools
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Button variant="outline" className="w-full h-12 flex items-center gap-3 justify-start hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300 border-2 hover:border-blue-300 dark:hover:border-blue-600 font-medium" onClick={() => router.push("/users")}>
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">User Admin</span>
              </Button>
              <Button variant="outline" className="w-full h-12 flex items-center gap-3 justify-start hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 transition-all duration-300 border-2 hover:border-green-300 dark:hover:border-green-600 font-medium" onClick={() => router.push("/students")}>
                <GraduationCap className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Students</span>
              </Button>
              <Button variant="outline" className="w-full h-12 flex items-center gap-3 justify-start hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-300 border-2 hover:border-purple-300 dark:hover:border-purple-600 font-medium" onClick={() => router.push("/teachers")}>
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Teachers</span>
              </Button>
              <Button variant="outline" className="w-full h-12 flex items-center gap-3 justify-start hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 dark:hover:from-orange-900/20 dark:hover:to-yellow-900/20 transition-all duration-300 border-2 hover:border-orange-300 dark:hover:border-orange-600 font-medium" onClick={() => router.push("/fees")}>
                <BookOpen className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Fees</span>
              </Button>
              <Button variant="outline" className="w-full h-12 flex items-center gap-3 justify-start hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 transition-all duration-300 border-2 hover:border-red-300 dark:hover:border-red-600 font-medium" onClick={() => router.push("/leave")}>
                <Clock className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Leave</span>
              </Button>
              <Button variant="outline" className="w-full h-12 flex items-center gap-3 justify-start hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 dark:hover:from-indigo-900/20 dark:hover:to-blue-900/20 transition-all duration-300 border-2 hover:border-indigo-300 dark:hover:border-indigo-600 font-medium" onClick={() => router.push("/timetable")}>
                <Calendar className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium">Timetable</span>
              </Button>
              <Button variant="outline" className="w-full h-12 flex items-center gap-3 justify-start hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 dark:hover:from-teal-900/20 dark:hover:to-cyan-900/20 transition-all duration-300 border-2 hover:border-teal-300 dark:hover:border-teal-600 font-medium" onClick={() => router.push("/timetable-overview")}>
                <Calendar className="h-4 w-4 text-teal-600" />
                <span className="text-sm font-medium">Overview</span>
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
          <Button variant="outline" size="sm" onClick={handleGenerateFeesReport}>
            <FileText className="h-4 w-4 mr-2" />
            Generate Fees Report
          </Button>
        </div>

        {error && <Card className="border-red-200 bg-red-50"><CardContent className="pt-4"><p>{error}</p></CardContent></Card>}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="stats-card group hover:scale-105 transition-all duration-300 animate-fade-in border-0 shadow-xl">
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
                  stats?.totalStudents || 0
                )}
              </div>
              <p className="text-xs text-white/70 font-medium">Active enrollments</p>
            </CardContent>
          </Card>
          <Card className="stats-card-green group hover:scale-105 transition-all duration-300 animate-fade-in border-0 shadow-xl" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-white/90">Total Teachers</CardTitle>
              <GraduationCap className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-white mb-1">
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-lg">Loading</span>
                  </div>
                ) : (
                  stats?.totalTeachers || 0
                )}
              </div>
              <p className="text-xs text-white/70 font-medium">Faculty members</p>
            </CardContent>
          </Card>
          <Card className="stats-card-orange group hover:scale-105 transition-all duration-300 animate-fade-in border-0 shadow-xl" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-white/90">Total Classes</CardTitle>
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
                  stats?.totalClasses || 0
                )}
              </div>
              <p className="text-xs text-white/70 font-medium">Active classes</p>
            </CardContent>
          </Card>
          <Card className="stats-card-purple group hover:scale-105 transition-all duration-300 animate-fade-in border-0 shadow-xl" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-white/90">Pending Leaves</CardTitle>
              <Clock className="h-5 w-5 text-white/80" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-3xl font-bold text-white mb-1">
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-lg">Loading</span>
                  </div>
                ) : (
                  stats?.pendingLeaves || 0
                )}
              </div>
              <p className="text-xs text-white/70 font-medium">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="backdrop-blur-sm bg-white/90 dark:bg-slate-800/90 border-white/20 dark:border-slate-700/20 shadow-xl animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-t-lg">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Settings className="h-5 w-5 text-white" />
              </div>
              Quick Actions
            </CardTitle>
            <CardDescription className="text-base font-medium">
              Access common management tasks with one click
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            <Button variant="outline" className="h-24 flex-col gap-3 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-300 border-2 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transform hover:scale-105" onClick={handleAcademicReport}>
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-semibold">Academic Report</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-3 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 transition-all duration-300 border-2 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg transform hover:scale-105" onClick={handleFeesSummaryReport}>
              <FileText className="h-6 w-6 text-green-600" />
              <span className="text-sm font-semibold">Fees Summary</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-3 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-300 border-2 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg transform hover:scale-105" onClick={handleSendFeeReminders}>
              <Send className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-semibold">Send Reminders</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-3 hover:bg-gradient-to-br hover:from-orange-50 hover:to-yellow-50 dark:hover:from-orange-900/20 dark:hover:to-yellow-900/20 transition-all duration-300 border-2 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-lg transform hover:scale-105" onClick={handleCreateClassFee}>
              <Plus className="h-6 w-6 text-orange-600" />
              <span className="text-sm font-semibold">Create Class Fee</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-3 hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50 dark:hover:from-red-900/20 dark:hover:to-rose-900/20 transition-all duration-300 border-2 hover:border-red-300 dark:hover:border-red-600 hover:shadow-lg transform hover:scale-105" onClick={handleViewAllTasks}>
              <Clock className="h-6 w-6 text-red-600" />
              <span className="text-sm font-semibold">View All Tasks</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-3 hover:bg-gradient-to-br hover:from-teal-50 hover:to-cyan-50 dark:hover:from-teal-900/20 dark:hover:to-cyan-900/20 transition-all duration-300 border-2 hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-lg transform hover:scale-105" onClick={handleManagePeriods}>
              <Settings className="h-6 w-6 text-teal-600" />
              <span className="text-sm font-semibold">Manage Periods</span>
            </Button>
          </CardContent>
        </Card>

        {/* Async Demo Section */}
        <Card className="backdrop-blur-sm bg-white/90 dark:bg-slate-800/90 border-white/20 dark:border-slate-700/20 shadow-xl animate-slide-up" style={{ animationDelay: '0.8s' }}>
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-t-lg">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-gradient-primary to-gradient-secondary rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              Async Processing Demo
            </CardTitle>
            <CardDescription className="text-base font-medium">
              Test the new async processing capabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <Button
                onClick={handleAsyncDemo}
                disabled={asyncDemoLoading}
                className="bg-gradient-to-r from-gradient-primary to-gradient-secondary hover:from-gradient-primary/90 hover:to-gradient-secondary/90"
              >
                {asyncDemoLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing Async...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Test Async Bulk Processing
                  </>
                )}
              </Button>

              {asyncDemoResult && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      {asyncDemoResult}
                    </p>
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                <p><strong>Async Benefits:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Parallel database queries for better performance</li>
                  <li>Non-blocking I/O operations</li>
                  <li>Improved response times for heavy operations</li>
                  <li>Better resource utilization</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )

  // Return the overview dashboard since sidebar buttons now navigate to separate pages
  return <OverviewDashboard />
}