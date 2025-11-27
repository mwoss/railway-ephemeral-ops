"use client"

import { useEffect, useMemo, useState } from "react"
import { CanvasView } from "@/components/CanvasView"
import { ConfigurationModal } from "@/components/ConfigurationModal"
import { HistoryView } from "@/components/HistoryView"
import { InspectorPane } from "@/components/InspectorPane"
import { PageHeader } from "@/components/PageHeader"
import { useMissionHistory } from "@/lib/hooks/useMissions"
import { useStatusSync } from "@/lib/hooks/useStatusSync"
import { isMissionActive } from "@/lib/mission"
import type { MissionHistoryItem } from "@/lib/types"

type ViewMode = "CANVAS" | "HISTORY"

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("CANVAS")
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [selectedMission, setSelectedMission] = useState<MissionHistoryItem | null>(null)

  const { data: missions = [], isLoading, isError } = useMissionHistory()

  const activeMissions = useMemo(
    () => missions.filter((m) => isMissionActive(m.status)),
    [missions]
  )
  const archivedMissions = useMemo(
    () => missions.filter((m) => !isMissionActive(m.status)),
    [missions]
  )
  // Sync status for provisioning missions
  useStatusSync(missions)

  useEffect(() => {
    if (selectedMission) {
      const updatedMission = missions.find((m) => m.serviceId === selectedMission.serviceId)
      if (updatedMission) {
        setSelectedMission(updatedMission)
      }
    }
  }, [missions, selectedMission])

  const handleSelectMission = (mission: MissionHistoryItem) => {
    setSelectedMission(mission)
  }

  return (
    <div className="h-screen w-screen flex bg-[#14111D] overflow-hidden text-white">
      <div className="flex-1 flex flex-col overflow-hidden">
        <PageHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          activeMissionsCount={activeMissions.length}
          archivedMissionsCount={archivedMissions.length}
          onNewMission={() => setIsConfigModalOpen(true)}
          isLoading={isLoading}
        />
        <div
          className={`flex-1 relative overflow-auto ${viewMode === "CANVAS" ? "bg-grid-pattern p-10" : "bg-[#14111D] p-6"}`}
        >
          <ConfigurationModal
            isOpen={isConfigModalOpen}
            onClose={() => setIsConfigModalOpen(false)}
            onMissionStarted={setSelectedMission}
          />
          {viewMode === "CANVAS" && (
            <CanvasView
              missions={activeMissions}
              selectedMission={selectedMission}
              onSelectMission={handleSelectMission}
              isError={isError}
            />
          )}
          {viewMode === "HISTORY" && (
            <HistoryView
              missions={archivedMissions}
              onSelectMission={handleSelectMission}
              isError={isError}
            />
          )}
        </div>
      </div>
      {selectedMission && (
        <InspectorPane mission={selectedMission} onClose={() => setSelectedMission(null)} />
      )}
    </div>
  )
}
