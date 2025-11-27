import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type {
  AbortMissionResponse,
  Mission,
  MissionStatus,
  StartMissionResponse,
} from "@/lib/types"

export const missionKeys = {
  all: ["missions"] as const,
  history: () => [...missionKeys.all, "history"] as const,
}

async function fetchMissionHistory(): Promise<Mission[]> {
  const response = await fetch("/api/mission/history")

  if (!response.ok) {
    throw new Error(`Failed to fetch mission history: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || "Failed to fetch mission history")
  }

  return data.missions || []
}

async function startMission(params: {
  image: string
  command: string
  ttl: number | null
}): Promise<Mission> {
  const response = await fetch("/api/mission/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error(`Failed to start mission: ${response.status} ${response.statusText}`)
  }

  const data: StartMissionResponse = await response.json()

  if (!data.success) {
    throw new Error(data.error || "Failed to start mission")
  }

  return data.mission
}

async function abortMission(serviceId: string): Promise<void> {
  const response = await fetch("/api/mission/abort", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ serviceId }),
  })

  if (!response.ok) {
    throw new Error(`Failed to abort mission: ${response.status} ${response.statusText}`)
  }

  const data: AbortMissionResponse = await response.json()

  if (!data.success) {
    throw new Error(data.error || "Failed to abort mission")
  }
}

async function syncMissionStatus(
  serviceId: string
): Promise<{ status: string; deploymentId?: string; timeRemaining: number | null }> {
  const response = await fetch(`/api/mission/status/${serviceId}`)

  if (!response.ok) {
    throw new Error(`Failed to sync mission status: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || "Failed to sync status")
  }

  return {
    status: data.status,
    deploymentId: data.deploymentId,
    timeRemaining: data.timeRemaining,
  }
}

export function useMissionHistory() {
  return useQuery({
    queryKey: missionKeys.history(),
    queryFn: fetchMissionHistory,
    staleTime: 5 * 1000,
    refetchInterval: 5 * 1000, // Poll every 5 seconds to catch backend watchdog changes
  })
}

export function useStartMission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: startMission,
    onSuccess: (newMission) => {
      queryClient.setQueryData<Mission[]>(missionKeys.history(), (old = []) => [newMission, ...old])
      toast.success("Mission launched", {
        description: `Service ${newMission.serviceName} is now active`,
      })
    },
    onError: (error: any) => {
      toast.error("Failed to start mission", {
        description: error?.details || error?.response?.errors?.[0]?.message,
      })
    },
  })
}

export function useAbortMission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: abortMission,
    onSuccess: (_, serviceId) => {
      queryClient.setQueryData<Mission[]>(missionKeys.history(), (old = []) =>
        old.map((mission) =>
          mission.serviceId === serviceId ? { ...mission, status: "terminated" as const } : mission
        )
      )
      toast.success("Mission terminated", {
        description: "Service has been successfully deleted",
      })
    },
    onError: (error: any, serviceId) => {
      queryClient.setQueryData<Mission[]>(missionKeys.history(), (old = []) =>
        old.map((mission) =>
          mission.serviceId === serviceId
            ? { ...mission, status: "cleanup_failed" as const }
            : mission
        )
      )
      toast.error(error?.message || "Cleanup failed", {
        description: error?.details || "Failed to delete service.",
      })
    },
  })
}

export function useSyncMissionStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: syncMissionStatus,
    onSuccess: (result, serviceId) => {
      const { status, deploymentId, timeRemaining } = result
      queryClient.setQueryData<Mission[]>(missionKeys.history(), (old = []) =>
        old.map((mission) =>
          mission.serviceId === serviceId
            ? {
                ...mission,
                status: status as MissionStatus,
                deploymentId: deploymentId || mission.deploymentId,
                timeRemaining,
              }
            : mission
        )
      )

      if (status === "failed") {
        toast.error("Launch failed", {
          description: "Container crashed. Check image name and command.",
        })
      }
    },
    onError: () => {
      toast.error("Launch failed", {
        description: "Container crashed due to unknown error.",
      })
    },
  })
}
