import { NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-error-handler"
import { logger } from "@/lib/logger"
import { missionStore } from "@/lib/mission-store"
import { createRailwayClient, getRailwayToken } from "@/lib/railway"

interface TTLCheckResult {
  checked: number
  expired: number
  terminated: number
  failed: number
}

async function ttlHandler() {
  const allMissions = missionStore.getAll()
  const activeMissions = allMissions.filter(
    (m) =>
      (m.status === "active" || m.status === "provisioning" || m.status === "injecting") &&
      m.ttl !== null &&
      m.ttl !== undefined
  )

  logger.info({ count: activeMissions.length }, "Checking TTL for active missions")

  if (activeMissions.length === 0) {
    return NextResponse.json({
      success: true,
      result: {
        checked: 0,
        expired: 0,
        terminated: 0,
        failed: 0,
      },
    })
  }

  const token = getRailwayToken()
  const sdk = createRailwayClient(token)

  const result: TTLCheckResult = {
    checked: activeMissions.length,
    expired: 0,
    terminated: 0,
    failed: 0,
  }

  for (const mission of activeMissions) {
    const { serviceId, startTime, ttl } = mission

    if (!ttl) continue

    const elapsed = Date.now() - startTime
    const ttlMs = ttl * 60 * 1000
    const hasExpired = elapsed >= ttlMs

    if (!hasExpired) continue

    result.expired++
    logger.info({ serviceId, ttl, elapsed: Math.floor(elapsed / 1000) }, "TTL expired for service")

    try {
      await sdk.DeleteService({ serviceId })
      logger.info({ serviceId }, "Service deleted successfully")

      missionStore.update(serviceId, { status: "expired" })
      logger.info({ serviceId, status: "expired" }, "Mission status updated in history")

      result.terminated++
    } catch (deleteError: any) {
      logger.error({ serviceId, err: deleteError }, "Failed to delete expired service")
      result.failed++
    }
  }

  return NextResponse.json({
    success: true,
    result,
  })
}

export const POST = withErrorHandler(ttlHandler)
