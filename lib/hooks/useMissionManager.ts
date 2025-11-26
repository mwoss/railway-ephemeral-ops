import { useEffect, useState } from "react"
import { toast } from "sonner"
import type { Mission } from "../types"
import { validateMissionInputs } from "../validation"
import { useAbortMission, useMissionHistory, useStartMission } from "./useMissions"
import { useStatusSync } from "./useStatusSync"

export function useMissionManager() {
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)

  const { data: missions = [], isLoading: isLoadingHistory } = useMissionHistory()
  const startMissionMutation = useStartMission()
  const abortMissionMutation = useAbortMission()

  useStatusSync(selectedMission)

  // Background status sync for provisioning missions
  useEffect(() => {
    const provisioningMissions = missions.filter(
      (m) => m.status === "provisioning" || m.status === "injecting"
    )

    if (provisioningMissions.length === 0) return

    const interval = setInterval(() => {
      provisioningMissions.forEach((mission) => {
        fetch(`/api/mission/status/${mission.serviceId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.status !== mission.status) {
              // Backend now handles updating history, just show toast if failed
              if (data.status === "failed") {
                toast.error("Mission Failed", {
                  description: `${mission.serviceName} crashed. Check image and command.`,
                })
              }
            }
          })
          .catch(() => {})
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [missions])

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
      const errorMission: Mission = {
        serviceId: `error-${Date.now()}`,
        serviceName: "Error",
        status: "error",
        startTime: Date.now(),
        ttl,
        timeRemaining: null,
        image,
        command,
        logs: null,
        deploymentId: null,
        error: error instanceof Error ? error.message : "Unknown error",
      }
      setSelectedMission(errorMission)
      return false
    }
  }

  const handleAbortMission = async () => {
    if (!selectedMission || !selectedMission.serviceId) return

    try {
      await abortMissionMutation.mutateAsync(selectedMission.serviceId)

      const terminatedMission: Mission = {
        ...selectedMission,
        status: "terminated",
      }
      setSelectedMission(terminatedMission)
    } catch (error) {
      // Silently fail abort
    }
  }

  const handleSelectMission = (mission: Mission) => {
    setSelectedMission(mission)
  }

  const activeMissions = missions.filter(
    (m) => m.status === "active" || m.status === "provisioning" || m.status === "injecting"
  )

  const archivedMissions = missions.filter(
    (m) =>
      m.status === "expired" ||
      m.status === "failed" ||
      m.status === "terminated" ||
      m.status === "cleanup_failed"
  )

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
