import { GraphQLClient } from "graphql-request"
import { getSdk } from "@/generated/graphql"

const RAILWAY_API_URL = "https://backboard.railway.app/graphql/v2"

export function createRailwayClient(apiToken: string) {
  const client = new GraphQLClient(RAILWAY_API_URL, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  })

  return getSdk(client)
}

export function getRailwayToken(): string {
  const token = process.env.RAILWAY_API_TOKEN

  if (!token) {
    throw new Error("RAILWAY_API_TOKEN is not set in environment variables")
  }

  return token
}

export async function getRailwayProjectId(): Promise<string> {
  const envProjectId = process.env.RAILWAY_PROJECT_ID

  if (envProjectId) {
    return envProjectId
  }

  // Auto-detect first project
  const token = getRailwayToken()
  const sdk = createRailwayClient(token)

  const { me } = await sdk.GetProjects()
  const projects = me?.projects?.edges || []

  if (projects.length === 0) {
    throw new Error("No Railway projects found. Please create a project first.")
  }

  const firstProject = projects[0]?.node

  if (!firstProject?.id) {
    throw new Error("Could not retrieve project ID")
  }

  return firstProject.id
}
