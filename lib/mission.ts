import type { MissionStatus } from "./types"

export function isMissionActive(status: MissionStatus): boolean {
  return status === "active" || status === "provisioning" || status === "injecting"
}

export function isMissionTerminated(status: MissionStatus): boolean {
  return status === "terminated" || status === "error" || status === "cleanup_failed"
}
