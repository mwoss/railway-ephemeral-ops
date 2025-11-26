"use client"

import { Clock, Infinity } from "lucide-react"
import { useEffect, useState } from "react"

interface CountdownTimerProps {
  startTime: number
  ttl: number | null
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

function LoadingDisplay() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-slate-300">
        <Clock className="w-5 h-5" />
        <span className="font-mono text-sm uppercase tracking-wider">Time Remaining</span>
      </div>

      <div className="font-mono text-4xl font-bold text-[#73C09B]">--:--</div>

      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div className="h-full bg-[#73C09B]" style={{ width: "100%" }} />
      </div>
    </div>
  )
}

function TTLDisplay({ timeRemaining, ttl }: TTLDisplayProps) {
  const minutes = Math.floor(timeRemaining / 60000)
  const seconds = Math.floor((timeRemaining % 60000) / 1000)
  const percentage = (timeRemaining / (ttl * 60 * 1000)) * 100

  const getColorClass = () => {
    if (percentage > 50) return "text-[#73C09B]"
    if (percentage > 25) return "text-[#dfaf2a]"
    return "text-[#b62d2b]"
  }

  const getProgressBarColor = () => {
    if (percentage > 50) return "bg-[#73C09B]"
    if (percentage > 25) return "bg-[#dfaf2a]"
    return "bg-[#b62d2b]"
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-slate-300">
        <Clock className="w-5 h-5" />
        <span className="font-mono text-sm uppercase tracking-wider">Time Remaining</span>
      </div>

      <div className={`font-mono text-4xl font-bold ${getColorClass()}`}>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>

      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${getProgressBarColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function CountdownTimer({ startTime, ttl }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isMounted, setIsMounted] = useState(false)
  const isManualMode = ttl === null

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isManualMode || !isMounted) return

    const calculateTimeRemaining = () => {
      const elapsed = Date.now() - startTime
      const ttlMs = ttl * 60 * 1000
      return Math.max(0, ttlMs - elapsed)
    }

    const updateTimer = () => {
      setTimeRemaining(calculateTimeRemaining())
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [startTime, ttl, isManualMode, isMounted])

  if (isManualMode) return <ManualModeDisplay />
  if (!isMounted) return <LoadingDisplay />
  return <TTLDisplay timeRemaining={timeRemaining} ttl={ttl} />
}
