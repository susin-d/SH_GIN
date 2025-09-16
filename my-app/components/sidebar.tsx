"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  BarChart3,
  BookOpen,
  Calendar,
  DollarSign,
  GraduationCap,
  Home,
  LogOut,
  Settings,
  Users,
  UserCheck,
  FileText,
  Clock,
  User,
  Plus,
  Eye,
  Edit,
  Send,
} from "lucide-react"

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    roles: ["principal", "teacher", "student"],
  },
  {
    title: "Students",
    icon: GraduationCap,
    roles: ["principal"],
    children: [
      { title: "All Students", url: "/students", icon: GraduationCap },
      { title: "Add Student", url: "/students/add", icon: Users },
      { title: "Admissions", url: "/students/admissions", icon: FileText },
    ],
  },
  {
    title: "My Classes",
    icon: BookOpen,
    roles: ["teacher"],
    children: [
      { title: "Student List", url: "/teacher/classes/students", icon: Users },
      { title: "Timetable", url: "/teacher/classes/timetable", icon: Calendar },
      { title: "Assignments", url: "/teacher/classes/assignments", icon: FileText },
    ],
  },
  {
    title: "Attendance",
    icon: UserCheck,
    roles: ["teacher"],
    children: [
      { title: "Take Attendance", url: "/teacher/attendance/take", icon: UserCheck },
      { title: "View Attendance", url: "/teacher/attendance/view", icon: BarChart3 },
    ],
  },
  {
    title: "Assignments & Homework",
    icon: FileText,
    roles: ["teacher"],
    children: [
      { title: "All Assignments", url: "/teacher/assignments", icon: FileText },
      { title: "Create Assignment", url: "/teacher/assignments/create", icon: Plus },
      { title: "Submissions", url: "/teacher/assignments/submissions", icon: Eye },
    ],
  },
  {
    title: "Examinations",
    icon: FileText,
    roles: ["teacher"],
    children: [
      { title: "Enter Marks", url: "/teacher/examinations/enter-marks", icon: Edit },
      { title: "View Results", url: "/teacher/examinations/results", icon: BarChart3 },
    ],
  },
  {
    title: "Communication",
    icon: FileText,
    roles: ["teacher"],
    children: [
      { title: "Announcements", url: "/teacher/communication/announcements", icon: FileText },
      { title: "Parent Communication", url: "/teacher/communication/parents", icon: Send },
    ],
  },
  {
    title: "My Timetable",
    url: "/teacher/timetable",
    icon: Clock,
    roles: ["teacher"],
  },
  {
    title: "Teachers",
    icon: UserCheck,
    roles: ["principal"],
    children: [
      { title: "All Teachers", url: "/teachers", icon: UserCheck },
      { title: "Add Teacher", url: "/teachers/add", icon: Users },
      { title: "Teacher Timetables", url: "/teachers/timetables", icon: Calendar },
    ],
  },
  {
    title: "Classes",
    icon: BookOpen,
    roles: ["principal"],
    children: [
      { title: "All Classes", url: "/classes", icon: BookOpen },
      { title: "Manage Timetable", url: "/classes/timetable", icon: Calendar },
    ],
  },
  {
    title: "Attendance",
    icon: UserCheck,
    roles: ["principal"],
    children: [
      { title: "Student Attendance", url: "/attendance/students", icon: UserCheck },
      { title: "Staff Attendance", url: "/attendance/staff", icon: Users },
    ],
  },
  {
    title: "Examinations",
    icon: FileText,
    roles: ["principal"],
    children: [
      { title: "Exam Schedule", url: "/examinations/schedule", icon: Calendar },
      { title: "Results", url: "/examinations/results", icon: BarChart3 },
    ],
  },
  {
    title: "Announcements",
    icon: FileText,
    roles: ["principal"],
    children: [
      { title: "All Announcements", url: "/announcements", icon: FileText },
      { title: "Create Announcement", url: "/announcements/create", icon: FileText },
    ],
  },
  {
    title: "Reports",
    icon: BarChart3,
    roles: ["principal"],
    children: [
      { title: "Student Reports", url: "/reports/students", icon: BarChart3 },
      { title: "Financial Reports", url: "/reports/financial", icon: DollarSign },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    roles: ["principal"],
    children: [
      { title: "School Information", url: "/settings/school", icon: Settings },
      { title: "User Management", url: "/settings/users", icon: Users },
    ],
  },
]

const profileItems = [
  {
    title: "My Profile",
    url: "/principal/profile",
    roles: ["principal"],
  },
  {
    title: "My Profile",
    url: "/teacher/profile",
    roles: ["teacher"],
  },
  {
    title: "My Profile",
    url: "/student/profile",
    roles: ["student"],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [openItems, setOpenItems] = React.useState<string[]>([])

  const handleLogout = async () => {
    await logout()
  }

  const toggleItem = (title: string) => {
    setOpenItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const filteredNavigationItems = navigationItems.filter(item =>
    user?.role && item.roles.includes(user.role)
  )

  const filteredProfileItems = profileItems.filter(item =>
    user?.role && item.roles.includes(user.role)
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">School Portal</span>
            <span className="truncate text-xs text-muted-foreground">Management System</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.children ? (
                    <>
                      <SidebarMenuButton
                        onClick={() => toggleItem(item.title)}
                        tooltip={item.title}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                      {openItems.includes(item.title) && (
                        <SidebarMenuSub>
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.title}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === child.url}
                              >
                                <Link href={child.url}>
                                  <child.icon className="h-4 w-4" />
                                  <span>{child.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.title}
                    >
                      <Link href={item.url || "#"}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredProfileItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <User className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Logout"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}