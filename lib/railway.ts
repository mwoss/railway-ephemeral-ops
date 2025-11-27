import { GraphQLClient } from "graphql-request"
import { getSdk } from "@/generated/graphql"
import type { LogLine } from "./types"

const RAILWAY_API_URL = "https://backboard.railway.app/graphql/v2"

export function createRailwayClient(apiToken: string) {
  const client = new GraphQLClient(RAILWAY_API_URL, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  })

  return getSdk(client)
}

export async function fetchDeploymentLogs(
  sdk: ReturnType<typeof getSdk>,
  deploymentId: string,
  limit = 1000
): Promise<LogLine[]> {
  const logsResult = await sdk.GetDeploymentLogs({
    deploymentId,
    limit,
  })
  return (logsResult.deploymentLogs || []).map((log) => ({
    timestamp: log.timestamp,
    message: log.message,
    severity: log?.severity,
  }))
}

export function getRailwayToken(): string {
  const token = process.env.RAILWAY_API_TOKEN

  if (!token) {
    throw new Error("RAILWAY_API_TOKEN is not set in environment variables")
  }

  return token
}

export function getRailwayProjectId(): string {
  const projectId = process.env.RAILWAY_PROJECT_ID

  if (!projectId) {
    throw new Error("RAILWAY_PROJECT_ID is not set in environment variables")
  }

  return projectId
}

export function getRailwayEnvironmentId(): string {
  const environmentId = process.env.RAILWAY_ENVIRONMENT_ID

  if (!environmentId) {
    throw new Error("RAILWAY_ENVIRONMENT_ID is not set in environment variables")
  }

  return environmentId
}
