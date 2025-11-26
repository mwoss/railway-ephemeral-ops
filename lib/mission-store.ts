import type { Mission } from "./types"

class MissionStore {
  private store: Map<string, Mission>

  constructor() {
    this.store = new Map()
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

    const updated = { ...existing, ...updates }
    this.store.set(serviceId, updated)
    return updated
  }
}

export const missionStore = new MissionStore()
