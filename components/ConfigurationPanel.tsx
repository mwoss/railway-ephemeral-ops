"use client"

import {
  AlertTriangle,
  Clock,
  Image as ImageIcon,
  Infinity,
  Info,
  Loader2,
  Rocket,
  Terminal,
  X,
} from "lucide-react"
import { useEffect, useState } from "react"
import { DEFAULT_IMAGES, TTL_OPTIONS } from "@/lib/types"

interface ConfigurationPanelProps {
  onSubmit: (image: string, command: string, ttl: number | null) => void
  isLoading: boolean
  onClose?: () => void
}

interface PanelHeaderProps {
  onClose?: () => void
}

interface ImageSelectorProps {
  image: string
  onImageChange: (image: string) => void
}

interface CommandInputProps {
  command: string
  onCommandChange: (command: string) => void
}

interface TTLSelectorProps {
  ttl: number | null
  onTTLChange: (ttl: number | null) => void
}

interface SubmitButtonProps {
  isLoading: boolean
  ttl: number | null
}

const IMAGE_COMMANDS: Record<string, string> = {
  "python:3.9-slim":
    "python -c \"import sys; print(f'Python {sys.version}'); print('Hello from Railway Runner!')\"",
  "python:3.11-slim":
    "python -c \"print('Installing requests...'); import subprocess; subprocess.check_call(['pip', 'install', 'requests']); import requests; r = requests.get('https://api.github.com'); print(f'GitHub API Status: {r.status_code}')\"",
  "node:18-alpine":
    "node -e \"console.log('Node.js', process.version); console.log('Hello from Railway Runner!'); console.log('Platform:', process.platform);\"",
  "node:20-alpine":
    "node -e \"const https = require('https'); console.log('Fetching data...'); https.get('https://api.github.com/users/github', (res) => { let data = ''; res.on('data', chunk => data += chunk); res.on('end', () => console.log('GitHub API Response:', JSON.parse(data).name)); });\"",
  "golang:1.23-alpine":
    'sh -c "apk add --no-cache curl && curl -sL https://gist.githubusercontent.com/mwoss/b5dc525fa532adee1bcc39c2e823ab0a/raw/4f56efb07545ff801c6978c5a6ab8205a6f04ea9/one_off_railway.go -o temp_run.go && go run temp_run.go && rm temp_run.go"',
}

function PanelHeader({ onClose }: PanelHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">New Mission</h2>
        <p className="text-gray-500 text-xs">Configure your ephemeral container deployment</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="w-8 h-8 rounded hover:bg-white/5 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      )}
    </div>
  )
}

function ImageSelector({ image, onImageChange }: ImageSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wider">
          <ImageIcon className="w-4 h-4" />
          Image Source
        </label>
        <div className="group relative">
          <Info className="w-3 h-3 text-gray-500 hover:text-gray-400 cursor-help transition-colors" />
          <div className="absolute right-0 top-6 w-80 p-3 bg-[#191622] border border-[#33323E] rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            <p className="text-xs text-white leading-relaxed">
              Enter any Docker image from a supported registry.
            </p>
            <p className="text-xs text-gray-400 mt-2 font-mono">
              <span className="text-purple-400">Supported registries:</span>
              <br />• Docker Hub
              <br />• GitHub Container Registry
              <br />• GitLab Container Registry
              <br />• Microsoft Container Registry
              <br />• Quay.io
            </p>
          </div>
        </div>
      </div>
      <input
        type="text"
        value={image}
        onChange={(e) => onImageChange(e.target.value)}
        placeholder="e.g., python:3.9-slim"
        className="w-full bg-[#14111D] border border-[#33323E] focus:border-[#48286B] focus:ring-0 rounded-lg px-3 py-2 text-white font-mono text-sm placeholder-gray-600 transition-all"
        required
      />
      <div className="flex flex-wrap gap-2">
        {DEFAULT_IMAGES.map((img) => (
          <button
            key={img}
            type="button"
            onClick={() => onImageChange(img)}
            className={`px-2 py-1 rounded text-xs font-mono transition-all ${
              image === img
                ? "bg-purple-500/20 text-purple-400 border border-purple-500"
                : "bg-transparent text-gray-500 border border-[#33323E] hover:border-[#4a4956]"
            }`}
          >
            {img}
          </button>
        ))}
      </div>
    </div>
  )
}

function CommandInput({ command, onCommandChange }: CommandInputProps) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wider">
        <Terminal className="w-4 h-4" />
        Payload (Command)
      </label>
      <textarea
        value={command}
        onChange={(e) => onCommandChange(e.target.value)}
        placeholder="Enter your command..."
        rows={4}
        className="w-full bg-[#14111D] border border-[#33323E] focus:border-[#48286B] focus:ring-0 rounded-lg px-3 py-2 text-white font-mono text-sm placeholder-gray-600 transition-all resize-none"
        required
      />
    </div>
  )
}

function TTLSelector({ ttl, onTTLChange }: TTLSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wider">
        <Clock className="w-4 h-4" />
        Time-To-Live (TTL)
      </label>

      <div className="grid grid-cols-2 gap-3">
        {TTL_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onTTLChange(option.value)}
            className={`px-3 py-2 rounded-lg font-mono text-sm transition-all ${
              ttl === option.value
                ? "bg-purple-500/20 text-purple-400 border border-purple-500"
                : "bg-transparent text-gray-500 border border-[#33323E] hover:border-[#4a4956]"
            }`}
          >
            {option.label}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onTTLChange(null)}
          className={`col-span-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-mono text-sm transition-all ${
            ttl === null
              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500"
              : "bg-transparent text-gray-500 border border-[#33323E] hover:border-yellow-500/50 hover:text-yellow-100"
          }`}
        >
          <Infinity className="w-4 h-4" />
          Manual Stop (Indefinite)
        </button>
      </div>

      {ttl === null && (
        <div className="mt-2 text-[11px] text-yellow-500/80 flex items-center gap-1.5 font-mono">
          <AlertTriangle size={12} />
          Billing continues until stopped manually or process exits.
        </div>
      )}
    </div>
  )
}

function SubmitButton({ isLoading, ttl }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className={`w-full font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm ${
        isLoading
          ? "bg-white/5 text-gray-500 cursor-not-allowed"
          : "bg-[#853bce] hover:bg-[#A667E4] text-white"
      }`}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />}
      {isLoading
        ? "Launching Mission..."
        : ttl === null
          ? "Start Indefinite Mission"
          : "Run Mission"}
    </button>
  )
}

export function ConfigurationPanel({ onSubmit, isLoading, onClose }: ConfigurationPanelProps) {
  const [image, setImage] = useState("python:3.9-slim")
  const [command, setCommand] = useState(IMAGE_COMMANDS["python:3.9-slim"])
  const [ttl, setTtl] = useState<number | null>(5)

  useEffect(() => {
    if (IMAGE_COMMANDS[image]) {
      setCommand(IMAGE_COMMANDS[image])
    }
  }, [image])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(image, command, ttl)
  }

  return (
    <div className="space-y-4">
      <PanelHeader onClose={onClose} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <ImageSelector image={image} onImageChange={setImage} />
        <CommandInput command={command} onCommandChange={setCommand} />
        <TTLSelector ttl={ttl} onTTLChange={setTtl} />
        <SubmitButton isLoading={isLoading} ttl={ttl} />
      </form>
    </div>
  )
}
