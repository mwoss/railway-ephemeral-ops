import { type NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-error-handler"
import { logger } from "@/lib/logger"
import { missionStore } from "@/lib/mission-store"
import { createRailwayClient, getRailwayToken } from "@/lib/railway"
import type { AbortMissionRequest } from "@/lib/types"

async function abortMissionHandler(request: NextRequest) {
  const body: AbortMissionRequest = await request.json()
  const { serviceId } = body

  if (!serviceId) {
    return NextResponse.json(
      { success: false, error: "Missing required field: serviceId" },
      { status: 400 }
    )
  }

  const token = getRailwayToken()
  const sdk = createRailwayClient(token)

  logger.info({ serviceId }, "Capturing logs before deletion")

  try {
    const deploymentResult = await sdk.GetLatestDeployment({ serviceId })
    const deployment = deploymentResult.service?.deployments?.edges?.[0]?.node

    if (deployment?.id) {
      const logsResult = await sdk.GetDeploymentLogs({
        deploymentId: deployment.id,
        limit: 1000,
      })

      const logLines = (logsResult.deploymentLogs || []).map((log) => {
        return JSON.stringify({
          timestamp: log?.timestamp || new Date().toISOString(),
          message: log?.message || "",
          severity: log?.severity,
        })
      })
      const finalLogsString = logLines.join("\n")
      missionStore.update(serviceId, { logs: finalLogsString })
    }
  } catch (logError) {
    logger.error({ serviceId, err: logError }, "Failed to capture logs")
  }

  await sdk.DeleteService({ serviceId })
  logger.info({ serviceId }, "Service deleted successfully")

  missionStore.update(serviceId, { status: "terminated" })
  logger.info({ serviceId, status: "terminated" }, "Mission status updated in history")

  return NextResponse.json({
    success: true,
  })
}

export const POST = withErrorHandler(abortMissionHandler)
