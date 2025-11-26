import type {Mission} from "./types"
import {createRailwayClient, getRailwayToken} from "./railway"
import {logger} from "./logger"

class MissionStore {
  private store: Map<string, Mission>
  private watchdogInterval: NodeJS.Timeout | null = null

  constructor() {
    this.store = new Map()
    this.startWatchdog()
  }

  getAll(): Mission[] {
    return Array.from(this.store.values()).sort((a, b) => b.startTime - a.startTime)
  }

  get(serviceId: string): Mission | undefined {
    return this.store.get(serviceId)
  }

  set(mission: Mission): void {
    this.store.set(mission.serviceId, mission)
  }

  update(serviceId: string, updates: Partial<Mission>): Mission | undefined {
    const existing = this.store.get(serviceId)
    if (!existing) {
      return undefined
    }

    const updated = {...existing, ...updates}
    this.store.set(serviceId, updated)
    return updated
  }

  private startWatchdog(): void {
    this.watchdogInterval = setInterval(() => {
      this.checkExpiredMissions()
    }, 10000)
    logger.info("MissionStore watchdog started")
  }

  public stop(): void {
    if (this.watchdogInterval) {
      clearInterval(this.watchdogInterval)
      this.watchdogInterval = null
      logger.info("MissionStore watchdog stopped")
    }
  }

  private checkExpiredMissions(): void {
    const now = Date.now()
    const missions = Array.from(this.store.values())

    for (const mission of missions) {
      // Only check active or provisioning missions with a TTL set
      if (
        (mission.status === "active" || mission.status === "provisioning") &&
        mission.ttl !== null &&
        mission.ttl !== -1
      ) {
        const expiryTime = mission.startTime + mission.ttl * 60 * 1000
        if (now >= expiryTime) {
          logger.info(
            {serviceId: mission.serviceId, ttl: mission.ttl},
            "Mission expired, triggering cleanup"
          )
          this.cleanupMission(mission.serviceId).catch((error) => {
            logger.error({serviceId: mission.serviceId, err: error}, "Failed to cleanup mission")
            this.update(mission.serviceId, {status: "cleanup_failed"})
          })
        }
      }
    }
  }

  private async cleanupMission(serviceId: string): Promise<void> {
    const token = getRailwayToken()
    const sdk = createRailwayClient(token)

    logger.info({serviceId}, "Capturing logs before deletion")

    const deploymentResult = await sdk.GetLatestDeployment({serviceId})
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
      this.update(serviceId, {logs: finalLogsString})
    }

    this.update(serviceId, {status: "expired"})
    logger.info({serviceId, status: "expired"}, "Mission marked as expired")

    await sdk.DeleteService({serviceId})
    logger.info({serviceId}, "Service deleted successfully")
  }
}

// Use global singleton to survive Next.js hot module reloading
const globalForMissionStore = globalThis as unknown as {
  missionStore: MissionStore | undefined
}

export const missionStore = globalForMissionStore.missionStore ?? new MissionStore()

if (process.env.NODE_ENV !== "production") {
  globalForMissionStore.missionStore = missionStore
}
