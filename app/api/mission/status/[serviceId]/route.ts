import { NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-error-handler"
import { logger } from "@/lib/logger"
import { missionStore } from "@/lib/mission-store"
import { createRailwayClient, getRailwayToken } from "@/lib/railway"
import type { MissionStatus } from "@/lib/types"

type SyncStatusResponse =
  | {
      success: true
      status: string
      deploymentId: string
      timeRemaining: number | null
      shouldUpdate: boolean
    }
  | {
      success: false
      error: string
    }

function mapRailwayStatusToMissionStatus(railwayStatus: string): MissionStatus {
  switch (railwayStatus) {
    case "SUCCESS":
      return "active"
    case "FAILED":
    case "CRASHED":
    case "REMOVED":
      return "failed"
    case "INITIALIZING":
    case "BUILDING":
    case "DEPLOYING":
      return "provisioning"
    default:
      return "provisioning"
  }
}

async function syncStatusHandler(
  _request: Request,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const { serviceId } = await params

  const token = getRailwayToken()
  const sdk = createRailwayClient(token)

  const result = await sdk.GetMissionStatus({ serviceId })
  const deployment = result.service?.deployments?.edges?.[0]?.node

  if (!deployment) {
    const response: SyncStatusResponse = {
      success: false,
      error: "No deployment found for service",
    }
    return NextResponse.json(response, { status: 404 })
  }

  const railwayStatus = deployment.status
  const status = mapRailwayStatusToMissionStatus(railwayStatus)
  const deploymentId = deployment.id

  logger.info({ serviceId, railwayStatus, missionStatus: status, deploymentId }, "Status synced")

  // Get mission to calculate timeRemaining
  const mission = missionStore.get(serviceId)
  if (!mission) {
    return NextResponse.json(
      {
        success: false,
        error: "Mission not found in store",
      },
      { status: 404 }
    )
  }

  // Calculate timeRemaining server-side to avoid client/server clock sync issues
  const timeRemaining = mission.ttl !== null
    ? Math.max(0, mission.startTime + mission.ttl * 60 * 1000 - Date.now())
    : null

  const updated = missionStore.update(serviceId, {
    status,
    deploymentId,
    timeRemaining,
  })

  if (!updated) {
    return NextResponse.json(
      {
        success: false,
        error: "Mission not found in store",
      },
      { status: 404 }
    )
  }

  logger.info({ serviceId, status: status }, "Mission status updated in history")

  return NextResponse.json({
    success: true,
    status: status,
    deploymentId,
    timeRemaining,
    shouldUpdate: true,
  })
}

export const GET = withErrorHandler(syncStatusHandler)
