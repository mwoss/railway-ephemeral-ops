import { NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/api-error-handler"
import { missionStore } from "@/lib/mission-store"

async function getMissionsHandler() {
  return NextResponse.json({
    success: true,
    missions: missionStore.getAll(),
  })
}

export const GET = withErrorHandler(getMissionsHandler)
