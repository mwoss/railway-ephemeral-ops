import { formatDateTime } from "@/lib/date"
import type { Mission } from "@/lib/types"

interface DeploymentCardProps {
  mission: Mission
}

interface StatusConfig {
  badge: string
  badgeColor: string
  label: string
}

const getStatusConfig = (status: Mission["status"]): StatusConfig => {
  switch (status) {
    case "active":
      return {
        badge: "ACTIVE",
        badgeColor: "bg-[#73C09B] text-[#161D1A]",
        label: "Running",
      }
    case "provisioning":
      return {
        badge: "BUILDING",
        badgeColor: "bg-[#dfaf2a] text-[#3d3214]",
        label: "Building",
      }
    case "injecting":
      return {
        badge: "BUILDING",
        badgeColor: "bg-[#dfaf2a] text-[#3d3214]",
        label: "Injecting",
      }
    case "failed":
      return {
        badge: "FAILED",
        badgeColor: "bg-[#b62d2b] text-white",
        label: "Crashed",
      }
    case "cleanup_failed":
      return {
        badge: "FAILED",
        badgeColor: "bg-[#b62d2b] text-white",
        label: "Cleanup Failed",
      }
    case "expired":
      return {
        badge: "EXPIRED",
        badgeColor: "bg-gray-600 text-white",
        label: "Expired",
      }
    case "terminated":
      return {
        badge: "TERMINATED",
        badgeColor: "bg-gray-500 text-white",
        label: "Terminated",
      }
    default:
      return {
        badge: "ERROR",
        badgeColor: "bg-[#b62d2b] text-white",
        label: status,
      }
  }
}

export function DeploymentCard({ mission }: DeploymentCardProps) {
  const statusConfig = getStatusConfig(mission.status)

  return (
    <div className="bg-[#14111D] border border-[#33323E] rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 text-xs font-bold rounded ${statusConfig.badgeColor}`}>
            {statusConfig.badge}
          </span>
          <span className="text-sm text-white">{statusConfig.label}</span>
        </div>
        <span className="text-xs text-gray-500">{formatDateTime(mission.startTime)}</span>
      </div>

      <div className="mt-3 pt-3 border-t border-[#33323E]">
        <div className="text-xs text-gray-500 mb-1">Service ID</div>
        <div className="text-xs text-white font-mono break-all">{mission.serviceName}</div>
      </div>
    </div>
  )
}
