"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DollarSign,
  CreditCard,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
  Plus,
  Download,
  Send,
  Eye,
  Edit,
  Users,
} from "lucide-react"

// Mock data for fees
const mockFeeStats = {
  totalCollected: 125000,
  totalPending: 35000,
  totalOverdue: 8500,
  collectionRate: 88.5,
}

const mockFeeStructure = [
  { id: 1, name: "Tuition Fee", amount: 2500, frequency: "Monthly", category: "Academic" },
  { id: 2, name: "Library Fee", amount: 150, frequency: "Semester", category: "Academic" },
  { id: 3, name: "Lab Fee", amount: 300, frequency: "Semester", category: "Academic" },
  { id: 4, name: "Sports Fee", amount: 200, frequency: "Annual", category: "Activities" },
  { id: 5, name: "Transport Fee", amount: 400, frequency: "Monthly", category: "Transport" },
]

const mockStudentFees = [
  {
    id: 1,
    studentName: "Alice Johnson",
    studentId: "STU001",
    class: "10-A",
    totalDue: 3200,
    totalPaid: 2800,
    status: "partial",
    dueDate: "2024-01-15",
  },
  {
    id: 2,
    studentName: "Bob Smith",
    studentId: "STU002",
    class: "10-A",
    totalDue: 3200,
    totalPaid: 3200,
    status: "paid",
    dueDate: "2024-01-15",
  },
  {
    id: 3,
    studentName: "Carol Davis",
    studentId: "STU003",
    class: "10-B",
    totalDue: 3200,
    totalPaid: 0,
    status: "pending",
    dueDate: "2024-01-15",
  },
  {
    id: 4,
    studentName: "David Wilson",
    studentId: "STU004",
    class: "9-A",
    totalDue: 3200,
    totalPaid: 1600,
    status: "overdue",
    dueDate: "2024-01-10",
  },
]

const mockMyFees = [
  {
    id: 1,
    feeName: "Tuition Fee - January",
    amount: 2500,
    dueDate: "2024-01-15",
    status: "paid",
    paidDate: "2024-01-12",
    category: "Academic",
  },
  {
    id: 2,
    feeName: "Library Fee - Spring Semester",
    amount: 150,
    dueDate: "2024-01-20",
    status: "pending",
    paidDate: null,
    category: "Academic",
  },
  {
    id: 3,
    feeName: "Lab Fee - Spring Semester",
    amount: 300,
    dueDate: "2024-01-25",
    status: "pending",
    paidDate: null,
    category: "Academic",
  },
  {
    id: 4,
    feeName: "Transport Fee - January",
    amount: 400,
    dueDate: "2024-01-30",
    status: "overdue",
    paidDate: null,
    category: "Transport",
  },
]

const mockPaymentHistory = [
  {
    id: 1,
    date: "2024-01-12",
    description: "Tuition Fee - January",
    amount: 2500,
    method: "Online Banking",
    status: "completed",
  },
  {
    id: 2,
    date: "2023-12-15",
    description: "Tuition Fee - December",
    amount: 2500,
    method: "Credit Card",
    status: "completed",
  },
  {
    id: 3,
    date: "2023-12-10",
    description: "Sports Fee - Annual",
    amount: 200,
    method: "Cash",
    status: "completed",
  },
]

interface FeesManagementProps {
  userRole: "principal" | "teacher" | "student"
}

export function FeesManagement({ userRole }: FeesManagementProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      case "partial":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Academic":
        return "bg-blue-100 text-blue-800"
      case "Activities":
        return "bg-green-100 text-green-800"
      case "Transport":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Principal view - full fees management
  if (userRole === "principal") {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Fees Management</h3>
          <p className="text-sm text-muted-foreground">Manage school fees and payment tracking</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${mockFeeStats.totalCollected.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This academic year</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${mockFeeStats.totalPending.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Awaiting payment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${mockFeeStats.totalOverdue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Past due date</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockFeeStats.collectionRate}%</div>
              <p className="text-xs text-muted-foreground">Payment success rate</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="structure">Fee Structure</TabsTrigger>
            <TabsTrigger value="students">Student Fees</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Status Distribution</CardTitle>
                  <CardDescription>Overview of payment statuses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Paid</span>
                      <span className="text-sm font-medium">65%</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Pending</span>
                      <span className="text-sm font-medium">25%</span>
                    </div>
                    <Progress value={25} className="h-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Overdue</span>
                      <span className="text-sm font-medium">10%</span>
                    </div>
                    <Progress value={10} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common fee management tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-20 flex-col bg-transparent">
                      <Plus className="h-6 w-6 mb-2" />
                      Add Fee Type
                    </Button>
                    <Button variant="outline" className="h-20 flex-col bg-transparent">
                      <Send className="h-6 w-6 mb-2" />
                      Send Reminders
                    </Button>
                    <Button variant="outline" className="h-20 flex-col bg-transparent">
                      <FileText className="h-6 w-6 mb-2" />
                      Generate Report
                    </Button>
                    <Button variant="outline" className="h-20 flex-col bg-transparent">
                      <Download className="h-6 w-6 mb-2" />
                      Export Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="structure" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-lg font-medium">Fee Structure</h4>
                <p className="text-sm text-muted-foreground">Manage fee types and amounts</p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Fee Type
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {mockFeeStructure.map((fee, index) => (
                    <div key={fee.id} className={`p-4 ${index !== mockFeeStructure.length - 1 ? "border-b" : ""}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium">{fee.name}</p>
                            <p className="text-sm text-muted-foreground">{fee.frequency}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge className={getCategoryColor(fee.category)}>{fee.category}</Badge>
                          <div className="text-right">
                            <p className="font-medium">${fee.amount}</p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <div>
              <h4 className="text-lg font-medium">Student Fee Status</h4>
              <p className="text-sm text-muted-foreground">Track individual student payments</p>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {mockStudentFees.map((student, index) => (
                    <div key={student.id} className={`p-4 ${index !== mockStudentFees.length - 1 ? "border-b" : ""}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarImage src={`/diverse-student.png?height=40&width=40&query=student-${student.id}`} />
                            <AvatarFallback>
                              {student.studentName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.studentName}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.studentId} • Class {student.class}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              ${student.totalPaid} / ${student.totalDue}
                            </p>
                            <p className="text-xs text-muted-foreground">Due: {student.dueDate}</p>
                          </div>
                          <Badge className={getStatusColor(student.status)}>{student.status}</Badge>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div>
              <h4 className="text-lg font-medium">Fee Reports</h4>
              <p className="text-sm text-muted-foreground">Generate comprehensive fee reports</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Collection Reports</CardTitle>
                  <CardDescription>Payment collection analytics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    Monthly Collection Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Users className="h-4 w-4 mr-2" />
                    Student-wise Fee Status
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Overdue Payments Report
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financial Reports</CardTitle>
                  <CardDescription>Financial analysis and projections</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Revenue Analysis
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Calendar className="h-4 w-4 mr-2" />
                    Quarterly Summary
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Export All Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // Teacher view - limited fees access
  if (userRole === "teacher") {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Student Fees</h3>
          <p className="text-sm text-muted-foreground">View fee status for students in your classes</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Students' Fee Status</CardTitle>
            <CardDescription>Fee payment status for students in your classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockStudentFees.slice(0, 3).map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={`/diverse-student.png?height=40&width=40&query=student-${student.id}`} />
                      <AvatarFallback>
                        {student.studentName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-sm text-muted-foreground">Class {student.class}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        ${student.totalPaid} / ${student.totalDue}
                      </p>
                      <p className="text-xs text-muted-foreground">Due: {student.dueDate}</p>
                    </div>
                    <Badge className={getStatusColor(student.status)}>{student.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Student view - personal fees
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">My Fees</h3>
        <p className="text-sm text-muted-foreground">View and manage your fee payments</p>
      </div>

      {/* Student Fee Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Due</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,350</div>
            <p className="text-xs text-muted-foreground">Current semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">$2,500</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">$400</div>
            <p className="text-xs text-muted-foreground">Past due</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current Fees</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="payment">Make Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Fees</CardTitle>
              <CardDescription>Your current fee obligations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockMyFees.map((fee) => (
                  <div key={fee.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{fee.feeName}</p>
                      <p className="text-sm text-muted-foreground">Due: {fee.dueDate}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getCategoryColor(fee.category)}>{fee.category}</Badge>
                      <div className="text-right">
                        <p className="font-medium">${fee.amount}</p>
                      </div>
                      <Badge className={getStatusColor(fee.status)}>{fee.status}</Badge>
                      {fee.status !== "paid" && (
                        <Button size="sm" variant="outline">
                          <CreditCard className="h-4 w-4 mr-1" />
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Your previous fee payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPaymentHistory.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{payment.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.date} • {payment.method}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">${payment.amount}</p>
                      </div>
                      <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Receipt
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Make Payment</CardTitle>
              <CardDescription>Pay your outstanding fees online</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input id="amount" placeholder="Enter amount" />
                </div>
                <div>
                  <Label htmlFor="method">Payment Method</Label>
                  <Input id="method" placeholder="Credit Card" />
                </div>
              </div>
              <div className="flex space-x-4">
                <Button className="flex-1">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay with Card
                </Button>
                <Button variant="outline" className="flex-1 bg-transparent">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Bank Transfer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
