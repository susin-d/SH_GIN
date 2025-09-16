import { LeaveManagement } from "@/components/leave-management"

export default function LeavePage() {
  return (
    <div className="flex-1 container mx-auto px-4 py-8">
      <LeaveManagement userRole="principal" />
    </div>
  )
}