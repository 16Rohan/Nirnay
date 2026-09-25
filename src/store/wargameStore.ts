import { create } from 'zustand'

export interface ScenarioPreset {
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

export interface EmergentEvent {
  type: string
  description: string
  impact: string
}

export interface TurnResult {
  session_id: string
  turn_number: number
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

export interface SessionOverview {
  session_id: string
  preset_id: string
  theater: string
  current_turn: number
  status: string
  turn_duration: string
  created_at: string
  total_turns: number
  turns: TurnResult[]
}

interface WargameState {
  // Active Session State
  activeSessionId: string | null
  currentTurnResult: TurnResult | null
  sessionOverview: SessionOverview | null
  turnHistory: TurnResult[]
  
  // Scenarios
  presets: ScenarioPreset[]
  selectedPreset: ScenarioPreset | null
  
  // Execution Status
  isExecuting: boolean
  currentStage: string | null
  
  // Actions
  setActiveSessionId: (sessionId: string | null) => void
  setCurrentTurnResult: (result: TurnResult | null) => void
  setSessionOverview: (overview: SessionOverview | null) => void
  addTurnResult: (result: TurnResult) => void
  setPresets: (presets: ScenarioPreset[]) => void
  setSelectedPreset: (preset: ScenarioPreset | null) => void
  setIsExecuting: (isExecuting: boolean) => void
  setCurrentStage: (stage: string | null) => void
  resetSession: () => void
}

export const useWargameStore = create<WargameState>((set) => ({
  activeSessionId: null,
  currentTurnResult: null,
  sessionOverview: null,
  turnHistory: [],
  
  presets: [],
  selectedPreset: null,
  
  isExecuting: false,
  currentStage: null,
  
  setActiveSessionId: (sessionId) => set({ activeSessionId: sessionId }),
  setCurrentTurnResult: (result) => set((state) => {
    if (!result) return { currentTurnResult: null }
    const exists = state.turnHistory.some(t => t.turn_number === result.turn_number)
    const updatedHistory = exists 
      ? state.turnHistory.map(t => t.turn_number === result.turn_number ? result : t)
      : [...state.turnHistory, result]
    return {
      currentTurnResult: result,
      activeSessionId: result.session_id,
      turnHistory: updatedHistory
    }
  }),
  setSessionOverview: (overview) => set({
    sessionOverview: overview,
    activeSessionId: overview ? overview.session_id : null,
    turnHistory: overview ? overview.turns : []
  }),
  addTurnResult: (result) => set((state) => ({
    currentTurnResult: result,
    activeSessionId: result.session_id,
    turnHistory: [...state.turnHistory.filter(t => t.turn_number !== result.turn_number), result]
  })),
  setPresets: (presets) => set({ presets }),
  setSelectedPreset: (preset) => set({ selectedPreset: preset }),
  setIsExecuting: (isExecuting) => set({ isExecuting }),
  setCurrentStage: (stage) => set({ currentStage: stage }),
  resetSession: () => set({
    activeSessionId: null,
    currentTurnResult: null,
    sessionOverview: null,
    turnHistory: [],
    isExecuting: false,
    currentStage: null
  })
}))
