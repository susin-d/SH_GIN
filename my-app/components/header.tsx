"use client"

import { ThemeToggle } from "./theme-provider"
import { Button } from "./ui/button"
import { GraduationCap, LogOut } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function Header() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/20 dark:border-slate-700/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gradient-primary to-gradient-secondary shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-gradient-primary via-gradient-secondary to-gradient-primary bg-clip-text text-transparent">
                School Portal
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                Management System
              </p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold bg-gradient-to-r from-gradient-primary to-gradient-secondary bg-clip-text text-transparent">
                Portal
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {user && (
            <div className="hidden md:flex items-center space-x-3 text-sm bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-muted-foreground text-xs">Welcome,</span>
              </div>
              <span className="font-semibold text-foreground">{user.first_name} {user.last_name}</span>
              <span className="text-xs bg-gradient-to-r from-gradient-primary to-gradient-secondary text-white px-2 py-1 rounded-full font-medium shadow-sm">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <ThemeToggle />

            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2 border-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 transition-all duration-300 font-medium text-red-600 dark:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}