import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { AbortMissionResponse, Mission, StartMissionResponse } from "@/lib/types"

export const missionKeys = {
  all: ["missions"] as const,
  history: () => [...missionKeys.all, "history"] as const,
}

async function fetchMissionHistory(): Promise<Mission[]> {
  const response = await fetch("/api/mission/history")
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

  const data: StartMissionResponse = await response.json()

  if (!data.success || !data.mission) {
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

  const data: AbortMissionResponse = await response.json()

  if (!data.success) {
    throw new Error(data.error || "Failed to abort mission")
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

      toast.success("Mission Launched", {
        description: `Service ${newMission.serviceName} is now active`,
      })
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to start mission"
      const errorDetails = error?.details || error?.response?.errors?.[0]?.message

      toast.error(errorMessage, {
        description: errorDetails,
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

      toast.success("Mission Terminated", {
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

      const errorMessage = error?.message || "Cleanup Failed"
      const errorDetails = error?.details
      const isRetryable = error?.isRetryable !== false

      toast.error(errorMessage, {
        description: errorDetails || "Failed to delete service. You can retry.",
        action: isRetryable
          ? {
              label: "Retry",
              onClick: () => {
                // Trigger retry by calling the mutation again
                // This will be handled by the component
              },
            }
          : undefined,
      })
    },
  })
}

async function syncMissionStatus(
  serviceId: string
): Promise<{ status: string; deploymentId?: string }> {
  const response = await fetch(`/api/mission/status/${serviceId}`)

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || "Failed to sync status")
  }

  return {
    status: data.status,
    deploymentId: data.deploymentId,
  }
}

export function useSyncMissionStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: syncMissionStatus,
    onSuccess: (result, serviceId) => {
      const { status, deploymentId } = result

      queryClient.setQueryData<Mission[]>(missionKeys.history(), (old = []) =>
        old.map((mission) =>
          mission.serviceId === serviceId
            ? {
                ...mission,
                status: status as Mission["status"],
                deploymentId: deploymentId || mission.deploymentId,
              }
            : mission
        )
      )

      if (status === "failed") {
        toast.error("Launch Failed", {
          description: "Container crashed. Check image name and command.",
        })
      }
    },
    onError: () => {},
  })
}
