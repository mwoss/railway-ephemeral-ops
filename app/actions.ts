"use server"

import { isMissionActive, isMissionTerminated } from "@/lib/mission"
import { missionStore } from "@/lib/mission-store"
import { createRailwayClient, fetchDeploymentLogs, getRailwayToken } from "@/lib/railway"
import type { MissionLogsResponse, MissionStatus } from "@/lib/types"

type ActionState<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error: string
      details?: string
    }

function getStoredLogs(serviceId: string): ActionState<MissionLogsResponse> {
  const mission = missionStore.get(serviceId)

  if (!mission || !mission.logs) {
    return {
      success: true,
      data: {
        logs: [],
        isLive: false,
      },
    }
  }

  return {
    success: true,
    data: {
      logs: mission.logs,
      isLive: false,
    },
  }
}

export async function getMissionLogs(
  serviceId: string,
  status: string,
  deploymentId?: string | null
): Promise<ActionState<MissionLogsResponse>> {
  try {
    if (isMissionTerminated(status as MissionStatus)) {
      return getStoredLogs(serviceId)
    }

    // For active missions, fetch live logs from Railway
    const token = getRailwayToken()
    const sdk = createRailwayClient(token)

    // Use the stored deployment ID if available, otherwise get the latest
    let targetDeploymentId = deploymentId
    if (!targetDeploymentId) {
      const deploymentResult = await sdk.GetLatestDeployment({ serviceId })
      targetDeploymentId = deploymentResult.service?.deployments?.edges?.[0]?.node?.id
    }

    if (!targetDeploymentId) {
      return {
        success: true,
        data: {
          logs: [
            {
              timestamp: new Date().toISOString(),
              message: "Initializing Container...",
              severity: "INFO",
            },
          ],
          isLive: true,
        },
      }
    }

    const logs = await fetchDeploymentLogs(sdk, targetDeploymentId)

    return {
      success: true,
      data: {
        logs,
        isLive: isMissionActive(status as MissionStatus),
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch logs",
      details: error instanceof Error ? error.stack : undefined,
    }
  }
}
