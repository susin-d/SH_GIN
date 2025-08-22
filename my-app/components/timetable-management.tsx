"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Users, Plus, Edit, Trash2, Eye } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

// Mock timetable data
const mockTimetableData = {
  Monday: [
    { time: "09:00-09:50", subject: "Mathematics", teacher: "Mr. David Chen", room: "Room 101", class: "10-A" },
    { time: "10:00-10:50", subject: "Physics", teacher: "Dr. Sarah Johnson", room: "Lab 1", class: "10-A" },
    { time: "11:00-11:50", subject: "English", teacher: "Ms. Emily Davis", room: "Room 203", class: "10-A" },
    { time: "13:00-13:50", subject: "Chemistry", teacher: "Dr. Michael Brown", room: "Lab 2", class: "10-A" },
    { time: "14:00-14:50", subject: "History", teacher: "Mr. James Wilson", room: "Room 105", class: "10-A" },
  ],
  Tuesday: [
    { time: "09:00-09:50", subject: "Physics", teacher: "Dr. Sarah Johnson", room: "Lab 1", class: "10-A" },
    { time: "10:00-10:50", subject: "Mathematics", teacher: "Mr. David Chen", room: "Room 101", class: "10-A" },
    { time: "11:00-11:50", subject: "History", teacher: "Mr. James Wilson", room: "Room 105", class: "10-A" },
    { time: "13:00-13:50", subject: "English", teacher: "Ms. Emily Davis", room: "Room 203", class: "10-A" },
    { time: "14:00-14:50", subject: "Chemistry", teacher: "Dr. Michael Brown", room: "Lab 2", class: "10-A" },
  ],
  Wednesday: [
    { time: "09:00-09:50", subject: "Chemistry", teacher: "Dr. Michael Brown", room: "Lab 2", class: "10-A" },
    { time: "10:00-10:50", subject: "English", teacher: "Ms. Emily Davis", room: "Room 203", class: "10-A" },
    { time: "11:00-11:50", subject: "Mathematics", teacher: "Mr. David Chen", room: "Room 101", class: "10-A" },
    { time: "13:00-13:50", subject: "Physics", teacher: "Dr. Sarah Johnson", room: "Lab 1", class: "10-A" },
    { time: "14:00-14:50", subject: "History", teacher: "Mr. James Wilson", room: "Room 105", class: "10-A" },
  ],
  Thursday: [
    { time: "09:00-09:50", subject: "English", teacher: "Ms. Emily Davis", room: "Room 203", class: "10-A" },
    { time: "10:00-10:50", subject: "History", teacher: "Mr. James Wilson", room: "Room 105", class: "10-A" },
    { time: "11:00-11:50", subject: "Physics", teacher: "Dr. Sarah Johnson", room: "Lab 1", class: "10-A" },
    { time: "13:00-13:50", subject: "Mathematics", teacher: "Mr. David Chen", room: "Room 101", class: "10-A" },
    { time: "14:00-14:50", subject: "Chemistry", teacher: "Dr. Michael Brown", room: "Lab 2", class: "10-A" },
  ],
  Friday: [
    { time: "09:00-09:50", subject: "History", teacher: "Mr. James Wilson", room: "Room 105", class: "10-A" },
    { time: "10:00-10:50", subject: "Chemistry", teacher: "Dr. Michael Brown", room: "Lab 2", class: "10-A" },
    { time: "11:00-11:50", subject: "English", teacher: "Ms. Emily Davis", room: "Room 203", class: "10-A" },
    { time: "13:00-13:50", subject: "Physics", teacher: "Dr. Sarah Johnson", room: "Lab 1", class: "10-A" },
    { time: "14:00-14:50", subject: "Mathematics", teacher: "Mr. David Chen", room: "Room 101", class: "10-A" },
  ],
}

const mockRooms = [
  { id: 1, name: "Room 101", capacity: 35, type: "Classroom", available: true },
  { id: 2, name: "Room 102", capacity: 35, type: "Classroom", available: true },
  { id: 3, name: "Lab 1", capacity: 25, type: "Physics Lab", available: false },
  { id: 4, name: "Lab 2", capacity: 25, type: "Chemistry Lab", available: true },
  { id: 5, name: "Room 203", capacity: 40, type: "Classroom", available: true },
  { id: 6, name: "Room 105", capacity: 30, type: "Classroom", available: true },
]

const mockTeachers = [
  { id: 1, name: "Mr. David Chen", subject: "Mathematics", available: true },
  { id: 2, name: "Dr. Sarah Johnson", subject: "Physics", available: false },
  { id: 3, name: "Ms. Emily Davis", subject: "English", available: true },
  { id: 4, name: "Dr. Michael Brown", subject: "Chemistry", available: true },
  { id: 5, name: "Mr. James Wilson", subject: "History", available: true },
]

const timeSlots = ["09:00-09:50", "10:00-10:50", "11:00-11:50", "13:00-13:50", "14:00-14:50", "15:00-15:50"]

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

interface TimetableManagementProps {
  userRole: "principal" | "teacher" | "student"
}

interface ClassSlot {
  time: string
  subject: string
  teacher: string
  room: string
  class: string
}

interface TimetableData {
  [key: string]: ClassSlot[]
}

export function TimetableManagement({ userRole }: TimetableManagementProps) {
  const { user } = useAuth()
  const [selectedDay, setSelectedDay] = useState("Monday")
  const [selectedClass, setSelectedClass] = useState("10-A")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"weekly" | "daily">("weekly")
  const [formData, setFormData] = useState({
    day: "",
    time: "",
    subject: "",
    teacher: "",
    room: "",
    class: "",
  })

  const getSubjectColor = (subject: string) => {
    const colors = {
      Mathematics: "bg-blue-100 text-blue-800",
      Physics: "bg-purple-100 text-purple-800",
      Chemistry: "bg-green-100 text-green-800",
      English: "bg-orange-100 text-orange-800",
      History: "bg-red-100 text-red-800",
    }
    return colors[subject as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const handleAddClass = () => {
    console.log("Adding class:", formData)
    setFormData({ day: "", time: "", subject: "", teacher: "", room: "", class: "" })
    setIsDialogOpen(false)
  }

  const handleEditClass = (classData: ClassSlot) => {
    console.log("Editing class:", classData)
  }

  const handleDeleteClass = (classData: ClassSlot) => {
    console.log("Deleting class:", classData)
  }

  // Filter timetable based on user role
  const getFilteredTimetable = (): TimetableData => {
    if (userRole === "teacher") {
      // Filter to show only classes taught by this teacher
      const filtered: TimetableData = {}
      Object.keys(mockTimetableData).forEach((day) => {
        filtered[day] = mockTimetableData[day as keyof typeof mockTimetableData].filter(
          (slot) => slot.teacher === user?.name,
        )
      })
      return filtered
    }
    return mockTimetableData
  }

  const filteredTimetable = getFilteredTimetable()

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">
            {userRole === "principal" && "Timetable Management"}
            {userRole === "teacher" && "My Teaching Schedule"}
            {userRole === "student" && "Class Timetable"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {userRole === "principal" && "Create and manage school timetables"}
            {userRole === "teacher" && "View your teaching schedule and classroom assignments"}
            {userRole === "student" && "View your class schedule and room locations"}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10-A">Class 10-A</SelectItem>
              <SelectItem value="10-B">Class 10-B</SelectItem>
              <SelectItem value="11-A">Class 11-A</SelectItem>
              <SelectItem value="12-A">Class 12-A</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === "weekly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("weekly")}
            >
              Weekly
            </Button>
            <Button variant={viewMode === "daily" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("daily")}>
              Daily
            </Button>
          </div>

          {userRole === "principal" && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Class
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Class</DialogTitle>
                  <DialogDescription>Schedule a new class session in the timetable.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="day">Day</Label>
                      <Select value={formData.day} onValueChange={(value) => setFormData({ ...formData, day: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {weekDays.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time Slot</Label>
                      <Select
                        value={formData.time}
                        onValueChange={(value) => setFormData({ ...formData, time: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Enter subject name"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacher">Teacher</Label>
                    <Select
                      value={formData.teacher}
                      onValueChange={(value) => setFormData({ ...formData, teacher: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockTeachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.name}>
                            {teacher.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="room">Room</Label>
                    <Select value={formData.room} onValueChange={(value) => setFormData({ ...formData, room: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockRooms.map((room) => (
                          <SelectItem key={room.id} value={room.name}>
                            {room.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class">Class</Label>
                    <Input
                      id="class"
                      placeholder="Enter class name"
                      value={formData.class}
                      onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddClass}>Add Class</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs value={viewMode === "weekly" ? "weekly" : "daily"} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="weekly" onClick={() => setViewMode("weekly")}>
            Weekly View
          </TabsTrigger>
          <TabsTrigger value="daily" onClick={() => setViewMode("daily")}>
            Daily View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          {/* Weekly Timetable Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Timetable - {selectedClass}</CardTitle>
              <CardDescription>Complete weekly schedule overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-6 gap-2 min-w-[800px]">
                  {/* Header */}
                  <div className="font-medium text-center p-2 bg-muted rounded">Time</div>
                  {weekDays.map((day) => (
                    <div key={day} className="font-medium text-center p-2 bg-muted rounded">
                      {day}
                    </div>
                  ))}

                  {/* Time slots */}
                  {timeSlots.map((timeSlot) => (
                    <div key={timeSlot} className="contents">
                      <div className="text-sm font-medium text-center p-2 bg-muted/50 rounded">{timeSlot}</div>
                      {weekDays.map((day) => {
                        const classData = filteredTimetable[day]?.find((slot: ClassSlot) => slot.time === timeSlot)
                        return (
                          <div key={`${day}-${timeSlot}`} className="p-1">
                            {classData ? (
                              <div className={`p-2 rounded text-xs ${getSubjectColor(classData.subject)}`}>
                                <div className="font-medium">{classData.subject}</div>
                                <div className="text-xs opacity-75">{classData.teacher}</div>
                                <div className="text-xs opacity-75">{classData.room}</div>
                                {userRole === "principal" && (
                                  <div className="flex justify-end space-x-1 mt-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-5 w-5 p-0"
                                      onClick={() => handleEditClass(classData)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-5 w-5 p-0"
                                      onClick={() => handleDeleteClass(classData)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="p-2 border-2 border-dashed border-muted rounded text-center text-xs text-muted-foreground">
                                {userRole === "principal" ? "Add Class" : "Free"}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          {/* Daily View */}
          <div className="flex justify-center space-x-2 mb-4">
            {weekDays.map((day) => (
              <Button
                key={day}
                variant={selectedDay === day ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDay(day)}
              >
                {day}
              </Button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDay} Schedule - {selectedClass}
              </CardTitle>
              <CardDescription>Detailed daily schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTimetable[selectedDay]?.map((classData: ClassSlot, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-center min-w-[80px]">
                        <div className="font-medium">{classData.time.split("-")[0]}</div>
                        <div className="text-xs text-muted-foreground">{classData.time.split("-")[1]}</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={getSubjectColor(classData.subject)}>{classData.subject}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {classData.teacher}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {classData.room}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {userRole === "principal" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleEditClass(classData)}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteClass(classData)}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-muted-foreground">No classes scheduled for {selectedDay}</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resource Management (Principal Only) */}
      {userRole === "principal" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Room Management</CardTitle>
              <CardDescription>Manage classroom and lab availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockRooms.map((room) => (
                  <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{room.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {room.type} • Capacity: {room.capacity}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={room.available ? "default" : "secondary"}>
                        {room.available ? "Available" : "Occupied"}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Teacher Availability</CardTitle>
              <CardDescription>Monitor teaching staff schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockTeachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{teacher.name}</div>
                      <div className="text-sm text-muted-foreground">{teacher.subject}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={teacher.available ? "default" : "secondary"}>
                        {teacher.available ? "Available" : "Teaching"}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
