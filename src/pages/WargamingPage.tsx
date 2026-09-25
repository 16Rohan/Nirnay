import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Crosshair,
  Cpu,
  Eye,
  Radio,
  Play,
  ArrowRight,
  RefreshCw,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  Activity,
  Compass,
  Zap,
  Info,
  Sliders,
  RotateCcw,
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'

// API Base URL
const API_BASE = 'http://localhost:8000'
const WS_BASE = 'ws://localhost:8000'

interface ScenarioPreset {
  preset_id: string
  name: string
  theater: string
  description: string
  default_objective: string
  default_constraints: string
  turn_durations_supported: string[]
  forces_summary: Record<string, string>
  terrain: string
  initial_weather: string
}

interface EmergentEvent {
  type: string
  description: string
  impact: string
}

interface TurnResult {
  session_id: string
  turn_number: int
  scenario_id: string
  parent_scenario_id?: string
  human_guidance: string
  concluded: boolean
  session_status: string
  metrics: {
    blue_losses_percentage: number
    red_losses_percentage: number
    termination_condition: string
    status: string
    objectives: Array<{ objective: string; status: string; score?: number }>
  }
  evaluation: {
    strategic_conclusion: string
    risks: string[]
    tradeoffs: string[]
    uncertainties: string[]
    strategic_implications: string[]
    emergent_events: EmergentEvent[]
  }
  decisions: {
    blue_coa_name: string
    blue_intent: string
    blue_actions_count: number
    red_intent: string
    red_actions_count: number
  }
  step_logs: string[]
  strategic_report?: string
  interpreted_command?: any
  timestamp: string
}

type int = number

const AGENT_PIPELINE_STAGES = [
  { id: 'memory', label: 'Context Memory', icon: Layers, tag: '[MEMORY]' },
  { id: 'orchestrator', label: 'Orchestrator', icon: Cpu, tag: '[ORCHESTRATOR]' },
  { id: 'validation', label: 'Validation', icon: CheckCircle2, tag: '[VALIDATION]' },
  { id: 'generator', label: 'Scenario Gen', icon: Compass, tag: '[SCENARIO GENERATOR]' },
  { id: 'environment', label: 'Environment', icon: Eye, tag: '[ENVIRONMENT]' },
  { id: 'blue_team', label: 'Blue Team', icon: Shield, tag: '[BLUE TEAM]' },
  { id: 'red_team', label: 'Red Team', icon: Crosshair, tag: '[RED TEAM]' },
  { id: 'simulator', label: 'Simulator', icon: Zap, tag: '[SIMULATOR]' },
  { id: 'evaluation', label: 'Evaluation', icon: Activity, tag: '[EVALUATION]' },
]

export default function WargamingPage() {
  // Preset & Configuration State
  const [presets, setPresets] = useState<ScenarioPreset[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState<string>('DEMO-001')
  const [turnDuration, setTurnDuration] = useState<string>('1m')
  const [humanGuidance, setHumanGuidance] = useState<string>('')
  const [humanConstraints, setHumanConstraints] = useState<string>('')
  const [showConfig, setShowConfig] = useState<boolean>(true)

  // Execution State
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentTurn, setCurrentTurn] = useState<TurnResult | null>(null)
  const [turnHistory, setTurnHistory] = useState<TurnResult[]>([])
  const [selectedTurnIndex, setSelectedTurnIndex] = useState<number>(0)
  const [isExecuting, setIsExecuting] = useState<boolean>(false)
  const [executionPhase, setExecutionPhase] = useState<string>('idle')
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [completedAgents, setCompletedAgents] = useState<string[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [showLogs, setShowLogs] = useState<boolean>(true)
  const [showReportModal, setShowReportModal] = useState<boolean>(false)

  // Human Command State
  const [commandText, setCommandText] = useState<string>('')
  const [isSubmittingCommand, setIsSubmittingCommand] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [wsConnected, setWsConnected] = useState<boolean>(false)

  const logEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // Fetch presets on load
  useEffect(() => {
    fetch(`${API_BASE}/wargame/presets`)
      .then((res) => res.json())
      .then((data: ScenarioPreset[]) => {
        if (data && data.length > 0) {
          setPresets(data)
          const def = data.find((p) => p.preset_id === 'DEMO-001') || data[0]
          setSelectedPresetId(def.preset_id)
          setHumanGuidance(def.default_objective)
          setHumanConstraints(def.default_constraints)
        }
      })
      .catch((err) => {
        console.warn('Backend presets fetch failed, using built-in defaults:', err)
        const fallback: ScenarioPreset = {
          preset_id: 'DEMO-001',
          name: 'Operation Resolve - Eastern Valley Standoff',
          theater: 'Eastern Valley Corridor',
          description:
            'Adversary 4th Armored Column advancing toward River Crossing LOC-BRAVO. Friendly 1st Mechanized Brigade tasked with defending Forward Logistics Point Alpha.',
          default_objective:
            'Defend Forward Logistics Point Alpha, hold river crossing corridor, deter adversary penetration without violating border buffer.',
          default_constraints: 'No kinetic cross-border strikes; fuel floor must remain above 24 hours.',
          turn_durations_supported: ['30s', '1m', '5m'],
          forces_summary: {
            blue: '1st Mechanized Brigade (94 units) at LOC-ALPHA',
            red: '4th Armored Column (108 units) at LOC-BRAVO',
          },
          terrain: 'Valley Basin, Moderate traversability, River barrier',
          initial_weather: 'Degrading rain, 6.5km visibility, muddy trail mobility penalty',
        }
        setPresets([fallback])
        setHumanGuidance(fallback.default_objective)
        setHumanConstraints(fallback.default_constraints)
      })
  }, [])

  // Update guidance when preset changes
  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId)
    const found = presets.find((p) => p.preset_id === presetId)
    if (found) {
      setHumanGuidance(found.default_objective)
      setHumanConstraints(found.default_constraints)
    }
  }

  // WebSocket Connection
  useEffect(() => {
    const wsUrl = sessionId ? `${WS_BASE}/ws/${sessionId}` : `${WS_BASE}/ws`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setWsConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'log') {
          setLogs((prev) => [...prev, data.log])
          if (data.agent_event) {
            setActiveAgentId(data.agent_event.agent)
            setCompletedAgents((prev) => (prev.includes(data.agent_event.agent) ? prev : [...prev, data.agent_event.agent]))
          }
        } else if (data.type === 'turn_completed') {
          setIsExecuting(false)
          setActiveAgentId(null)
        } else if (data.type === 'error') {
          setErrorMsg(data.error || 'Turn execution error')
          setIsExecuting(false)
          setActiveAgentId(null)
        }
      } catch (e) {
        // Raw text log
        setLogs((prev) => [...prev, event.data])
      }
    }

    ws.onclose = () => {
      setWsConnected(false)
    }

    return () => {
      ws.close()
    }
  }, [sessionId])

  // Scroll logs to bottom
  useEffect(() => {
    if (showLogs && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, showLogs])

  // Start Wargame
  const handleStartWargame = async () => {
    setIsExecuting(true)
    setErrorMsg(null)
    setLogs([])
    setCompletedAgents([])
    setActiveAgentId('memory')
    setExecutionPhase('running')

    try {
      const res = await fetch(`${API_BASE}/wargame/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preset_id: selectedPresetId,
          turn_duration: turnDuration,
          human_guidance: humanGuidance,
          human_constraints: humanConstraints,
          seed: 42,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to start wargame')
      }

      const turnResult: TurnResult = await res.json()
      setSessionId(turnResult.session_id)
      setCurrentTurn(turnResult)
      setTurnHistory([turnResult])
      setSelectedTurnIndex(0)
      setShowConfig(false)
      setLogs((prev) => [...prev, ...turnResult.step_logs.filter((l) => !prev.includes(l))])
    } catch (err: any) {
      setErrorMsg(err.message || 'Error initializing wargame session')
    } finally {
      setIsExecuting(false)
      setActiveAgentId(null)
    }
  }

  // Continue to next turn (Option A)
  const handleContinueTurn = async () => {
    if (!sessionId) return
    setIsExecuting(true)
    setErrorMsg(null)
    setActiveAgentId('memory')
    setCompletedAgents([])

    try {
      const res = await fetch(`${API_BASE}/wargame/continue/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to advance turn')
      }

      const turnResult: TurnResult = await res.json()
      setCurrentTurn(turnResult)
      setTurnHistory((prev) => [...prev, turnResult])
      setSelectedTurnIndex(turnHistory.length)
      setLogs((prev) => [...prev, ...turnResult.step_logs.filter((l) => !prev.includes(l))])
    } catch (err: any) {
      setErrorMsg(err.message || 'Error continuing wargame')
    } finally {
      setIsExecuting(false)
      setActiveAgentId(null)
    }
  }

  // Submit Human Command (Option B)
  const handleSubmitCommand = async () => {
    if (!sessionId || !commandText.trim()) return
    setIsSubmittingCommand(true)
    setIsExecuting(true)
    setErrorMsg(null)
    setActiveAgentId('orchestrator')
    setCompletedAgents([])

    try {
      const res = await fetch(`${API_BASE}/wargame/command/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: commandText,
          advance_turn: true,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to execute directive')
      }

      const turnResult: TurnResult = await res.json()
      setCurrentTurn(turnResult)
      setTurnHistory((prev) => [...prev, turnResult])
      setSelectedTurnIndex(turnHistory.length)
      setCommandText('')
      setLogs((prev) => [...prev, ...turnResult.step_logs.filter((l) => !prev.includes(l))])
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting directive')
    } finally {
      setIsSubmittingCommand(false)
      setIsExecuting(false)
      setActiveAgentId(null)
    }
  }

  const activePreset = presets.find((p) => p.preset_id === selectedPresetId) || presets[0]
  const displayedTurn = turnHistory[selectedTurnIndex] || currentTurn

  return (
    <div className="min-h-screen bg-[#02070D] text-[#F5FAFF] font-body selection:bg-[#42C7FF]/30 select-none pb-24">
      <Navbar />

      {/* Main Top Header */}
      <div className="pt-24 lg:pt-28 pb-6 px-6 lg:px-12 max-w-[1600px] mx-auto border-b border-[#168CFF]/15">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono tracking-widest uppercase bg-[#168CFF]/15 text-[#42C7FF] border border-[#168CFF]/30">
                <span className="w-2 h-2 rounded-full bg-[#42C7FF] animate-pulse" />
                NIRNAY WARGAME VERTICAL SLICE
              </span>
              {sessionId && (
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-white/70">
                  SESSION: {sessionId}
                </span>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold mt-2 tracking-tight text-white flex items-center gap-3">
              Autonomous Turn-Based Strategic Wargame
              {displayedTurn && (
                <span className="text-sm font-mono px-3 py-0.5 rounded bg-[#42C7FF]/20 text-[#63E6FF] border border-[#42C7FF]/40">
                  TURN {displayedTurn.turn_number} / SCENARIO {displayedTurn.scenario_id}
                </span>
              )}
            </h1>
          </div>

          {/* Quick Actions & Status */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#0A1929] hover:bg-[#0D2035] border border-[#168CFF]/20 text-[#A6B6C6] hover:text-white transition-all"
            >
              <Sliders className="w-4 h-4 text-[#42C7FF]" />
              {showConfig ? 'Hide Config' : 'Configure Scenario'}
            </button>
            {displayedTurn?.strategic_report && (
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#168CFF]/20 hover:bg-[#168CFF]/30 border border-[#42C7FF]/40 text-[#63E6FF] transition-all shadow-[0_0_15px_rgba(66,199,255,0.2)]"
              >
                <FileText className="w-4 h-4" />
                Strategic Report
              </button>
            )}
          </div>
        </div>

        {/* Multi-Agent Pipeline Visualization Bar */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#71869A] flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#42C7FF]" />
              Multi-Agent Closed-Loop Reasoning Chain
            </span>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className={`flex items-center gap-1.5 ${wsConnected ? 'text-[#42D99A]' : 'text-[#FF5968]'}`}>
                <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-[#42D99A]' : 'bg-[#FF5968]'}`} />
                {wsConnected ? 'LIVE SOCKET ACTIVE' : 'SOCKET OFFLINE'}
              </span>
              {isExecuting && (
                <span className="text-[#FFB347] animate-pulse flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  REASONING IN PROGRESS...
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
            {AGENT_PIPELINE_STAGES.map((stage) => {
              const StageIcon = stage.icon
              const isActive = activeAgentId === stage.id
              const isDone = completedAgents.includes(stage.id)

              let borderStyle = 'border-white/10'
              let bgStyle = 'bg-[#06111C]'
              let textStyle = 'text-[#71869A]'

              if (isActive) {
                borderStyle = 'border-[#42C7FF] shadow-[0_0_12px_rgba(66,199,255,0.4)]'
                bgStyle = 'bg-[#168CFF]/20'
                textStyle = 'text-[#63E6FF] font-semibold'
              } else if (isDone) {
                borderStyle = 'border-[#42D99A]/40'
                bgStyle = 'bg-[#42D99A]/10'
                textStyle = 'text-[#42D99A]'
              }

              return (
                <div
                  key={stage.id}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg border text-center transition-all ${borderStyle} ${bgStyle}`}
                >
                  <StageIcon className={`w-4 h-4 mb-1 ${textStyle}`} />
                  <span className={`text-[11px] leading-tight ${textStyle}`}>{stage.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-12 max-w-[1600px] mx-auto mt-6">
        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-[#FF5968]/15 border border-[#FF5968]/40 flex items-center gap-3 text-[#FF5968]">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Turn Timeline / Selector */}
        {turnHistory.length > 1 && (
          <div className="mb-6 p-3 rounded-xl bg-[#081521] border border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-[#A6B6C6] flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#42C7FF]" />
              Turn History Timeline:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto">
              {turnHistory.map((t, idx) => (
                <button
                  key={t.turn_number}
                  onClick={() => setSelectedTurnIndex(idx)}
                  className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                    selectedTurnIndex === idx
                      ? 'bg-[#168CFF] text-white font-bold shadow-[0_0_10px_rgba(22,140,255,0.5)]'
                      : 'bg-white/5 hover:bg-white/10 text-white/70'
                  }`}
                >
                  Turn {t.turn_number} (Scn {t.scenario_id})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Configuration Drawer */}
        <AnimatePresence>
          {showConfig && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 p-6 rounded-2xl bg-[#06111C] border border-[#168CFF]/20 shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#42C7FF]" />
                  <h2 className="text-lg font-display font-semibold text-white">Scenario Configuration</h2>
                </div>
                <span className="text-xs font-mono text-[#71869A]">PRD-01 Standard Template</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Preset Selector */}
                <div>
                  <label className="block text-xs font-mono uppercase text-[#A6B6C6] mb-2">Operational Preset</label>
                  <select
                    value={selectedPresetId}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    disabled={isExecuting}
                    className="w-full bg-[#0A1929] border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#42C7FF] outline-none"
                  >
                    {presets.map((p) => (
                      <option key={p.preset_id} value={p.preset_id}>
                        {p.name} ({p.theater})
                      </option>
                    ))}
                  </select>

                  {activePreset && (
                    <div className="mt-3 p-3 rounded-lg bg-[#02070D] border border-white/5 text-xs text-[#A6B6C6] space-y-1">
                      <p>
                        <strong className="text-white">Terrain:</strong> {activePreset.terrain}
                      </p>
                      <p>
                        <strong className="text-white">Weather:</strong> {activePreset.initial_weather}
                      </p>
                      <p>
                        <strong className="text-white">Blue:</strong> {activePreset.forces_summary?.blue || 'Mechanized Force'}
                      </p>
                      <p>
                        <strong className="text-white">Red:</strong> {activePreset.forces_summary?.red || 'Armored Column'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Duration & Constraints */}
                <div>
                  <label className="block text-xs font-mono uppercase text-[#A6B6C6] mb-2">Turn Horizon Duration</label>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {['30s', '1m', '5m'].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setTurnDuration(dur)}
                        className={`py-2 text-center rounded-lg text-xs font-mono border transition-all ${
                          turnDuration === dur
                            ? 'bg-[#168CFF]/20 border-[#42C7FF] text-[#63E6FF] font-bold'
                            : 'bg-[#0A1929] border-white/10 text-[#71869A] hover:text-white'
                        }`}
                      >
                        {dur}
                      </button>
                    ))}
                  </div>

                  <label className="block text-xs font-mono uppercase text-[#A6B6C6] mb-2">Operational Constraints</label>
                  <input
                    type="text"
                    value={humanConstraints}
                    onChange={(e) => setHumanConstraints(e.target.value)}
                    disabled={isExecuting}
                    className="w-full bg-[#0A1929] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#42C7FF] outline-none"
                    placeholder="e.g. No kinetic strikes past median line"
                  />
                </div>

                {/* Human Guidance Directive */}
                <div>
                  <label className="block text-xs font-mono uppercase text-[#A6B6C6] mb-2">Human Strategic Guidance</label>
                  <textarea
                    rows={4}
                    value={humanGuidance}
                    onChange={(e) => setHumanGuidance(e.target.value)}
                    disabled={isExecuting}
                    className="w-full bg-[#0A1929] border border-white/15 rounded-xl p-3 text-xs text-white focus:border-[#42C7FF] outline-none resize-none"
                    placeholder="Enter human commander strategic guidance..."
                  />

                  <button
                    onClick={handleStartWargame}
                    disabled={isExecuting}
                    className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl font-display font-semibold text-sm bg-gradient-to-r from-[#168CFF] to-[#249DFF] hover:from-[#249DFF] hover:to-[#42C7FF] text-white shadow-[0_0_20px_rgba(22,140,255,0.4)] disabled:opacity-50 transition-all"
                  >
                    {isExecuting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        EXECUTING WARGAME CYCLE...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        INITIALIZE WARGAME SESSION
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Turn Results Dashboard */}
        {displayedTurn ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Battlefield Metrics & COA (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Tactical Outcome Card */}
              <div className="p-6 rounded-2xl bg-[#06111C] border border-white/10 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#42C7FF] flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    SIMULATION RESOLUTION METRICS
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-[#42D99A]/15 text-[#42D99A] border border-[#42D99A]/30">
                    {displayedTurn.metrics.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  {/* Blue Attrition */}
                  <div className="p-4 rounded-xl bg-[#0A1929] border border-white/5">
                    <span className="text-xs font-mono text-[#71869A] block mb-1">Friendly (Blue) Attrition</span>
                    <div className="text-2xl font-mono font-bold text-[#42C7FF]">
                      {displayedTurn.metrics.blue_losses_percentage}%
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-[#42C7FF] h-full rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(displayedTurn.metrics.blue_losses_percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Red Attrition */}
                  <div className="p-4 rounded-xl bg-[#0A1929] border border-white/5">
                    <span className="text-xs font-mono text-[#71869A] block mb-1">Adversary (Red) Attrition</span>
                    <div className="text-2xl font-mono font-bold text-[#FF5968]">
                      {displayedTurn.metrics.red_losses_percentage}%
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-[#FF5968] h-full rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(displayedTurn.metrics.red_losses_percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Termination Condition */}
                <div className="p-3 rounded-lg bg-[#02070D] border border-white/5 text-xs font-mono mb-4 flex items-center justify-between">
                  <span className="text-[#71869A]">Termination Condition:</span>
                  <span className="text-[#FFB347] font-semibold">{displayedTurn.metrics.termination_condition}</span>
                </div>

                {/* Objectives */}
                {displayedTurn.metrics.objectives?.length > 0 && (
                  <div>
                    <span className="text-xs font-mono text-[#71869A] block mb-2">Tactical Objectives</span>
                    <div className="space-y-2">
                      {displayedTurn.metrics.objectives.map((obj, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-[#0A1929] border border-white/5 text-xs"
                        >
                          <span className="text-white font-medium">{obj.objective}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                              obj.status === 'SUCCESS' || obj.status === 'HELD'
                                ? 'bg-[#42D99A]/20 text-[#42D99A]'
                                : 'bg-[#FFB347]/20 text-[#FFB347]'
                            }`}
                          >
                            {obj.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* COA and Decisions */}
              <div className="p-6 rounded-2xl bg-[#06111C] border border-white/10 shadow-lg space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#71869A] flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#42C7FF]" />
                  OPPOSING COURSES OF ACTION
                </h3>

                {/* Blue COA */}
                <div className="p-4 rounded-xl bg-[#0A1929] border-l-4 border-l-[#42C7FF] border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#42C7FF] uppercase">Blue Force COA</span>
                    <span className="text-[11px] font-mono text-[#71869A]">
                      {displayedTurn.decisions.blue_actions_count} Actions
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white mt-1">{displayedTurn.decisions.blue_coa_name}</div>
                  <p className="text-xs text-[#A6B6C6] mt-1">{displayedTurn.decisions.blue_intent}</p>
                </div>

                {/* Red Response */}
                <div className="p-4 rounded-xl bg-[#0A1929] border-l-4 border-l-[#FF5968] border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#FF5968] uppercase">Red Response</span>
                    <span className="text-[11px] font-mono text-[#71869A]">
                      {displayedTurn.decisions.red_actions_count} Actions
                    </span>
                  </div>
                  <p className="text-xs text-[#A6B6C6] mt-1">{displayedTurn.decisions.red_intent}</p>
                </div>
              </div>

              {/* Emergent Developments */}
              {displayedTurn.evaluation.emergent_events?.length > 0 && (
                <div className="p-5 rounded-2xl bg-[#FFB347]/10 border border-[#FFB347]/30 space-y-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#FFB347] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    EMERGENT STRATEGIC SHIFTS
                  </span>
                  {displayedTurn.evaluation.emergent_events.map((ev, i) => (
                    <div key={i} className="text-xs text-white">
                      <strong className="text-[#FFB347]">[{ev.type}]:</strong> {ev.description}
                      <span className="text-[#A6B6C6] block mt-0.5">Impact: {ev.impact}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Strategic Evaluation & HITL Console (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Executive Conclusion */}
              <div className="p-6 rounded-2xl bg-[#06111C] border border-[#168CFF]/20 shadow-lg">
                <span className="text-xs font-mono uppercase tracking-widest text-[#63E6FF] flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4" />
                  EVALUATION AGENT ASSESSMENT
                </span>
                <p className="text-sm lg:text-base leading-relaxed text-[#F5FAFF] font-medium">
                  {displayedTurn.evaluation.strategic_conclusion || 'Strategic assessment completed.'}
                </p>
              </div>

              {/* Four Pillars of Decision Intelligence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strategic Risks */}
                <div className="p-5 rounded-2xl bg-[#06111C] border border-white/10">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#FF5968] flex items-center gap-2 mb-3">
                    <AlertCircle className="w-4 h-4" />
                    Strategic Risks
                  </span>
                  <ul className="space-y-2">
                    {(displayedTurn.evaluation.risks || ['No critical escalation breaches detected.']).map((r, i) => (
                      <li key={i} className="text-xs text-[#A6B6C6] flex items-start gap-2">
                        <span className="text-[#FF5968]">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Trade-offs */}
                <div className="p-5 rounded-2xl bg-[#06111C] border border-white/10">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#FFB347] flex items-center gap-2 mb-3">
                    <Sliders className="w-4 h-4" />
                    Operational Trade-offs
                  </span>
                  <ul className="space-y-2">
                    {(displayedTurn.evaluation.tradeoffs || ['Resource utilization balanced against reserve margins.']).map(
                      (t, i) => (
                        <li key={i} className="text-xs text-[#A6B6C6] flex items-start gap-2">
                          <span className="text-[#FFB347]">•</span>
                          <span>{t}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* Uncertainties */}
                <div className="p-5 rounded-2xl bg-[#06111C] border border-white/10">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#42C7FF] flex items-center gap-2 mb-3">
                    <Radio className="w-4 h-4" />
                    Information Gaps & Uncertainties
                  </span>
                  <ul className="space-y-2">
                    {(displayedTurn.evaluation.uncertainties || ['Adversary reserves echelon location unconfirmed.']).map(
                      (u, i) => (
                        <li key={i} className="text-xs text-[#A6B6C6] flex items-start gap-2">
                          <span className="text-[#42C7FF]">•</span>
                          <span>{u}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* Strategic Implications */}
                <div className="p-5 rounded-2xl bg-[#06111C] border border-white/10">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#42D99A] flex items-center gap-2 mb-3">
                    <Compass className="w-4 h-4" />
                    Strategic Implications
                  </span>
                  <ul className="space-y-2">
                    {(
                      displayedTurn.evaluation.strategic_implications || ['Deterrence posture stabilized along boundary.']
                    ).map((s, i) => (
                      <li key={i} className="text-xs text-[#A6B6C6] flex items-start gap-2">
                        <span className="text-[#42D99A]">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* HUMAN-IN-THE-LOOP (HITL) DECISION POINT */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-[#081521] to-[#040F1A] border-2 border-[#168CFF]/50 shadow-[0_0_30px_rgba(22,140,255,0.15)] relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#42D99A] animate-ping" />
                    <h3 className="text-base font-display font-bold text-white tracking-wide">
                      HUMAN COMMAND DECISION POINT
                    </h3>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 rounded bg-[#168CFF]/20 text-[#63E6FF] border border-[#168CFF]/30">
                    AWAITING OPERATOR INPUT
                  </span>
                </div>

                <p className="text-xs text-[#A6B6C6] mb-5">
                  Choose to proceed with the existing strategic posture or issue an operational directive via natural language.
                  Directives are translated into structured contracts by the Orchestrator NIM LLM.
                </p>

                {/* Last Interpreted Command Badge */}
                {displayedTurn.interpreted_command && (
                  <div className="mb-4 p-3 rounded-xl bg-[#168CFF]/15 border border-[#42C7FF]/30 text-xs">
                    <span className="font-mono text-[#63E6FF] font-bold block mb-1">
                      RECENT DIRECTIVE TRANSLATED BY NIM LLM:
                    </span>
                    <p className="text-white italic">"{displayedTurn.interpreted_command.input?.text}"</p>
                    {displayedTurn.interpreted_command.input?.constraints?.length > 0 && (
                      <span className="text-[#FFB347] block mt-1 font-mono">
                        Extracted Constraints: {displayedTurn.interpreted_command.input.constraints.join(', ')}
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  {/* Option A: CONTINUE */}
                  <div className="md:col-span-4">
                    <button
                      onClick={handleContinueTurn}
                      disabled={isExecuting || displayedTurn.concluded}
                      className="w-full py-3.5 px-4 rounded-xl text-xs font-mono font-bold tracking-wider bg-white/5 hover:bg-white/10 text-white border border-white/20 hover:border-white/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowRight className="w-4 h-4 text-[#42C7FF]" />
                      OPTION A: CONTINUE
                    </button>
                    <span className="text-[10px] text-[#71869A] text-center block mt-1">Advance Turn N+1 as planned</span>
                  </div>

                  {/* Option B: NATURAL LANGUAGE DIRECTIVE */}
                  <div className="md:col-span-8 space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={commandText}
                        onChange={(e) => setCommandText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitCommand()}
                        disabled={isExecuting || displayedTurn.concluded}
                        placeholder="Option B: 'Shift 1st Mech to south ford, preserve fuel...'"
                        className="w-full bg-[#02070D] border border-white/20 rounded-xl px-4 py-3 text-xs text-white placeholder-[#71869A] focus:border-[#42C7FF] outline-none pr-28"
                      />
                      <button
                        onClick={handleSubmitCommand}
                        disabled={isExecuting || !commandText.trim() || displayedTurn.concluded}
                        className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg text-xs font-mono font-bold bg-[#168CFF] hover:bg-[#249DFF] text-white disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(22,140,255,0.4)]"
                      >
                        {isSubmittingCommand ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        TRANSMIT
                      </button>
                    </div>

                    {/* Command Suggestions */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        'Hold fire until adversary crosses median',
                        'Shift 1st Mech Brigade to East Ford',
                        'Preserve fuel floor above 35%',
                      ].map((sugg) => (
                        <button
                          key={sugg}
                          type="button"
                          onClick={() => setCommandText(sugg)}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 hover:bg-white/10 text-[#A6B6C6] hover:text-white border border-white/5 transition-all"
                        >
                          + {sugg}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty / Initial Splash */
          <div className="py-20 text-center rounded-3xl bg-[#06111C] border border-white/10 p-8">
            <Compass className="w-16 h-16 text-[#42C7FF] mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-display font-semibold text-white">No Active Wargame Session</h2>
            <p className="text-sm text-[#A6B6C6] max-w-md mx-auto mt-2 mb-6">
              Select an operational preset above and click <strong>Initialize Wargame Session</strong> to trigger the
              multi-agent reasoning pipeline.
            </p>
            <button
              onClick={() => setShowConfig(true)}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-[#168CFF] text-white hover:bg-[#249DFF] transition-all"
            >
              Open Configuration Panel
            </button>
          </div>
        )}

        {/* Live Terminal Log Stream (Collapsible) */}
        <div className="mt-8 rounded-2xl bg-[#02070D] border border-white/10 overflow-hidden shadow-2xl">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="w-full px-5 py-3 bg-[#06111C] border-b border-white/5 flex items-center justify-between text-xs font-mono text-[#A6B6C6] hover:text-white transition-all"
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#42C7FF]" />
              <span>LIVE AGENT REASONING STREAM & TELEMETRY</span>
              <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-[#71869A]">{logs.length} logs</span>
            </div>
            {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showLogs && (
            <div className="p-4 h-56 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1 bg-[#02070D]/90 select-text">
              {logs.length === 0 ? (
                <div className="text-[#71869A] italic">Awaiting session launch...</div>
              ) : (
                logs.map((log, index) => {
                  let colorClass = 'text-[#F5FAFF]'
                  if (log.includes('[MEMORY]')) colorClass = 'text-[#D946EF]'
                  else if (log.includes('[ORCHESTRATOR]')) colorClass = 'text-[#38BDF8]'
                  else if (log.includes('[VALIDATION]')) colorClass = 'text-[#4ADE80]'
                  else if (log.includes('[SCENARIO GENERATOR]')) colorClass = 'text-[#22D3EE]'
                  else if (log.includes('[ENVIRONMENT]')) colorClass = 'text-[#FACC15]'
                  else if (log.includes('[BLUE TEAM]')) colorClass = 'text-[#60A5FA]'
                  else if (log.includes('[RED TEAM]')) colorClass = 'text-[#F87171]'
                  else if (log.includes('[SIMULATOR]')) colorClass = 'text-[#86EFAC]'
                  else if (log.includes('[EVALUATION]')) colorClass = 'text-[#C084FC]'
                  else if (log.includes('[PERSISTENT MEMORY]')) colorClass = 'text-[#FB923C]'

                  return (
                    <div key={index} className={`${colorClass} hover:bg-white/5 px-1 rounded`}>
                      {log}
                    </div>
                  )
                })
              )}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Strategic Report Modal */}
      {showReportModal && displayedTurn?.strategic_report && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#06111C] border border-[#168CFF]/30 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#081521]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#42C7FF]" />
                <h3 className="font-display font-bold text-white text-lg">NIRNAY Strategic Decision Report</h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-[#71869A] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto font-mono text-xs text-[#F5FAFF] leading-relaxed whitespace-pre-wrap select-text">
              {displayedTurn.strategic_report}
            </div>
            <div className="p-4 border-t border-white/10 flex justify-end bg-[#081521]">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
