import { TimetableManagement } from "@/components/timetable-management"

export default function TimetablePage() {
  return (
    <div className="flex-1 container mx-auto px-4 py-8">
      <TimetableManagement userRole="principal" />
    </div>
  )
}