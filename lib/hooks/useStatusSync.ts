import { useEffect, useMemo, useRef } from "react"
import { isMissionProvisioning } from "@/lib/mission"
import type { MissionHistoryItem } from "@/lib/types"
import { useSyncMissionStatus } from "./useMissions"

export function useStatusSync(missions: MissionHistoryItem[]) {
  const syncMutation = useSyncMissionStatus()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const syncMutationRef = useRef(syncMutation)

  // Keep mutation ref up to date
  syncMutationRef.current = syncMutation

  const provisioningServiceIds = useMemo(() => {
    return missions
      .filter((mission) => mission.serviceId && isMissionProvisioning(mission.status))
      .map((mission) => mission.serviceId)
      .sort()
  }, [missions])

  const serviceIdsKey = provisioningServiceIds.join(",")

  useEffect(() => {
    if (provisioningServiceIds.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    for (const serviceId of provisioningServiceIds) {
      syncMutationRef.current.mutate(serviceId)
    }

    // Set up interval - only recreate when service IDs change
    intervalRef.current = setInterval(() => {
      for (const serviceId of provisioningServiceIds) {
        syncMutationRef.current.mutate(serviceId)
      }
    }, 2000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [serviceIdsKey])

  return syncMutation
}
