"use client"

import { useState } from "react"
import { CanvasView } from "@/components/CanvasView"
import { ConfigurationModal } from "@/components/ConfigurationModal"
import { HistoryView } from "@/components/HistoryView"
import { InspectorPane } from "@/components/InspectorPane"
import { PageHeader } from "@/components/PageHeader"
import { useMissionManager } from "@/lib/hooks/useMissionManager"

type ViewMode = "CANVAS" | "HISTORY"

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("CANVAS")
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)

  const {
    activeMissions,
    archivedMissions,
    selectedMission,
    isStarting,
    isAborting,
    handleStartMission,
    handleAbortMission,
    handleSelectMission,
    setSelectedMission,
  } = useMissionManager()

  return (
    <div className="h-screen w-screen flex bg-[#14111D] overflow-hidden text-white">
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          activeMissionsCount={activeMissions.length}
          archivedMissionsCount={archivedMissions.length}
          onNewMission={() => setIsConfigModalOpen(true)}
        />
        <div
          className={`flex-1 relative overflow-auto ${viewMode === "CANVAS" ? "bg-grid-pattern p-10" : "bg-[#14111D] p-6"}`}
        >
          <ConfigurationModal
            isOpen={isConfigModalOpen}
            onClose={() => setIsConfigModalOpen(false)}
            onSubmit={handleStartMission}
            isLoading={isStarting}
          />
          {viewMode === "CANVAS" && (
            <CanvasView
              missions={activeMissions}
              selectedMission={selectedMission}
              onSelectMission={handleSelectMission}
            />
          )}
          {viewMode === "HISTORY" && (
            <HistoryView missions={archivedMissions} onSelectMission={handleSelectMission} />
          )}
        </div>
      </div>
      {selectedMission && (
        <InspectorPane
          mission={selectedMission}
          onClose={() => setSelectedMission(null)}
          onAbort={handleAbortMission}
          isAborting={isAborting}
        />
      )}
    </div>
  )
}
