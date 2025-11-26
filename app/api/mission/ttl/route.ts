import { type NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-error-handler"
import { logger } from "@/lib/logger"
import { createRailwayClient, getRailwayToken } from "@/lib/railway"

interface MissionTTLCheck {
  serviceId: string
  startTime: number
  ttl: number | null
}

interface TTLRequest {
  missions: MissionTTLCheck[]
}

interface MissionTTLResult {
  serviceId: string
  shouldTerminate: boolean
  terminated?: boolean
}

async function ttlHandler(request: NextRequest) {
  const body: TTLRequest = await request.json()
  const { missions } = body

  if (!missions || !Array.isArray(missions) || missions.length === 0) {
    return NextResponse.json(
      { success: false, error: "Missing or invalid missions array", results: [] },
      { status: 400 }
    )
  }

  const token = getRailwayToken()
  const sdk = createRailwayClient(token)

  const results: MissionTTLResult[] = []

  for (const mission of missions) {
    const { serviceId, startTime, ttl } = mission

    if (!serviceId || !startTime || ttl === undefined) {
      logger.warn({ serviceId }, "Skipping mission with missing fields")
      continue
    }

    if (ttl === null) {
      results.push({
        serviceId,
        shouldTerminate: false,
      })
      continue
    }

    const elapsed = Date.now() - startTime
    const ttlMs = ttl * 60 * 1000
    const hasExpired = elapsed >= ttlMs

    if (!hasExpired) {
      results.push({
        serviceId,
        shouldTerminate: false,
      })
      continue
    }

    logger.info({ serviceId, ttl }, "TTL expired for service")
    try {
      await sdk.DeleteService({ serviceId })
      logger.info({ serviceId }, "Service deleted successfully")
      results.push({
        serviceId,
        shouldTerminate: true,
        terminated: true,
      })
    } catch (deleteError: any) {
      logger.error({ serviceId, err: deleteError }, "Failed to delete service")
      results.push({
        serviceId,
        shouldTerminate: true,
        terminated: false,
      })
    }
  }

  return NextResponse.json({
    success: true,
    results,
  })
}

export const POST = withErrorHandler(ttlHandler)
