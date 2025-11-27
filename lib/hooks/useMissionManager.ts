import { useEffect, useState } from "react"
import { toast } from "sonner"
import { isMissionActive } from "../mission"
import type { Mission } from "../types"
import { validateMissionInputs } from "../validation"
import { useAbortMission, useMissionHistory, useStartMission } from "./useMissions"
import { useStatusSync } from "./useStatusSync"

export function useMissionManager() {
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)

  const { data: missions = [], isLoading: isLoadingHistory } = useMissionHistory()
  const startMissionMutation = useStartMission()
  const abortMissionMutation = useAbortMission()

  useStatusSync(missions)

  useEffect(() => {
    if (selectedMission) {
      const updatedMission = missions.find((m) => m.serviceId === selectedMission.serviceId)
      if (updatedMission) {
        setSelectedMission(updatedMission)
      }
    }
  }, [missions, selectedMission])

  const handleStartMission = async (
    image: string,
    command: string,
    ttl: number | null
  ): Promise<boolean> => {
    const validation = validateMissionInputs(image, command, ttl)
    if (!validation.isValid) {
      toast.error("Validation Failed", {
        description: validation.error,
      })
      return false
    }

    try {
      const mission = await startMissionMutation.mutateAsync({ image, command, ttl })
      setSelectedMission(mission)
      return true
    } catch (error) {
      toast.error("Couldn't start a new mission due to unknown error")
      return false
    }
  }

  const handleAbortMission = async () => {
    if (!selectedMission || !selectedMission.serviceId) return

    try {
      await abortMissionMutation.mutateAsync(selectedMission.serviceId)
      setSelectedMission({
        ...selectedMission,
        status: "terminated",
      })
    } catch (error) {
      toast.error("Couldn't abort a mission due to unknown error")
    }
  }

  const handleSelectMission = (mission: Mission) => {
    setSelectedMission(mission)
  }

  const activeMissions = missions.filter((m) => isMissionActive(m.status))
  const archivedMissions = missions.filter((m) => !isMissionActive(m.status))

  return {
    missions,
    activeMissions,
    archivedMissions,
    selectedMission,
    isLoadingHistory,
    isStarting: startMissionMutation.isPending,
    isAborting: abortMissionMutation.isPending,
    handleStartMission,
    handleAbortMission,
    handleSelectMission,
    setSelectedMission,
  }
}
