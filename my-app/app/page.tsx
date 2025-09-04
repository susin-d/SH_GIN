"use client"

import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import { PrincipalDashboard } from "@/components/principal-dashboard"
import { TeacherDashboard } from "@/components/teacher-dashboard"
import { StudentDashboard } from "@/components/student-dashboard"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, GraduationCap, Heart } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

function Dashboard() {
  const { user, logout } = useAuth()
  const { toast } = useToast()

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

  if (!user) return null

  const getRoleColor = (role: string) => {
    switch (role) {
      case "principal":
        return "bg-purple-100 text-purple-800"
      case "teacher":
        return "bg-blue-100 text-blue-800"
      case "student":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">School Portal</h1>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>

            <div className="flex items-center space-x-4">
               <div className="flex items-center space-x-3">
                 <Avatar className="h-8 w-8">
                   <AvatarImage src="/placeholder.svg" alt={`${user.first_name} ${user.last_name}` || "User"} />
                   <AvatarFallback>
                     {user.first_name && user.last_name
                       ? `${user.first_name[0]}${user.last_name[0]}`
                       : "U"}
                   </AvatarFallback>
                 </Avatar>
                 <div className="hidden sm:block">
                   <div className="text-sm font-medium text-gray-900">{`${user.first_name} ${user.last_name}` || "User"}</div>
                   <div className="text-xs text-gray-500">{user.email || "No email"}</div>
                 </div>
               </div>

               <Button variant="enhanced" size="sm" onClick={handleHealthCheck}>
                 <Heart className="h-4 w-4 mr-2" />
                 Health Check
               </Button>

               <Button variant="outline" size="sm" onClick={logout}>
                 <LogOut className="h-4 w-4 mr-2" />
                 Logout
               </Button>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Hello, {`${user.first_name} ${user.last_name}` || "User"}!</h2>
          <p className="text-gray-600 mt-1">
            {user.role === "principal" && "Welcome to your administrative dashboard"}
            {user.role === "teacher" && "Welcome to your teaching dashboard"}
            {user.role === "student" && "Welcome to your student portal"}
          </p>
        </div>

        {user.role === "principal" && <PrincipalDashboard />}
        {user.role === "teacher" && <TeacherDashboard />}
        {user.role === "student" && <StudentDashboard />}
      </main>
    </div>
  )
}

export default function HomePage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return user ? <Dashboard /> : <LoginForm />
}
