"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { api } from "./api"

export type UserRole = "principal" | "teacher" | "student"

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  profile?: {
    phone?: string
    address?: string
    class_name?: string
    subject?: string
  }
  avatar?: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const mockUsers: User[] = [
  {
    id: 1,
    username: "principal",
    email: "principal@school.edu",
    first_name: "Sarah",
    last_name: "Johnson",
    role: "principal",
    avatar: "/professional-woman-principal.png",
  },
  {
    id: 2,
    username: "teacher",
    email: "teacher@school.edu",
    first_name: "David",
    last_name: "Chen",
    role: "teacher",
    avatar: "/male-teacher.png",
  },
  {
    id: 3,
    username: "student",
    email: "student@school.edu",
    first_name: "Emma",
    last_name: "Wilson",
    role: "student",
    avatar: "/diverse-female-student.png",
  },
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem("school-portal-user")
      const accessToken = localStorage.getItem("access_token")

      if (storedUser && accessToken) {
        try {
          // Validate token with Django API
          const response = await api.auth.getCurrentUser()
          if (response.success && response.data) {
            setUser(response.data)
          } else {
            // Token invalid, clear stored data
            localStorage.removeItem("school-portal-user")
            localStorage.removeItem("access_token")
            localStorage.removeItem("refresh_token")
          }
        } catch (error) {
          console.error("Auth validation failed:", error)
          // Clear stored data on error
          localStorage.removeItem("school-portal-user")
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
        }
      }
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      // Try Django API first
      const response = await api.auth.login(username, password)

      if (response.success && response.data) {
        const userData = response.data.user
        setUser(userData)
        localStorage.setItem("school-portal-user", JSON.stringify(userData))
        setIsLoading(false)
        return true
      } else {
        console.log("Django API login failed, trying mock authentication...")

        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Find user by username (simplified for demo)
        const foundUser = mockUsers.find((u) => u.username === username)

        if (foundUser && (password === "demo" || password === foundUser.username)) {
          setUser(foundUser)
          localStorage.setItem("school-portal-user", JSON.stringify(foundUser))
          setIsLoading(false)
          return true
        }

        setError(response.message || "Invalid credentials")
        setIsLoading(false)
        return false
      }
    } catch (error) {
      console.error("Login error:", error)

      console.log("Network error, trying mock authentication...")

      await new Promise((resolve) => setTimeout(resolve, 1000))

      const foundUser = mockUsers.find((u) => u.username === username)

      if (foundUser && (password === "demo" || password === foundUser.username)) {
        setUser(foundUser)
        localStorage.setItem("school-portal-user", JSON.stringify(foundUser))
        setIsLoading(false)
        return true
      }

      setError("Network error. Please check your connection.")
      setIsLoading(false)
      return false
    }
  }

  const logout = async () => {
    try {
      // Call Django logout endpoint
      await api.auth.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Clear local state regardless of API response
      setUser(null)
      localStorage.removeItem("school-portal-user")
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
    }
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading, error }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
