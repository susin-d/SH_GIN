"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, FileText, Plus, Check, X, Eye } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

// Mock leave data
const mockLeaveRequests = [
  {
    id: 1,
    applicantName: "Emma Wilson",
    applicantRole: "student",
    type: "sick",
    startDate: "2024-01-16",
    endDate: "2024-01-17",
    reason: "Fever and flu symptoms",
    status: "pending",
    submittedDate: "2024-01-15",
    approvedBy: null,
  },
  {
    id: 2,
    applicantName: "Mr. David Chen",
    applicantRole: "teacher",
    type: "personal",
    startDate: "2024-01-20",
    endDate: "2024-01-22",
    reason: "Family wedding ceremony",
    status: "approved",
    submittedDate: "2024-01-10",
    approvedBy: "Dr. Sarah Johnson",
  },
  {
    id: 3,
    applicantName: "Alice Johnson",
    applicantRole: "student",
    type: "emergency",
    startDate: "2024-01-18",
    endDate: "2024-01-18",
    reason: "Medical emergency in family",
    status: "approved",
    submittedDate: "2024-01-17",
    approvedBy: "Dr. Sarah Johnson",
  },
  {
    id: 4,
    applicantName: "Ms. Sarah Davis",
    applicantRole: "teacher",
    type: "sick",
    startDate: "2024-01-19",
    endDate: "2024-01-21",
    reason: "Doctor's appointment and recovery",
    status: "rejected",
    submittedDate: "2024-01-14",
    approvedBy: "Dr. Sarah Johnson",
  },
]

interface LeaveManagementProps {
  userRole: "principal" | "teacher" | "student"
}

export function LeaveManagement({ userRole }: LeaveManagementProps) {
  const { user } = useAuth()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState<any>(null)
  const [formData, setFormData] = useState({
    type: "",
    startDate: "",
    endDate: "",
    reason: "",
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "sick":
        return "bg-red-100 text-red-800"
      case "personal":
        return "bg-blue-100 text-blue-800"
      case "emergency":
        return "bg-orange-100 text-orange-800"
      case "vacation":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleSubmitLeave = () => {
    // Mock submission logic
    console.log("Submitting leave request:", formData)
    setFormData({ type: "", startDate: "", endDate: "", reason: "" })
    setIsDialogOpen(false)
    // In real app, this would make an API call
  }

  const handleApproveLeave = (leaveId: number) => {
    console.log("Approving leave:", leaveId)
    // Mock approval logic
  }

  const handleRejectLeave = (leaveId: number) => {
    console.log("Rejecting leave:", leaveId)
    // Mock rejection logic
  }

  // Filter requests based on user role
  const filteredRequests =
    userRole === "principal" ? mockLeaveRequests : mockLeaveRequests.filter((req) => req.applicantName === user?.name)

  const pendingRequests = filteredRequests.filter((req) => req.status === "pending")
  const approvedRequests = filteredRequests.filter((req) => req.status === "approved")
  const rejectedRequests = filteredRequests.filter((req) => req.status === "rejected")

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              {userRole === "principal" ? "All requests" : "Your requests"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedRequests.length}</div>
            <p className="text-xs text-muted-foreground">Approved requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <X className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedRequests.length}</div>
            <p className="text-xs text-muted-foreground">Rejected requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Leave Requests</h3>
          <p className="text-sm text-muted-foreground">
            {userRole === "principal"
              ? "Manage all leave requests from staff and students"
              : "View and manage your leave requests"}
          </p>
        </div>
        {userRole !== "principal" && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Request Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Submit Leave Request</DialogTitle>
                <DialogDescription>Fill out the form below to request time off.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Leave Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="personal">Personal Leave</SelectItem>
                      <SelectItem value="emergency">Emergency Leave</SelectItem>
                      <SelectItem value="vacation">Vacation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Please provide a reason for your leave request..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitLeave}>Submit Request</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Leave Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={`/placeholder-iyeva.png?key=user-${request.id}&height=40&width=40&query=${request.applicantRole}`}
                    />
                    <AvatarFallback>
                      {request.applicantName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{request.applicantName}</CardTitle>
                    <CardDescription>
                      {request.applicantRole.charAt(0).toUpperCase() + request.applicantRole.slice(1)} • Submitted on{" "}
                      {request.submittedDate}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Badge className={getTypeColor(request.type)}>
                    {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                  </Badge>
                  <Badge className={getStatusColor(request.status)}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-sm text-muted-foreground">
                      {request.startDate} to {request.endDate}
                    </p>
                  </div>
                  {request.approvedBy && (
                    <div>
                      <p className="text-sm font-medium">
                        {request.status === "approved" ? "Approved by" : "Reviewed by"}
                      </p>
                      <p className="text-sm text-muted-foreground">{request.approvedBy}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Reason</p>
                  <p className="text-sm text-muted-foreground">{request.reason}</p>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {Math.ceil(
                        (new Date(request.endDate).getTime() - new Date(request.startDate).getTime()) /
                          (1000 * 60 * 60 * 24),
                      ) + 1}{" "}
                      day(s)
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    {userRole === "principal" && request.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700 bg-transparent"
                          onClick={() => handleApproveLeave(request.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 bg-transparent"
                          onClick={() => handleRejectLeave(request.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Leave Requests</h3>
            <p className="text-muted-foreground mb-4">
              {userRole === "principal"
                ? "No leave requests have been submitted yet."
                : "You haven't submitted any leave requests yet."}
            </p>
            {userRole !== "principal" && (
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Submit Your First Request
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
