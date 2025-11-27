import { toast } from "sonner"
import { useStartMission } from "@/lib/hooks/useMissions"
import type { MissionHistoryItem } from "@/lib/types"
import { validateMissionInputs } from "@/lib/validation"
import { ConfigurationPanel } from "./ConfigurationPanel"

interface ConfigurationModalProps {
  isOpen: boolean
  onClose: () => void
  onMissionStarted: (mission: MissionHistoryItem) => void
}

export function ConfigurationModal({ isOpen, onClose, onMissionStarted }: ConfigurationModalProps) {
  const startMissionMutation = useStartMission()

  const handleSubmit = async (image: string, command: string, ttl: number | null) => {
    const validation = validateMissionInputs(image, command, ttl)
    if (!validation.isValid) {
      toast.error("Validation failed", {
        description: validation.error,
      })
      return
    }

    try {
      const mission = await startMissionMutation.mutateAsync({ image, command, ttl })
      onMissionStarted(mission)
      onClose()
    } catch (error) {
      toast.error("Couldn't start a new mission due to unknown error")
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="w-96 bg-[#191622] border border-[#33323E] rounded-xl p-6">
        <ConfigurationPanel
          onSubmit={handleSubmit}
          isLoading={startMissionMutation.isPending}
          onClose={onClose}
        />
      </div>
    </div>
  )
}
