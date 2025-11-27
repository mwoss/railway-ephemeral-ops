import { Grid3x3, List, type LucideIcon } from "lucide-react"

interface PageHeaderProps {
  viewMode: "CANVAS" | "HISTORY"
  onViewModeChange: (mode: "CANVAS" | "HISTORY") => void
  activeMissionsCount: number
  archivedMissionsCount: number
  onNewMission: () => void
}

interface ViewModeButtonProps {
  mode: "CANVAS" | "HISTORY"
  currentMode: "CANVAS" | "HISTORY"
  icon: LucideIcon
  label: string
  count: number
  onClick: () => void
}

interface ViewModeToggleProps {
  viewMode: "CANVAS" | "HISTORY"
  onViewModeChange: (mode: "CANVAS" | "HISTORY") => void
  activeMissionsCount: number
  archivedMissionsCount: number
}

interface NewMissionButtonProps {
  onClick: () => void
}

function AppTitle() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-white">Railway Runner</h1>
      <p className="text-xs text-gray-500">Ephemeral Task Manager</p>
    </div>
  )
}

function ViewModeButton({
  mode,
  currentMode,
  icon: Icon,
  label,
  count,
  onClick,
}: ViewModeButtonProps) {
  const isActive = currentMode === mode
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
        isActive ? "bg-[#853bce] text-white" : "text-gray-400 hover:text-white"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      <span className={`px-1.5 py-0.5 rounded text-xs ${isActive ? "bg-white/20" : "bg-white/10"}`}>
        {count}
      </span>
    </button>
  )
}

function ViewModeToggle({
  viewMode,
  onViewModeChange,
  activeMissionsCount,
  archivedMissionsCount,
}: ViewModeToggleProps) {
  return (
    <div className="flex items-center bg-[#191622] border border-[#33323E] rounded-lg p-1">
      <ViewModeButton
        mode="CANVAS"
        currentMode={viewMode}
        icon={Grid3x3}
        label="Live Orbit"
        count={activeMissionsCount}
        onClick={() => onViewModeChange("CANVAS")}
      />
      <ViewModeButton
        mode="HISTORY"
        currentMode={viewMode}
        icon={List}
        label="Mission Logs"
        count={archivedMissionsCount}
        onClick={() => onViewModeChange("HISTORY")}
      />
    </div>
  )
}

function NewMissionButton({ onClick }: NewMissionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-[#853bce] hover:bg-[#A667E4] text-white text-sm font-medium rounded-lg transition-colors"
    >
      + New Mission
    </button>
  )
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
        <AppTitle />
        <ViewModeToggle
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          activeMissionsCount={activeMissionsCount}
          archivedMissionsCount={archivedMissionsCount}
        />
      </div>
      <div className="flex items-center gap-3">
        <NewMissionButton onClick={onNewMission} />
      </div>
    </div>
  )
}
