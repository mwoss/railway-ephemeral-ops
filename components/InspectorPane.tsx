import { Infinity, Loader2, Skull, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useAbortMission } from "@/lib/hooks/useMissions"
import { isMissionActive } from "@/lib/mission"
import type { Mission } from "@/lib/types"
import { CountdownTimer } from "./CountdownTimer"
import { DeploymentCard } from "./DeploymentCard"
import { LogTerminal } from "./LogTerminal"

interface InspectorPaneProps {
  mission: Mission
  onClose: () => void
}

interface InspectorHeaderProps {
  mission: Mission
  onClose: () => void
}

interface TabNavigationProps {
  activeTab: "deployments" | "parameters"
  onTabChange: (tab: "deployments" | "parameters") => void
}

interface DeploymentsTabProps {
  mission: Mission
  canAbort: boolean
  onAbort: () => void
  isAborting: boolean
}

interface ParametersTabProps {
  mission: Mission
}

interface AbortButtonProps {
  onAbort: () => void
  isAborting: boolean
}

interface TTLDisplayProps {
  ttl: number | null
}

const tabs = [
  { id: "deployments" as const, label: "Deployments" },
  { id: "parameters" as const, label: "Parameters" },
]

function InspectorHeader({ mission, onClose }: InspectorHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-sm font-medium text-white">{mission.serviceName}</h2>
        <p className="text-xs text-gray-500 font-mono mt-1">{mission.image}</p>
      </div>
      <button
        onClick={onClose}
        className="w-8 h-8 rounded hover:bg-white/5 flex items-center justify-center transition-colors"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  )
}

function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex gap-6 border-b border-[#33323E] -mb-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`pb-3 text-sm font-medium transition-colors relative ${
            activeTab === tab.id ? "text-white" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
          )}
        </button>
      ))}
    </div>
  )
}

function AbortButton({ onAbort, isAborting }: AbortButtonProps) {
  return (
    <button
      onClick={onAbort}
      disabled={isAborting}
      className={`w-full py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium ${
        isAborting
          ? "bg-white/5 text-gray-500 cursor-not-allowed"
          : "bg-[#2c1111] border border-[#b62d2b]/20 text-[#b62d2b] hover:bg-[#2c1111]/80"
      }`}
    >
      {isAborting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Skull className="w-4 h-4" />}
      {isAborting ? "Aborting..." : "Abort Mission"}
    </button>
  )
}

function DeploymentsTab({ mission, canAbort, onAbort, isAborting }: DeploymentsTabProps) {
  const showTimer = isMissionActive(mission.status)

  return (
    <>
      <DeploymentCard mission={mission} />
      {showTimer && (
        <div className="bg-[#14111D] border border-[#33323E] rounded-lg p-4">
          <CountdownTimer timeRemaining={mission.timeRemaining} ttl={mission.ttl} />
        </div>
      )}
      {canAbort && <AbortButton onAbort={onAbort} isAborting={isAborting} />}
      {mission.serviceId && (
        <>
          <div className="border-t border-[#33323E] my-4" />
          <LogTerminal
            serviceId={mission.serviceId}
            status={mission.status}
            deploymentId={mission.deploymentId}
          />
        </>
      )}
    </>
  )
}

function TTLDisplay({ ttl }: TTLDisplayProps) {
  return (
    <div className="bg-[#14111D] border border-[#33323E] rounded-lg p-4">
      <div className="text-xs text-gray-500 mb-1">TTL (Time to Live)</div>
      {ttl === null ? (
        <div className="flex items-center gap-2">
          <Infinity className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-amber-400 font-medium">
            Manual Mode (No Auto-Termination)
          </span>
        </div>
      ) : (
        <div className="text-sm text-white">{ttl} minutes</div>
      )}
    </div>
  )
}

function ParametersTab({ mission }: ParametersTabProps) {
  return (
    <div className="space-y-4">
      <TTLDisplay ttl={mission.ttl} />
      <div>
        <div className="text-xs text-gray-500 mb-2">Command</div>
        <div className="text-xs text-white font-mono break-all bg-[#14111D] border border-[#33323E] rounded-lg p-3">
          {mission.command}
        </div>
      </div>
    </div>
  )
}

export function InspectorPane({ mission, onClose }: InspectorPaneProps) {
  const [activeTab, setActiveTab] = useState<"deployments" | "parameters">("deployments")
  const abortMissionMutation = useAbortMission()
  const canAbort = isMissionActive(mission.status)

  const handleAbort = async () => {
    if (!mission.serviceId) return

    try {
      await abortMissionMutation.mutateAsync(mission.serviceId)
    } catch (error) {
      toast.error("Couldn't abort a mission due to unknown error")
    }
  }

  return (
    <div className="w-[600px] border-l border-[#33323E] bg-[#191622] flex flex-col h-screen">
      <div className="border-b border-[#33323E] p-4">
        <InspectorHeader mission={mission} onClose={onClose} />
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "deployments" && (
          <DeploymentsTab
            mission={mission}
            canAbort={canAbort}
            onAbort={handleAbort}
            isAborting={abortMissionMutation.isPending}
          />
        )}
        {activeTab === "parameters" && <ParametersTab mission={mission} />}
      </div>
    </div>
  )
}
