import type { MissionStatus } from "./types"

export function isMissionProvisioning(status: MissionStatus): boolean {
  return status === "provisioning"
}

export function isMissionActive(status: MissionStatus): boolean {
  return status === "active" || status === "provisioning"
}

export function isMissionDone(status: MissionStatus): boolean {
  return (
    status === "terminated" ||
    status === "expired" ||
    status === "error" ||
    status === "cleanup_failed" ||
    status === "failed"
  )
}
