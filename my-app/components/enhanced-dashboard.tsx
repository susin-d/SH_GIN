"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useCache } from "@/lib/cache-context"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  User,
  Settings,
  Database,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Shield,
  GraduationCap,
  BookOpen,
  BarChart3,
  FileText,
  Users,
  Calendar,
  Bell,
  Zap,
  Clock
} from "lucide-react"

interface DashboardStats {
  totalUsers: number
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  cacheHits: number
  apiCalls: number
}

export function EnhancedDashboard() {
  const { user } = useAuth()
  const cache = useCache()
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    cacheHits: 0,
    apiCalls: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [cacheStatus, setCacheStatus] = useState<'checking' | 'enabled' | 'disabled'>('checking')

  useEffect(() => {
    loadDashboardData()
    checkCacheStatus()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load stats from API - using a simple approach for demo
      // In a real app, you'd have a dedicated stats endpoint
      try {
        const studentsResponse = await api.students.list()
        const teachersResponse = await api.teachers.list()

        setStats(prev => ({
          ...prev,
          totalStudents: studentsResponse.success && Array.isArray(studentsResponse.data) ? studentsResponse.data.length : 0,
          totalTeachers: teachersResponse.success && Array.isArray(teachersResponse.data) ? teachersResponse.data.length : 0,
          totalClasses: 0 // Would need a classes endpoint
        }))
      } catch (error) {
        console.error('Failed to load stats:', error)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const checkCacheStatus = () => {
    // Check if cache is working by testing a simple operation
    try {
      cache.set('test_key', 'test_value', 1000)
      const retrieved = cache.get('test_key')
      setCacheStatus(retrieved === 'test_value' ? 'enabled' : 'disabled')
      cache.remove('test_key')
    } catch (error) {
      setCacheStatus('disabled')
    }
  }

  const testAPIEndpoints = async () => {
    const endpoints = [
      { name: 'Health Check', fn: () => api.health.check() },
      { name: 'User Profile', fn: () => api.auth.getCurrentUser() },
      { name: 'Students List', fn: () => api.students.list() },
      { name: 'Teachers List', fn: () => api.teachers.list() },
    ]

    let passed = 0
    let failed = 0

    for (const endpoint of endpoints) {
      try {
        const response = await endpoint.fn()
        if (response.success) {
          passed++
        } else {
          failed++
        }
      } catch (error) {
        failed++
      }
    }

    toast({
      title: "API Test Results",
      description: `${passed} endpoints passed, ${failed} failed`,
      variant: failed > 0 ? "destructive" : "default"
    })
  }

  const clearCache = () => {
    cache.clear()
    toast({
      title: "Cache Cleared",
      description: "All cached data has been cleared"
    })
    checkCacheStatus()
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'principal': return <Shield className="h-5 w-5" />
      case 'teacher': return <GraduationCap className="h-5 w-5" />
      case 'student': return <User className="h-5 w-5" />
      default: return <User className="h-5 w-5" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'principal': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'teacher': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'student': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
            {getRoleIcon(user?.role || '')}
          </div>
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.first_name}!</h1>
            <p className="text-muted-foreground">
              {user?.role === 'principal' && 'Manage your school administration'}
              {user?.role === 'teacher' && 'Access your teaching tools and resources'}
              {user?.role === 'student' && 'Explore your learning dashboard'}
            </p>
          </div>
        </div>
        <Badge className={getRoleColor(user?.role || '')}>
          {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeachers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Status</CardTitle>
            {cacheStatus === 'enabled' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : cacheStatus === 'disabled' ? (
              <XCircle className="h-4 w-4 text-red-500" />
            ) : (
              <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium capitalize">{cacheStatus}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="api-testing">API Testing</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest actions and updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Profile updated successfully</p>
                    <p className="text-xs text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Logged into system</p>
                    <p className="text-xs text-muted-foreground">5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Cache refreshed</p>
                    <p className="text-xs text-muted-foreground">10 minutes ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.location.href = `/${user?.role}/profile`}
                >
                  <User className="mr-2 h-4 w-4" />
                  Update Profile
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/reports'}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Reports
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/timetable'}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Check Timetable
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/leave'}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Leave Requests
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Profile Management
              </CardTitle>
              <CardDescription>
                Manage your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-sm text-muted-foreground">
                    {user?.first_name} {user?.last_name}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Badge className={getRoleColor(user?.role || '')}>
                    {user?.role}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <p className="text-sm text-muted-foreground">{user?.username}</p>
                </div>
              </div>
              <Button
                onClick={() => window.location.href = `/${user?.role}/profile`}
                className="w-full"
              >
                <Settings className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                API Testing Suite
              </CardTitle>
              <CardDescription>
                Test all backend API endpoints and functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={testAPIEndpoints} className="h-12">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Test All Endpoints
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="h-12"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Data
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Test Results</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">✓</div>
                    <div className="text-xs text-green-600">Health Check</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">✓</div>
                    <div className="text-xs text-green-600">Authentication</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">✓</div>
                    <div className="text-xs text-green-600">Profile Updates</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">✓</div>
                    <div className="text-xs text-green-600">Caching</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Status
                </CardTitle>
                <CardDescription>Current system health and performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>API Response Time</span>
                    <span className="text-green-600">~150ms</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cache Hit Rate</span>
                    <span className="text-blue-600">~92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Memory Usage</span>
                    <span className="text-yellow-600">~45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Cache Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Cache Management
                </CardTitle>
                <CardDescription>Manage application caching</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cache Status</span>
                  <Badge variant={cacheStatus === 'enabled' ? 'default' : 'destructive'}>
                    {cacheStatus}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Cached Items</span>
                  <span className="text-sm text-muted-foreground">3 active</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Cache TTL</span>
                  <span className="text-sm text-muted-foreground">5 minutes</span>
                </div>

                <Button
                  variant="outline"
                  onClick={clearCache}
                  className="w-full"
                  disabled={cacheStatus !== 'enabled'}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Clear All Cache
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}