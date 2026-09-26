import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass, Shield, Crosshair, ArrowRight, Play, CheckCircle, Radio, MapPin, Wind } from 'lucide-react'
import { useWargameStore, ScenarioPreset } from '../store/wargameStore'

const API_BASE = 'http://localhost:8000'

export default function ScenariosPage() {
  const navigate = useNavigate()
  const { presets, setPresets, setSelectedPreset, activeSessionId } = useWargameStore()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('all')

  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE}/wargame/presets`)
      .then((res) => res.json())
      .then((data) => {
        setPresets(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load presets:', err)
        setLoading(false)
      })
  }, [setPresets])

  const handleSelectPreset = (preset: ScenarioPreset) => {
    setSelectedPreset(preset)
    navigate('/wargaming')
  }

  return (
    <div className="max-w-[1500px] mx-auto px-6 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#42C7FF] uppercase">
            <Compass className="w-4 h-4" />
            <span>OPERATIONAL SCENARIO LIBRARY</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-wide mt-1">
            SCENARIO ARCHITECTURE & PRESETS
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Derived directly from NIRNAY dynamic scenario contracts and environmental assessment models. Select a threat theater to launch an operational wargaming campaign.
          </p>
        </div>
      </div>

      {/* Scenario Presets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {presets.map((preset) => (
          <div
            key={preset.preset_id}
            className="bg-[rgba(4,15,26,0.85)] border border-[rgba(100,190,255,0.2)] hover:border-[#42C7FF] rounded-xl p-6 backdrop-blur-md flex flex-col justify-between transition-all space-y-6 group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-[#42C7FF]/10 text-[#42C7FF] border border-[#42C7FF]/30 rounded uppercase tracking-wider">
                  {preset.theater}
                </span>
                <span className="text-xs font-mono text-slate-400">{preset.preset_id}</span>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-white group-hover:text-[#42C7FF] transition-colors">
                  {preset.name}
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{preset.description}</p>
              </div>

              {/* Environmental & Terrain details */}
              <div className="bg-[#02070D]/70 border border-slate-800 rounded-lg p-3 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Terrain Profile:
                  </span>
                  <span className="text-white capitalize">{preset.terrain}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-amber-400" /> Initial Weather:
                  </span>
                  <span className="text-white capitalize">{preset.initial_weather}</span>
                </div>
              </div>

              {/* Forces Summary */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-bold">ORBAT Summary</div>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <div className="bg-blue-950/20 border border-blue-500/20 p-2.5 rounded">
                    <span className="text-blue-400 font-bold block text-[10px] uppercase">BLUE FORCES</span>
                    <span className="text-slate-200">{preset.forces_summary?.blue || '2 Battalions'}</span>
                  </div>
                  <div className="bg-red-950/20 border border-red-500/20 p-2.5 rounded">
                    <span className="text-red-400 font-bold block text-[10px] uppercase">RED FORCES</span>
                    <span className="text-slate-200">{preset.forces_summary?.red || '1 Regiment'}</span>
                  </div>
                </div>
              </div>

              {/* Strategic Objective */}
              <div className="text-xs font-mono">
                <span className="text-slate-400 uppercase block mb-1">Primary Directive</span>
                <p className="text-slate-300 bg-slate-900/60 border border-slate-800 p-2.5 rounded text-[11px]">
                  {preset.default_objective}
                </p>
              </div>
            </div>

            {/* Launch Action */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                Turns Supported: {preset.turn_durations_supported?.join(', ') || '1-5'}
              </span>
              <button
                onClick={() => handleSelectPreset(preset)}
                className="px-5 py-2 rounded bg-[#42C7FF] text-space-navy font-display font-bold text-xs uppercase tracking-wider hover:bg-[#63E6FF] transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(66,199,255,0.3)]"
              >
                <span>LAUNCH CAMPAIGN</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
