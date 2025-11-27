import { NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-error-handler"
import { isMissionActive } from "@/lib/mission"
import { missionStore } from "@/lib/mission-store"
import type { Mission } from "@/lib/types"

function calculateFreshTimeRemaining(missions: Mission[]): Mission[] {
  return missions.map((mission) => {
    if (mission.ttl !== null && isMissionActive(mission.status)) {
      const timeRemaining = Math.max(0, mission.startTime + mission.ttl * 60 * 1000 - Date.now())
      return { ...mission, timeRemaining }
    }
    return mission
  })
}

async function getMissionsHandler() {
  const missions = missionStore.getAll()
  const missionsWithFreshTime = calculateFreshTimeRemaining(missions)

  return NextResponse.json({
    success: true,
    missions: missionsWithFreshTime,
  })
}

export const GET = withErrorHandler(getMissionsHandler)
