"use client"

import { Loader2, Terminal } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { getMissionLogs } from "@/app/actions"
import { isMissionActive, isMissionTerminated } from "@/lib/mission"
import type { LogLine, MissionStatus } from "@/lib/types"

interface LogTerminalProps {
  serviceId: string
  status: MissionStatus
  deploymentId?: string | null
}

interface TerminalHeaderProps {
  isLive: boolean
  hasLogs: boolean
}

interface LogContentProps {
  logs: LogLine[]
  isLoading: boolean
  error: string | null
}

interface LogEntryProps {
  log: LogLine
  index: number
}

interface TerminalFooterProps {
  logCount: number
  isLive: boolean
}

const getSeverityColor = (severity?: string | null) => {
  switch (severity?.toUpperCase()) {
    case "ERROR":
      return "text-[#b62d2b]"
    case "WARN":
    case "WARNING":
      return "text-[#dfaf2a]"
    case "INFO":
      return "text-purple-400"
    case "DEBUG":
      return "text-gray-500"
    default:
      return "text-gray-300"
  }
}

const formatLogTimestamp = (timestamp: string) => {
  try {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  } catch {
    return timestamp
  }
}

function TerminalHeader({ isLive, hasLogs }: TerminalHeaderProps) {
  return (
    <div className="bg-[#191622] border-b border-[#33323E] px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Terminal className="w-4 h-4 text-purple-400" />
        <span className="text-gray-300 font-mono text-sm font-semibold">Container Logs</span>
      </div>
      <div className="flex items-center gap-2">
        {isLive && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-[#73C09B] rounded-full animate-pulse" />
            <span className="text-[#73C09B] text-xs font-mono">LIVE</span>
          </div>
        )}
        {!isLive && hasLogs && <span className="text-gray-500 text-xs font-mono">ARCHIVED</span>}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading logs...</span>
      </div>
    </div>
  )
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-[#b62d2b]">
        <span>⚠️ {error}</span>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-gray-500">
        <span>No logs available yet...</span>
      </div>
    </div>
  )
}

function LogEntry({ log, index }: LogEntryProps) {
  return (
    <div key={index} className="flex gap-3 hover:bg-white/5 px-2 py-1 rounded">
      <span className="text-gray-600 select-none shrink-0">
        {formatLogTimestamp(log.timestamp)}
      </span>
      {log.severity && (
        <span className={`${getSeverityColor(log.severity)} select-none shrink-0 w-12`}>
          [{log.severity}]
        </span>
      )}
      <span className={getSeverityColor(log.severity)}>{log.message}</span>
    </div>
  )
}

function LogContent({ logs, isLoading, error }: LogContentProps) {
  if (isLoading && logs.length === 0) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState error={error} />
  }

  if (logs.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-1">
      {logs.map((log, index) => (
        <LogEntry key={index} log={log} index={index} />
      ))}
    </div>
  )
}

function TerminalFooter({ logCount, isLive }: TerminalFooterProps) {
  return (
    <div className="bg-[#191622] border-t border-[#33323E] px-4 py-2">
      <div className="flex items-center justify-between text-xs font-mono text-gray-500">
        <span>{logCount} lines</span>
        {isLive && <span>Refreshing every 5s</span>}
      </div>
    </div>
  )
}

export function LogTerminal({ serviceId, status, deploymentId }: LogTerminalProps) {
  const [logs, setLogs] = useState<LogLine[]>([])
  const [isLive, setIsLive] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchLogs = async () => {
    try {
      const result = await getMissionLogs(serviceId, status, deploymentId)

      if (result.success) {
        setLogs(result.data.logs)
        setIsLive(result.data.isLive)
        setError(null)

        // Stop polling if mission is no longer live
        if (!result.data.isLive && intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else {
        setError(result.error)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } catch (err) {
      setError("Failed to fetch logs")
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isMissionTerminated(status)) {
      // For terminated missions, only fetch once (stored logs)
      void fetchLogs()
      return
    }

    void fetchLogs()

    if (isMissionActive(status)) {
      intervalRef.current = setInterval(fetchLogs, 5000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [serviceId, status])

  return (
    <div className="bg-[#14111D] border border-[#33323E] rounded-lg overflow-hidden">
      <TerminalHeader isLive={isLive} hasLogs={logs.length > 0} />
      <div className="bg-[#14111D] p-4 h-96 overflow-y-auto font-mono text-xs">
        <LogContent logs={logs} isLoading={isLoading} error={error} />
      </div>
      <TerminalFooter logCount={logs.length} isLive={isLive} />
    </div>
  )
}
