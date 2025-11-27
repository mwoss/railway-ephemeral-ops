export type MissionStatus =
  | "provisioning"
  | "active"
  | "terminated"
  | "cleanup_failed"
  | "error"
  | "expired"
  | "failed"

export interface Mission {
  serviceId: string
  serviceName: string
  status: MissionStatus
  startTime: number
  ttl: number | null
  timeRemaining: number | null // milliseconds remaining, null if manual mode
  image: string
  command: string
  logs: string | null
  deploymentId?: string | null
  error?: string
}

export interface StartMissionRequest {
  image: string
  command: string
  ttl: number | null
}

export interface StartMissionResponse {
  success: boolean
  mission?: Mission
  error?: string
  details?: string
}

export interface AbortMissionRequest {
  serviceId: string
}

export interface AbortMissionResponse {
  success: boolean
  error?: string
  details?: string
  isRetryable?: boolean
}

export interface LogLine {
  timestamp: string
  message: string
  severity?: string | null
}

export interface MissionLogsResponse {
  logs: LogLine[]
  isLive: boolean
}

// Manual Mode uses null for infinite TTL (no auto-termination)
export const TTL_OPTIONS = [
  { label: "5 minutes", value: 5 },
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 60 },
] as const

export const DEFAULT_IMAGES = [
  "python:3.9-slim",
  "python:3.11-slim",
  "node:18-alpine",
  "node:20-alpine",
  "golang:1.23-alpine",
] as const
