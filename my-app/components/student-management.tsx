"use client"

import { useState, useEffect, useMemo } from "react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

// Define the structure of a Student object based on your serializers
interface Student {
  user: {
    id: number
    username: string
    first_name: string
    last_name: string
    email: string
  }
  school_class: string
}

// Define the initial state for the form
const INITIAL_FORM_STATE: Student = {
  user: { id: 0, username: "", first_name: "", last_name: "", email: "" },
  school_class: "",
}

export function StudentManagement() {
  const { toast } = useToast()
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Student>(INITIAL_FORM_STATE)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- Data Fetching ---
  const fetchStudents = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.students.list()
      if (response.success && Array.isArray(response.data)) {
        setStudents(response.data)
      } else {
        throw new Error(response.message || "Failed to fetch student records.")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  // --- CRUD Handlers ---
  const handleAdd = () => {
    setIsEditing(false)
    setFormData(INITIAL_FORM_STATE)
    setIsDialogOpen(true)
  }

  const handleEdit = (student: Student) => {
    setIsEditing(true)
    setFormData(student)
    setIsDialogOpen(true)
  }

  const handleDelete = async (studentId: number) => {
    if (!window.confirm("Are you sure you want to delete this student? This action cannot be undone.")) return

    const response = await api.students.delete(studentId)
    if (response.success) {
      toast({ title: "Success", description: "Student deleted successfully." })
      fetchStudents() // Refresh the list from the database
    } else {
      toast({ variant: "destructive", title: "Error", description: response.message || "Failed to delete student." })
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
        school_class: formData.school_class,
      }
      const response = isEditing
        ? await api.students.update(formData.user.id, payload)
        : await api.students.create(payload)

      if (response.success) {
        toast({ title: "Success", description: `Student ${isEditing ? 'updated' : 'created'} successfully.` })
        setIsDialogOpen(false)
        fetchStudents()
      } else {
        throw new Error(response.message || "Failed to save student.")
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const [field, subField] = name.split(".")
    if (subField) {
      setFormData((prev) => ({ ...prev, [field]: { ...(prev as any)[field], [subField]: value } }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }
  
  // --- Filtering Logic ---
  const filteredStudents = useMemo(() => students.filter(student =>
    `${student.user.first_name} ${student.user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.user.username.toLowerCase().includes(searchTerm.toLowerCase())
  ), [students, searchTerm]);

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {/* ... (Dialog code is unchanged, it's already user-friendly) ... */}
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Student Management</CardTitle>
              <CardDescription>
                A directory of all {students.length} students currently enrolled.
              </CardDescription>
            </div>
            <Button onClick={handleAdd}>
              <UserPlus className="mr-2 h-4 w-4" /> Add Student
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
                <TableHead className="hidden md:table-cell">Class</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow key={student.user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {student.user.first_name?.[0]}{student.user.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{student.user.first_name} {student.user.last_name}</div>
                          <div className="text-sm text-muted-foreground hidden md:inline">{student.user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{student.user.username}</TableCell>
                    <TableCell className="hidden md:table-cell">{student.school_class}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(student)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(student.user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    {searchTerm ? `No students found for "${searchTerm}".` : "No students found."}
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