import { Grid3x3, List } from "lucide-react"

interface PageHeaderProps {
  viewMode: "CANVAS" | "HISTORY"
  onViewModeChange: (mode: "CANVAS" | "HISTORY") => void
  activeMissionsCount: number
  archivedMissionsCount: number
  onNewMission: () => void
}

export function PageHeader({
  viewMode,
  onViewModeChange,
  activeMissionsCount,
  archivedMissionsCount,
  onNewMission,
}: PageHeaderProps) {
  return (
    <div className="border-b border-[#33323E] px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-lg font-semibold text-white">Railway Runner</h1>
          <p className="text-xs text-gray-500">Ephemeral Task Manager</p>
        </div>

        <div className="flex items-center bg-[#191622] border border-[#33323E] rounded-lg p-1">
          <button
            onClick={() => onViewModeChange("CANVAS")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === "CANVAS" ? "bg-[#853bce] text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            <Grid3x3 className="w-3.5 h-3.5" />
            Live Orbit
            <span
              className={`px-1.5 py-0.5 rounded text-xs ${
                viewMode === "CANVAS" ? "bg-white/20" : "bg-white/10"
              }`}
            >
              {activeMissionsCount}
            </span>
          </button>
          <button
            onClick={() => onViewModeChange("HISTORY")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === "HISTORY" ? "bg-[#853bce] text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Mission Logs
            <span
              className={`px-1.5 py-0.5 rounded text-xs ${
                viewMode === "HISTORY" ? "bg-white/20" : "bg-white/10"
              }`}
            >
              {archivedMissionsCount}
            </span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onNewMission}
          className="px-4 py-2 bg-[#853bce] hover:bg-[#A667E4] text-white text-sm font-medium rounded-lg transition-colors"
        >
          + New Mission
        </button>
      </div>
    </div>
  )
}
