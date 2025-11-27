import { useEffect, useMemo, useRef } from "react"
import { isMissionProvisioning } from "@/lib/mission"
import type { Mission } from "@/lib/types"
import { useSyncMissionStatus } from "./useMissions"

export function useStatusSync(missions: Mission[]) {
  const syncMutation = useSyncMissionStatus()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const provisioningServiceIds = useMemo(() => {
    return missions
      .filter((mission) => mission.serviceId && isMissionProvisioning(mission.status))
      .map((mission) => mission.serviceId)
      .sort()
  }, [missions])

  useEffect(() => {
    if (provisioningServiceIds.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    for (const serviceId of provisioningServiceIds) {
      syncMutation.mutate(serviceId)
    }

    intervalRef.current = setInterval(() => {
      for (const serviceId of provisioningServiceIds) {
        syncMutation.mutate(serviceId)
      }
    }, 2000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [provisioningServiceIds])

  return syncMutation
}
