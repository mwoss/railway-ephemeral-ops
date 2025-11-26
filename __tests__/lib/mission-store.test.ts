import { describe, expect, it } from "@jest/globals"
import { missionStore } from "@/lib/mission-store"
import type { Mission } from "@/lib/types"

const createTestMission = (overrides: Partial<Mission> = {}): Mission => ({
  serviceId: `test-${Date.now()}-${Math.random()}`,
  serviceName: "Test Service",
  status: "active",
  startTime: Date.now(),
  ttl: 15,
  image: "python:3.9-slim",
  command: 'echo "test"',
  logs: null,
  deploymentId: null,
  ...overrides,
})

describe("MissionStore", () => {
  it("should store and retrieve missions", () => {
    const mission = createTestMission()
    missionStore.set(mission)

    const retrieved = missionStore.get(mission.serviceId)
    expect(retrieved).toEqual(mission)
  })

  it("should return missions sorted by startTime", () => {
    const now = Date.now()
    const mission1 = createTestMission({ startTime: now - 3000 })
    const mission2 = createTestMission({ startTime: now - 1000 })

    missionStore.set(mission1)
    missionStore.set(mission2)

    const all = missionStore.getAll()
    const testMissions = all.filter((m) =>
      [mission1.serviceId, mission2.serviceId].includes(m.serviceId)
    )

    expect(testMissions[0].serviceId).toBe(mission2.serviceId) // Newest first
  })

  it("should update missions", () => {
    const mission = createTestMission({ status: "provisioning" })
    missionStore.set(mission)

    const updated = missionStore.update(mission.serviceId, { status: "active" })

    expect(updated?.status).toBe("active")
    expect(missionStore.get(mission.serviceId)?.status).toBe("active")
  })
})
