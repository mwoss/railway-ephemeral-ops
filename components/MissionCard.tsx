import { Activity, AlertCircle, Rocket, Skull } from "lucide-react"
import type { MissionHistoryItem } from "@/lib/types"

interface MissionCardProps {
  mission: MissionHistoryItem
  isSelected: boolean
  onClick: () => void
}

const getStatusConfig = (mission: MissionHistoryItem) => {
  switch (mission.status) {
    case "active":
      return {
        icon: Activity,
        label: "Active",
        color: "bg-[#73C09B]",
        textColor: "text-[#73C09B]",
      }
    case "provisioning":
      return {
        icon: Rocket,
        label: "Provisioning",
        color: "bg-[#dfaf2a]",
        textColor: "text-[#dfaf2a]",
      }
    case "terminated":
      return {
        icon: Skull,
        label: "Terminated",
        color: "bg-gray-500",
        textColor: "text-gray-400",
      }
    default:
      return {
        icon: AlertCircle,
        label: "Error",
        color: "bg-[#b62d2b]",
        textColor: "text-[#b62d2b]",
      }
  }
}

const getTimeAgo = (mission: MissionHistoryItem) => {
  const now = Date.now()
  const start = new Date(mission.startTime).getTime()
  const diff = now - start
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return "Just now"
}

export function MissionCard({ mission, isSelected, onClick }: MissionCardProps) {
  const statusConfig = getStatusConfig(mission)

  return (
    <div
      onClick={onClick}
      className={`w-80 h-32 rounded-xl border transition-all cursor-pointer relative bg-[#191622] ${
        isSelected
          ? "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
          : "border-[#33323E] hover:border-[#4a4956]"
      }`}
    >
      <div className="p-4 h-full flex flex-col justify-between">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
            <Rocket className="w-4 h-4 text-white/60" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white truncate">{mission.serviceName}</h3>
            <p className="text-xs text-gray-500 truncate font-mono">{mission.image}</p>
          </div>
        </div>

        {/* Bottom: Time + Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{getTimeAgo(mission)}</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusConfig.color} animate-pulse`} />
            <span className={`text-xs font-medium ${statusConfig.textColor}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
