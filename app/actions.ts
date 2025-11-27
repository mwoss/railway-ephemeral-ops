"use server"

import { isMissionActive, isMissionTerminated } from "@/lib/mission"
import { missionStore } from "@/lib/mission-store"
import { createRailwayClient, getRailwayToken } from "@/lib/railway"
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

export async function getMissionLogs(
  serviceId: string,
  status: string,
  deploymentId?: string | null
): Promise<ActionState<MissionLogsResponse>> {
  try {
    if (isMissionTerminated(status as MissionStatus)) {
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

      const logLines = mission.logs
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line)
          } catch {
            return {
              timestamp: new Date().toISOString(),
              message: line,
              severity: "INFO",
            }
          }
        })

      return {
        success: true,
        data: {
          logs: logLines,
          isLive: false,
        },
      }
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

    const logsResult = await sdk.GetDeploymentLogs({
      deploymentId: targetDeploymentId,
      limit: 500,
    })

    const logs = (logsResult.deploymentLogs || []).map((log) => ({
      timestamp: log?.timestamp || new Date().toISOString(),
      message: log?.message || "",
      severity: log?.severity,
    }))

    return {
      success: true,
      data: {
        logs,
        isLive: isMissionActive(status as MissionStatus),
      },
    }
  } catch (error) {
    let errorMessage = "Failed to fetch logs"
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined,
    }
  }
}
