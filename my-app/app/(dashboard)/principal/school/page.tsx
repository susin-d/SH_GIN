"use client"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
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
  Calendar,
  Heart,
  FileText,
  Send,
  Plus,
  Settings,
  BarChart3,
  Menu,
  DollarSign,
  TrendingUp,
  Activity,
  RefreshCw,
} from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts"

// Define the types for our data
interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  pendingLeaves: number
  totalClasses: number
  totalFees: number
  outstandingFees: number
  attendanceRate: number
}

interface AttendanceData {
  month: string
  present: number
  absent: number
  rate: number
}

interface FeeData {
  status: string
  count: number
  amount: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

// Memoized Metric Card Component for performance
const MetricCard = memo(({
  title,
  value,
  description,
  icon: Icon,
  color,
  ariaLabel
}: {
  title: string
  value: string | number
  description: string
  icon: any
  color: string
  ariaLabel: string
}) => (
  <Card
    className={`bg-gradient-to-br ${color} text-white border-0 shadow-lg hover:shadow-xl transition-shadow`}
    role="region"
    aria-labelledby={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}
  >
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle
        id={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}
        className="text-sm font-medium"
      >
        {title}
      </CardTitle>
      <Icon className="h-4 w-4" aria-hidden="true" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold" aria-label={`${title}: ${value}`}>
        {value}
      </div>
      <p className="text-xs opacity-90" aria-label={description}>
        {description}
      </p>
    </CardContent>
  </Card>
))

MetricCard.displayName = 'MetricCard'

export default function PrincipalSchoolDashboard() {
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([])
  const [feeData, setFeeData] = useState<FeeData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Memoized data processing functions for performance
  const calculateAttendanceRate = useCallback((attendance: any[]): number => {
    if (attendance.length === 0) return 0
    const presentCount = attendance.filter((a: any) => a.status === "present").length
    return Math.round((presentCount / attendance.length) * 100)
  }, [])

  const processAttendanceData = useCallback((attendance: any[]): AttendanceData[] => {
    const monthlyData: { [key: string]: { present: number; absent: number } } = {}

    attendance.forEach((record: any) => {
      const month = new Date(record.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      if (!monthlyData[month]) {
        monthlyData[month] = { present: 0, absent: 0 }
      }
      if (record.status === "present") {
        monthlyData[month].present++
      } else {
        monthlyData[month].absent++
      }
    })

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      present: data.present,
      absent: data.absent,
      rate: data.present + data.absent > 0 ? Math.round((data.present / (data.present + data.absent)) * 100) : 0
    }))
  }, [])

  const processFeeData = useCallback((fees: any[]): FeeData[] => {
    const statusCounts: { [key: string]: { count: number; amount: number } } = {}

    fees.forEach((fee: any) => {
      const status = fee.status
      if (!statusCounts[status]) {
        statusCounts[status] = { count: 0, amount: 0 }
      }
      statusCounts[status].count++
      statusCounts[status].amount += fee.amount
    })

    return Object.entries(statusCounts).map(([status, data]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count: data.count,
      amount: data.amount
    }))
  }, [])

  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    setIsRefreshing(true)
    setError(null)
    try {
      // Fetch all required data in parallel
      const [
        studentsRes,
        teachersRes,
        leavesRes,
        classesRes,
        feesRes,
        attendanceRes
      ] = await Promise.all([
        api.students.list(),
        api.teachers.list(),
        api.leaves.list(),
        api.classes.list(),
        api.fees.list(),
        api.attendance.list(),
      ])

      if (!studentsRes.success || !teachersRes.success || !leavesRes.success ||
          !classesRes.success || !feesRes.success || !attendanceRes.success) {
        throw new Error("Failed to fetch dashboard data")
      }

      // Calculate stats
      const students = studentsRes.data as any[]
      const teachers = teachersRes.data as any[]
      const leaves = leavesRes.data as any[]
      const classes = classesRes.data as any[]
      const fees = feesRes.data as any[]
      const attendance = attendanceRes.data as any[]

      setStats({
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        pendingLeaves: leaves.filter((l: any) => l.status === "pending").length,
        totalFees: fees.reduce((sum: number, fee: any) => sum + fee.amount, 0),
        outstandingFees: fees.filter((f: any) => f.status === "unpaid").reduce((sum: number, fee: any) => sum + fee.amount, 0),
        attendanceRate: calculateAttendanceRate(attendance),
      })

      // Process attendance data for charts
      setAttendanceData(processAttendanceData(attendance))

      // Process fee data for charts
      setFeeData(processFeeData(fees))

    } catch (err: any) {
      setError("Failed to load dashboard data. Please try again.")
      console.error("Dashboard data fetch error:", err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [calculateAttendanceRate, processAttendanceData, processFeeData])

  useEffect(() => {
    fetchDashboardData()

    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => fetchDashboardData(false), 30000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    fetchDashboardData(false)
  }, [fetchDashboardData])


  const handleGenerateReport = async (reportType: string) => {
    try {
      const response = await api.reports.generate({
        report_type: reportType,
        format: "json"
      })
      if (response.success) {
        toast({
          title: "Report Generated",
          description: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report has been generated successfully.`,
        })
      } else {
        throw new Error(response.message)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Generate Report",
        description: error.message || "Unable to generate report.",
      })
    }
  }

  const handleSendFeeReminders = async () => {
    try {
      const response = await api.fees.sendReminders()
      if (response.success) {
        toast({
          title: "Fee Reminders Sent",
          description: "Reminders sent successfully to outstanding fee payers.",
        })
      } else {
        throw new Error(response.message)
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Send Reminders",
        description: error.message || "Unable to send fee reminders.",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-lg">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 w-full"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const chartConfig = {
    present: {
      label: "Present",
      color: "#00C49F",
    },
    absent: {
      label: "Absent",
      color: "#FF8042",
    },
    rate: {
      label: "Attendance Rate (%)",
      color: "#0088FE",
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">School Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Real-time overview of school operations and performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh dashboard data"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label="Live updates status"
              disabled
            >
              <Activity className="h-4 w-4 mr-2" />
              Live Updates
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerateReport("academic")}
              aria-label="Generate academic report"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          role="region"
          aria-labelledby="metrics-section"
        >
          <h2 id="metrics-section" className="sr-only">Key Performance Metrics</h2>
          <MetricCard
            title="Total Students"
            value={stats?.totalStudents || 0}
            description="Enrolled students"
            icon={Users}
            color="from-blue-500 to-blue-600"
            ariaLabel="Total number of enrolled students"
          />

          <MetricCard
            title="Total Teachers"
            value={stats?.totalTeachers || 0}
            description="Faculty members"
            icon={GraduationCap}
            color="from-green-500 to-green-600"
            ariaLabel="Total number of faculty members"
          />

          <MetricCard
            title="Attendance Rate"
            value={`${stats?.attendanceRate || 0}%`}
            description="Overall attendance"
            icon={TrendingUp}
            color="from-purple-500 to-purple-600"
            ariaLabel="Overall school attendance rate percentage"
          />

          <MetricCard
            title="Outstanding Fees"
            value={`₹${stats?.outstandingFees?.toLocaleString() || 0}`}
            description="Pending payments"
            icon={DollarSign}
            color="from-orange-500 to-orange-600"
            ariaLabel="Total outstanding fee amount in rupees"
          />
        </div>

        {/* Charts Section */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          role="region"
          aria-labelledby="charts-section"
        >
          <h2 id="charts-section" className="sr-only">Data Visualization Charts</h2>
          {/* Attendance Trends Chart */}
          <Card className="shadow-lg" role="img" aria-labelledby="attendance-chart-title">
            <CardHeader>
              <CardTitle id="attendance-chart-title" className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" aria-hidden="true" />
                Attendance Trends
              </CardTitle>
              <CardDescription>Monthly attendance statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={chartConfig}
                className="h-[300px]"
                aria-label="Bar chart showing monthly attendance trends with present and absent counts"
              >
                <BarChart data={attendanceData} aria-describedby="attendance-chart-desc">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="present" fill="var(--color-present)" aria-label="Present students" />
                  <Bar dataKey="absent" fill="var(--color-absent)" aria-label="Absent students" />
                </BarChart>
              </ChartContainer>
              <div id="attendance-chart-desc" className="sr-only">
                This chart displays monthly attendance data showing the number of present and absent students over time.
              </div>
            </CardContent>
          </Card>

          {/* Fee Status Chart */}
          <Card className="shadow-lg" role="img" aria-labelledby="fee-chart-title">
            <CardHeader>
              <CardTitle id="fee-chart-title" className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" aria-hidden="true" />
                Fee Collection Status
              </CardTitle>
              <CardDescription>Distribution of fee payment statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={chartConfig}
                className="h-[300px]"
                aria-label="Pie chart showing fee payment status distribution"
              >
                <PieChart aria-describedby="fee-chart-desc">
                  <Pie
                    data={feeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {feeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        aria-label={`${entry.status}: ${entry.count} students`}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div id="fee-chart-desc" className="sr-only">
                This pie chart shows the distribution of fee payment statuses across all students.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalClasses || 0}</div>
              <p className="text-xs text-muted-foreground">Active classes</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingLeaves || 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats?.totalFees?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">Total fee amount</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-blue-50 hover:border-blue-300"
                onClick={() => handleGenerateReport("academic")}
              >
                <FileText className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-medium">Academic Report</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-green-50 hover:border-green-300"
                onClick={() => handleGenerateReport("financial")}
              >
                <BarChart3 className="h-6 w-6 text-green-600" />
                <span className="text-sm font-medium">Financial Report</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-purple-50 hover:border-purple-300"
                onClick={handleSendFeeReminders}
              >
                <Send className="h-6 w-6 text-purple-600" />
                <span className="text-sm font-medium">Send Reminders</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:bg-orange-50 hover:border-orange-300"
                onClick={() => handleGenerateReport("attendance")}
              >
                <Calendar className="h-6 w-6 text-orange-600" />
                <span className="text-sm font-medium">Attendance Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}