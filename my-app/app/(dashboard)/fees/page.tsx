import { FeesManagement } from "@/components/fees-management"

export default function FeesPage() {
  return (
    <div className="flex-1 container mx-auto px-4 py-8">
      <FeesManagement userRole="principal" />
    </div>
  )
}