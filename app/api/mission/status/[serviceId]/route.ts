import { NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-error-handler"
import { logger } from "@/lib/logger"
import { missionStore } from "@/lib/mission-store"
import { createRailwayClient, getRailwayToken } from "@/lib/railway"

interface SyncStatusResponse {
  success: boolean
  status?: string
  deploymentId?: string
  shouldUpdate?: boolean
  error?: string
}

function mapRailwayStatusToMissionStatus(railwayStatus: string): string {
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
    return NextResponse.json(
      { success: false, error: "No deployment found for service" },
      { status: 404 }
    )
  }

  const railwayStatus = deployment.status
  const missionStatus = mapRailwayStatusToMissionStatus(railwayStatus)
  const deploymentId = deployment.id

  logger.info({ serviceId, railwayStatus, missionStatus, deploymentId }, "Status synced")

  const updated = missionStore.update(serviceId, {
    status: missionStatus as any,
    deploymentId,
  })
  if (updated) {
    logger.info({ serviceId, status: missionStatus }, "Mission status updated in history")
  }

  const response: SyncStatusResponse = {
    success: true,
    status: missionStatus,
    deploymentId,
    shouldUpdate: true,
  }

  return NextResponse.json(response)
}

export const GET = withErrorHandler(syncStatusHandler)
