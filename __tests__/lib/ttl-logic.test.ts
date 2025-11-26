import { describe, expect, it } from "@jest/globals"

interface MissionTTLCheck {
  serviceId: string
  startTime: number
  ttl: number | null
}

function shouldMissionTerminate(mission: MissionTTLCheck): boolean {
  const { startTime, ttl } = mission

  if (ttl === null) {
    return false // Manual mode - never terminate
  }

  const elapsed = Date.now() - startTime
  const ttlMs = ttl * 60 * 1000
  return elapsed >= ttlMs
}

describe("TTL Logic", () => {
  it("should not terminate missions in manual mode", () => {
    const mission: MissionTTLCheck = {
      serviceId: "test-1",
      startTime: Date.now() - 10000000,
      ttl: null,
    }

    expect(shouldMissionTerminate(mission)).toBe(false)
  })

  it("should not terminate missions before expiration", () => {
    const mission: MissionTTLCheck = {
      serviceId: "test-2",
      startTime: Date.now() - 60000, // 1 minute ago
      ttl: 5,
    }

    expect(shouldMissionTerminate(mission)).toBe(false)
  })

  it("should terminate missions after expiration", () => {
    const mission: MissionTTLCheck = {
      serviceId: "test-3",
      startTime: Date.now() - 600000, // 10 minutes ago
      ttl: 5,
    }

    expect(shouldMissionTerminate(mission)).toBe(true)
  })
})
