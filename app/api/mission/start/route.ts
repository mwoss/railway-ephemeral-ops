import { type NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-error-handler"
import { logger } from "@/lib/logger"
import { missionStore } from "@/lib/mission-store"
import { createRailwayClient, getRailwayProjectId, getRailwayToken } from "@/lib/railway"
import type { Mission, StartMissionRequest } from "@/lib/types"
import { validateMissionInputs } from "@/lib/validation"

const getEnvironmentIdForService = async (sdk: any, serviceId: string) => {
  let environmentId: string | undefined
  let retries = 0
  const maxRetries = 10

  while (!environmentId && retries < maxRetries) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const serviceDetails = await sdk.GetService({ serviceId })
    environmentId = serviceDetails.service?.serviceInstances?.edges?.[0]?.node?.environmentId
    retries++
    logger.debug({ serviceId, attempt: retries, environmentId }, "Polling for environment ID")
  }

  return environmentId
}

async function startMissionHandler(request: NextRequest) {
  const body: StartMissionRequest = await request.json()
  const { image, command, ttl } = body

  // Note: ttl can be null (Manual Mode), but must be present (not undefined)
  if (!image || !command || ttl === undefined) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: image, command, or ttl" },
      { status: 400 }
    )
  }

  const validation = validateMissionInputs(image, command, ttl)
  if (!validation.isValid) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        details: validation.error,
      },
      { status: 400 }
    )
  }

  const token = getRailwayToken()
  const projectId = await getRailwayProjectId()
  const sdk = createRailwayClient(token)

  logger.info({ image }, "Creating service")
  const createResult = await sdk.CreateService({
    projectId,
    image,
  })

  if (!createResult.serviceCreate?.id) {
    throw new Error("Failed to create service - no service ID returned")
  }

  const serviceId = createResult.serviceCreate.id
  const serviceName = createResult.serviceCreate.name || "Unknown"
  logger.info({ serviceId, serviceName }, "Service created")

  const environmentId = await getEnvironmentIdForService(sdk, serviceId)
  if (!environmentId) {
    throw new Error("Failed to get environment ID for service after multiple attempts")
  }
  logger.info({ serviceId, environmentId }, "Environment ID found")

  // Note: Railway API doesn't support setting start/build command during service creation T_T
  // We need to update it after service is created and trigger redeploy
  await sdk.UpdateCommand({
    environmentId,
    serviceId,
    command,
  })
  logger.info({ serviceId }, "Command updated successfully")

  // Service update doesn't trigger redeploy, we need to manually trigger it.
  // Note: Why it needs environment id when serviceCreate mutation doesn't?
  const deployment = await sdk.RedeployService({
    serviceId,
    environmentId,
  })

  const mission: Mission = {
    serviceId,
    serviceName,
    status: "provisioning",
    startTime: Date.now(),
    ttl,
    image,
    command,
    logs: null,
    deploymentId: deployment.serviceInstanceDeployV2,
  }

  missionStore.set(mission)
  logger.info({ serviceId, status: mission.status }, "Mission saved to history")

  return NextResponse.json({
    success: true,
    mission,
  })
}

export const POST = withErrorHandler(startMissionHandler)
