"use client"

import { useState, useEffect, useMemo } from "react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Loader2, KeyRound, Users, GraduationCap, Shield, Search } from "lucide-react"
import type { User } from "@/lib/auth-context"

// Define more specific types for data from the API
interface Student {
  user: User
  school_class: string
}

interface Teacher {
  user: User
  profile?: { subject?: string }
}

// Grouped student data structure
type StudentsByClass = Record<string, Student[]>

export function UserManagement() {
  const { toast } = useToast()
  
  const [students, setStudents] = useState<Student[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [otherUsers, setOtherUsers] = useState<User[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- Data Fetching ---
  const fetchAllUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [studentsRes, teachersRes, usersRes] = await Promise.all([
        api.students.list(),
        api.teachers.list(),
        api.users.list(),
      ])

      if (!studentsRes.success || !teachersRes.success || !usersRes.success) {
        throw new Error("Failed to fetch all user types.")
      }

      setStudents(studentsRes.data)
      setTeachers(teachersRes.data)

      // Filter out users that are already in the student or teacher lists
      const studentUserIds = new Set(studentsRes.data.map((s: Student) => s.user.id))
      const teacherUserIds = new Set(teachersRes.data.map((t: Teacher) => t.user.id))
      setOtherUsers(
        usersRes.data.filter(
          (u: User) => !studentUserIds.has(u.id) && !teacherUserIds.has(u.id)
        )
      )

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAllUsers()
  }, [])

  // --- Dialog and Form Handlers ---
  const handleOpenDialog = (user: User) => {
    setSelectedUser(user)
    setNewUsername(user.username)
    setNewPassword("")
  }

  const handleCloseDialog = () => setSelectedUser(null)

  const handleCredentialsChange = async () => {
    if (!selectedUser) return;
    const payload: { username?: string; password?: string } = {};
    if (newUsername && newUsername !== selectedUser.username) payload.username = newUsername;
    if (newPassword) payload.password = newPassword;
    if (Object.keys(payload).length === 0) {
      toast({ title: "No Changes", description: "No new username or password was provided." });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.admin.updateUser(selectedUser.id, payload);
      if (response.success) {
        toast({ title: "Success", description: response.data.message });
        handleCloseDialog();
        fetchAllUsers(); // Refresh all user lists
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- Filtering and Grouping Logic ---
  const studentsByClass = useMemo(() => {
    return students.reduce((acc, student) => {
      const className = student.school_class || "Unassigned"
      if (!acc[className]) acc[className] = []
      acc[className].push(student)
      return acc
    }, {} as StudentsByClass)
  }, [students])

  const filterUser = (user: User) => 
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase());

  const filteredTeachers = useMemo(() => teachers.filter(t => filterUser(t.user)), [teachers, searchTerm]);
  const filteredOthers = useMemo(() => otherUsers.filter(filterUser), [otherUsers, searchTerm]);
  
  const getFilteredClassCount = (className: string) => {
    return studentsByClass[className]?.filter(s => filterUser(s.user)).length || 0;
  }
  const totalFilteredStudents = Object.keys(studentsByClass).reduce((acc, className) => acc + getFilteredClassCount(className), 0);

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <Dialog open={!!selectedUser} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Credentials for {selectedUser?.username}</DialogTitle>
            <DialogDescription>
              Update the username or password. Leave a field blank to keep it unchanged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-username">Username</Label>
              <Input id="new-username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank to keep current password" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
            <Button onClick={handleCredentialsChange} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>User Account Management</CardTitle>
          <CardDescription>View all users grouped by role and manage their credentials.</CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          
          <Accordion type="multiple" defaultValue={["students", "teachers"]} className="w-full">
            
            <AccordionItem value="students">
              <AccordionTrigger className="text-xl font-bold">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-6 w-6" />
                  Students ({totalFilteredStudents})
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-4 border-l ml-4 space-y-4">
                {Object.keys(studentsByClass).sort().map(className => {
                  const filteredStudents = studentsByClass[className].filter(s => filterUser(s.user));
                  if (filteredStudents.length === 0 && searchTerm) return null; // Hide if search doesn't match
                  return (
                    <div key={className}>
                      <h4 className="font-semibold text-md mb-2">Class {className}</h4>
                      {filteredStudents.map(({ user }) => (
                        <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg mb-2">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{user.first_name[0]}{user.last_name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.first_name} {user.last_name}</p>
                              <p className="text-sm text-muted-foreground">{user.username}</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleOpenDialog(user)}>
                            <KeyRound className="h-4 w-4 mr-2" /> Edit Credentials
                          </Button>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="teachers">
              <AccordionTrigger className="text-xl font-bold">
                <div className="flex items-center gap-3">
                  <Users className="h-6 w-6" />
                  Teachers ({filteredTeachers.length})
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-4 border-l ml-4 space-y-2">
                {filteredTeachers.map(({ user }) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar><AvatarFallback>{user.first_name[0]}{user.last_name[0]}</AvatarFallback></Avatar>
                      <div>
                        <p className="font-medium">{user.first_name} {user.last_name}</p>
                        <p className="text-sm text-muted-foreground">{user.username}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(user)}>
                      <KeyRound className="h-4 w-4 mr-2" /> Edit Credentials
                    </Button>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="other-staff">
              <AccordionTrigger className="text-xl font-bold">
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6" />
                  Other Staff ({filteredOthers.length})
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-4 border-l ml-4 space-y-2">
                {filteredOthers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar><AvatarFallback>{user.first_name[0]}{user.last_name[0]}</AvatarFallback></Avatar>
                      <div>
                        <p className="font-medium">{user.first_name} {user.last_name}</p>
                        <p className="text-sm text-muted-foreground">{user.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <Badge variant="secondary">{user.role}</Badge>
                       <Button variant="outline" size="sm" onClick={() => handleOpenDialog(user)}>
                         <KeyRound className="h-4 w-4 mr-2" /> Edit Credentials
                       </Button>
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {searchTerm && totalFilteredStudents === 0 && filteredTeachers.length === 0 && filteredOthers.length === 0 && (
            <div className="text-center text-muted-foreground mt-8 py-8">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold">No users found</h3>
              <p className="mt-1 text-sm">Your search for "{searchTerm}" did not match any users.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}