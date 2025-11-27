import { type NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-error-handler"
import { isMissionActive, isMissionDone } from "@/lib/mission"
import { missionStore } from "@/lib/mission-store"
import { createRailwayClient, fetchDeploymentLogs, getRailwayToken } from "@/lib/railway"
import type { MissionStatus } from "@/lib/types"

async function getLogsHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const serviceId = searchParams.get("serviceId")
  const status = searchParams.get("status")
  const deploymentId = searchParams.get("deploymentId")

  if (!serviceId || !status) {
    return NextResponse.json(
      { success: false, error: "Missing required parameters: serviceId and status" },
      { status: 400 }
    )
  }

  if (isMissionDone(status as MissionStatus)) {
    const mission = missionStore.get(serviceId)

    if (!mission || !mission.logs) {
      return NextResponse.json({
        success: true,
        data: {
          logs: [],
          isLive: false,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        logs: mission.logs,
        isLive: false,
      },
    })
  }

  try {
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
      return NextResponse.json({
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
      })
    }

    const logs = await fetchDeploymentLogs(sdk, targetDeploymentId)

    return NextResponse.json({
      success: true,
      data: {
        logs,
        isLive: isMissionActive(status as MissionStatus),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch logs",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandler(getLogsHandler)
