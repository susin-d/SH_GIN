"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useCachedApi } from "@/lib/cache-context"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, User, Mail, Phone, MapPin, Calendar, Save } from "lucide-react"

interface StudentProfile {
  user: {
    id: number
    username: string
    first_name: string
    last_name: string
    email: string
  }
  school_class: string
  profile?: {
    phone?: string
    address?: string
    date_of_birth?: string
    gender?: string
    emergency_contact?: string
    emergency_phone?: string
    blood_group?: string
    nationality?: string
    religion?: string
    aadhar_number?: string
    pan_number?: string
    marital_status?: string
    languages_known?: string
    medical_conditions?: string
    alternate_phone?: string
    whatsapp_number?: string
    personal_email?: string
    permanent_address?: string
    city?: string
    state?: string
    pincode?: string
    country?: string
  }
}

export default function StudentProfilePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<StudentProfile>>({})

  const { execute: fetchProfile, isLoading, invalidate: invalidateCache } = useCachedApi<StudentProfile>(
    async () => {
      const response = await api.students.get(user?.id || 0)
      return {
        success: response.success,
        data: response.data as StudentProfile,
        message: response.message
      }
    },
    `student_profile_${user?.id || 0}`,
    5 * 60 * 1000 // 5 minutes
  )

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    const data = await fetchProfile()
    if (data) {
      setProfile(data)
      setFormData(data)
    } else {
      toast({ variant: "destructive", title: "Error", description: "Failed to load profile" })
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleProfileChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value
      }
    }))
  }

  const handleSave = async () => {
    if (!user || !formData) return

    setIsSaving(true)
    try {
      const payload = {
        user: {
          first_name: formData.user?.first_name || "",
          last_name: formData.user?.last_name || "",
          email: formData.user?.email || "",
          profile: {
            phone: formData.profile?.phone || null,
            address: formData.profile?.address || null,
            date_of_birth: formData.profile?.date_of_birth || null,
            gender: formData.profile?.gender || null,
            blood_group: formData.profile?.blood_group || null,
          }
        },
        school_class: formData.school_class || "",
      }

      const response = await api.students.update(user.id, payload)
      if (response.success) {
        toast({ title: "Success", description: "Profile updated successfully" })
        // Invalidate cache and refresh data
        invalidateCache()
        loadProfile()
      } else {
        toast({ variant: "destructive", title: "Error", description: response.message || "Failed to update profile" })
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile" })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.user?.first_name || ""}
                  onChange={(e) => handleInputChange("user.first_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.user?.last_name || ""}
                  onChange={(e) => handleInputChange("user.last_name", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.user?.email || ""}
                onChange={(e) => handleInputChange("user.email", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="school_class">Class</Label>
              <Input
                id="school_class"
                value={formData.school_class || ""}
                onChange={(e) => handleInputChange("school_class", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Profile Picture & Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-12 w-12 text-white" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">{profile.user.first_name} {profile.user.last_name}</h3>
                <p className="text-sm text-muted-foreground">{profile.user.username}</p>
                <p className="text-sm text-muted-foreground">Class {profile.school_class}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>
            Optional details for your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              <Input
                id="phone"
                value={formData.profile?.phone || ""}
                onChange={(e) => handleProfileChange("phone", e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date of Birth
              </Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.profile?.date_of_birth || ""}
                onChange={(e) => handleProfileChange("date_of_birth", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </Label>
            <Textarea
              id="address"
              value={formData.profile?.address || ""}
              onChange={(e) => handleProfileChange("address", e.target.value)}
              placeholder="Enter your address"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={formData.profile?.gender || ""} onValueChange={(value) => handleProfileChange("gender", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="blood_group">Blood Group</Label>
              <Select value={formData.profile?.blood_group || ""} onValueChange={(value) => handleProfileChange("blood_group", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}