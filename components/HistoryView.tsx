import { Clock } from "lucide-react"
import type { Mission } from "@/lib/types"
import { formatDate } from "@/lib/utils"

interface HistoryViewProps {
  missions: Mission[]
  onSelectMission: (mission: Mission) => void
}

interface HistoryTableRowProps {
  mission: Mission
  onSelect: () => void
}

function HistoryTableRow({ mission, onSelect }: HistoryTableRowProps) {
  const getStatusConfig = () => {
    if (mission.status === "expired") return { color: "bg-gray-500", label: "Expired" }
    if (mission.status === "failed" || mission.status === "cleanup_failed") {
      return { color: "bg-[#b62d2b]", label: "Failed" }
    }
    return { color: "bg-gray-500", label: "Terminated" }
  }

  const statusConfig = getStatusConfig()
  const duration = mission.ttl === null ? "∞" : mission.ttl ? `${mission.ttl}m` : "N/A"

  return (
    <div
      className="px-6 py-4 grid grid-cols-12 gap-4 hover:bg-white/5 transition-colors cursor-pointer"
      onClick={onSelect}
    >
      <div className="col-span-2 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
        <span className="text-sm text-gray-400">{statusConfig.label}</span>
      </div>

      <div className="col-span-2 flex items-center">
        <span className="text-sm text-white font-mono truncate">{mission.image}</span>
      </div>

      <div className="col-span-6 flex items-center">
        <span className="text-sm text-gray-400 font-mono truncate">{mission.command}</span>
      </div>

      <div className="col-span-1 flex items-center">
        <span className="text-sm text-gray-400">{duration}</span>
      </div>

      <div className="col-span-1 flex items-center">
        <span className="text-sm text-gray-400">{formatDate(mission.startTime)}</span>
      </div>
    </div>
  )
}

function EmptyHistoryState() {
  return (
    <div className="px-6 py-12 text-center">
      <Clock className="w-12 h-12 text-gray-700 mx-auto mb-4" />
      <p className="text-gray-500 text-sm">No archived missions</p>
      <p className="text-gray-600 text-xs mt-1">Completed missions will appear here</p>
    </div>
  )
}

export function HistoryView({ missions, onSelectMission }: HistoryViewProps) {
  return (
    <div className="w-full max-w-6xl mx-auto mt-8">
      <div className="border border-[#33323E] rounded-lg overflow-hidden">
        <div className="bg-[#191622] border-b border-[#33323E] px-6 py-3 grid grid-cols-12 gap-4 text-xs uppercase tracking-wider text-gray-400 font-medium">
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Image</div>
          <div className="col-span-6">Command</div>
          <div className="col-span-1">Duration</div>
          <div className="col-span-1">Date</div>
        </div>

        <div className="divide-y divide-[#33323E]">
          {missions.length === 0 ? (
            <EmptyHistoryState />
          ) : (
            missions.map((mission) => (
              <HistoryTableRow
                key={mission.serviceId}
                mission={mission}
                onSelect={() => onSelectMission(mission)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
