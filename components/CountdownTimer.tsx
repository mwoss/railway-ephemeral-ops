"use client"

import { Clock, Infinity } from "lucide-react"
import { useEffect, useState } from "react"

interface CountdownTimerProps {
  timeRemaining: number | null // milliseconds from server, null for manual mode
  ttl: number | null // minutes, for display purposes
}

interface TTLDisplayProps {
  timeRemaining: number
  ttl: number
}

function ManualModeDisplay() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-slate-300">
        <Infinity className="w-5 h-5" />
        <span className="font-mono text-sm uppercase tracking-wider">Manual Mode</span>
      </div>

      <div className="font-mono text-2xl font-bold text-amber-400">No Auto-Termination</div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
        <p className="text-amber-400 text-xs leading-relaxed">
          This mission will run until you manually stop it or the process exits.
        </p>
      </div>
    </div>
  )
}

function TTLDisplay({ timeRemaining, ttl }: TTLDisplayProps) {
  const minutes = Math.floor(timeRemaining / 60000)
  const seconds = Math.floor((timeRemaining % 60000) / 1000)
  const percentage = (timeRemaining / (ttl * 60 * 1000)) * 100

  const getColorClass = (prefix: 'text' | 'bg') => {
    if (percentage > 50) return `${prefix}-[#73C09B]`
    if (percentage > 25) return `${prefix}-[#dfaf2a]`
    return `${prefix}-[#b62d2b]`
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-slate-300">
        <Clock className="w-5 h-5" />
        <span className="font-mono text-sm uppercase tracking-wider">Time Remaining</span>
      </div>

      <div className={`font-mono text-4xl font-bold ${getColorClass('text')}`}>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>

      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${getColorClass('bg')}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function CountdownTimer({ timeRemaining: serverTimeRemaining, ttl }: CountdownTimerProps) {
  const [localTimeRemaining, setLocalTimeRemaining] = useState<number>(serverTimeRemaining ?? 0)
  const isManualMode = ttl === null

  // Sync with server-provided timeRemaining when it changes
  useEffect(() => {
    if (serverTimeRemaining !== null) {
      setLocalTimeRemaining(serverTimeRemaining)
    }
  }, [serverTimeRemaining])

  // Decrement locally every second
  useEffect(() => {
    if (isManualMode) return

    const interval = setInterval(() => {
      setLocalTimeRemaining((prev) => Math.max(0, prev - 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [isManualMode])

  if (isManualMode) return <ManualModeDisplay />
  return <TTLDisplay timeRemaining={localTimeRemaining} ttl={ttl} />
}
