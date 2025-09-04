"use client"

import { useState, useEffect, useMemo } from "react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, UserPlus, Edit, Trash2, Search } from "lucide-react"

// --- TypeScript Interface for the Teacher object ---
interface Teacher {
  user: {
    id: number
    username: string
    first_name: string
    last_name: string
    email: string
  }
  profile?: {
    subject?: string
  }
}

// Initial state for the add/edit form
const INITIAL_FORM_STATE: Teacher = {
  user: { id: 0, username: "", first_name: "", last_name: "", email: "" },
  profile: { subject: "" },
}

export function TeacherManagement() {
  const { toast } = useToast()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Teacher>(INITIAL_FORM_STATE)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- Data Fetching ---
  const fetchTeachers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.teachers.list()
      if (response.success && Array.isArray(response.data)) {
        setTeachers(response.data)
      } else {
        throw new Error(response.message || "Failed to fetch teacher records.")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  // --- CRUD Handlers ---
  const handleAdd = () => {
    setIsEditing(false)
    setFormData(INITIAL_FORM_STATE)
    setIsDialogOpen(true)
  }

  const handleEdit = (teacher: Teacher) => {
    setIsEditing(true)
    setFormData({ ...teacher, profile: teacher.profile || { subject: "" } })
    setIsDialogOpen(true)
  }

  const handleDelete = async (teacherId: number) => {
    if (!window.confirm("Are you sure you want to delete this teacher? This action cannot be undone.")) return

    const response = await api.teachers.delete(teacherId)
    if (response.success) {
      toast({ title: "Success", description: "Teacher deleted successfully." })
      fetchTeachers() // Refresh the list
    } else {
      toast({ variant: "destructive", title: "Error", description: response.message || "Failed to delete teacher." })
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const payload = {
        user: {
          username: formData.user.username,
          first_name: formData.user.first_name,
          last_name: formData.user.last_name,
          email: formData.user.email,
        },
        profile: {
          subject: formData.profile?.subject,
        },
      }
      const response = isEditing
        ? await api.teachers.update(formData.user.id, payload)
        : await api.teachers.create(payload)

      if (response.success) {
        toast({ title: "Success", description: `Teacher ${isEditing ? 'updated' : 'created'} successfully.` })
        setIsDialogOpen(false)
        fetchTeachers()
      } else {
        throw new Error(response.message || "Failed to save teacher.")
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Form Input Handler ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const [field, subField] = name.split(".")
    setFormData((prev) => {
      if (subField === 'subject') {
        return { ...prev, profile: { ...(prev.profile || {}), subject: value } }
      }
      if (field === 'user') {
        return { ...prev, user: { ...prev.user, [subField]: value } }
      }
      return { ...prev, [name]: value }
    })
  }

  // --- Filtering Logic ---
  const filteredTeachers = useMemo(() => teachers.filter(teacher =>
    `${teacher.user.first_name} ${teacher.user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.user.username.toLowerCase().includes(searchTerm.toLowerCase())
  ), [teachers, searchTerm]);


  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the teacher's information below." : "Fill in the form to add a new teacher."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user.first_name">First Name</Label>
                <Input id="user.first_name" name="user.first_name" value={formData.user.first_name} onChange={handleFormChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user.last_name">Last Name</Label>
                <Input id="user.last_name" name="user.last_name" value={formData.user.last_name} onChange={handleFormChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user.username">Username</Label>
              <Input id="user.username" name="user.username" value={formData.user.username} onChange={handleFormChange} disabled={isEditing} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user.email">Email</Label>
              <Input id="user.email" name="user.email" type="email" value={formData.user.email} onChange={handleFormChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile.subject">Subject</Label>
              <Input id="profile.subject" name="profile.subject" value={formData.profile?.subject || ""} onChange={handleFormChange} placeholder="e.g., Mathematics" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Teacher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Teacher Management</CardTitle>
              <CardDescription>
                A directory of all {teachers.length} teachers currently on staff.
              </CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <UserPlus className="mr-2 h-4 w-4" /> Add Teacher
            </Button>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Username</TableHead>
                <TableHead className="hidden md:table-cell">Subject</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {teacher.user.first_name?.[0]}{teacher.user.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{teacher.user.first_name} {teacher.user.last_name}</div>
                          <div className="text-sm text-muted-foreground hidden md:inline">{teacher.user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{teacher.user.username}</TableCell>
                    <TableCell className="hidden md:table-cell">{teacher.profile?.subject || "N/A"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(teacher)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(teacher.user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    {searchTerm ? `No teachers found for "${searchTerm}".` : "No teachers found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}