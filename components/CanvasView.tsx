import { AlertCircle, Rocket } from "lucide-react"
import type { MissionHistoryItem } from "@/lib/types"
import { MissionCard } from "./MissionCard"

interface CanvasViewProps {
  missions: MissionHistoryItem[]
  selectedMission: MissionHistoryItem | null
  onSelectMission: (mission: MissionHistoryItem) => void
  isError?: boolean
}

export function CanvasView({
  missions,
  selectedMission,
  onSelectMission,
  isError,
}: CanvasViewProps) {
  if (isError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 text-sm font-medium">Failed to load mission history</p>
          <p className="text-gray-500 text-xs mt-1">An unexpected error occurred</p>
        </div>
      </div>
    )
  }

  if (missions.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <Rocket className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Ready to Launch</p>
          <p className="text-gray-600 text-xs mt-1">
            No active missions. Click "New Mission" to get started
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-6 content-start">
      {missions.map((mission) => (
        <MissionCard
          key={mission.serviceId}
          mission={mission}
          isSelected={selectedMission?.serviceId === mission.serviceId}
          onClick={() => onSelectMission(mission)}
        />
      ))}
    </div>
  )
}
