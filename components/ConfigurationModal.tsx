import { ConfigurationPanel } from "./ConfigurationPanel"

interface ConfigurationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (image: string, command: string, ttl: number | null) => Promise<boolean>
  isLoading: boolean
}

export function ConfigurationModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: ConfigurationModalProps) {
  const handleSubmit = async (image: string, command: string, ttl: number | null) => {
    const success = await onSubmit(image, command, ttl)
    if (success) {
      onClose()
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
        <ConfigurationPanel onSubmit={handleSubmit} isLoading={isLoading} onClose={onClose} />
      </div>
    </div>
  )
}
