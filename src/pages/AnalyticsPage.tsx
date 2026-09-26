import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart2, Shield, Crosshair, TrendingDown, Activity, AlertTriangle, ArrowRight } from 'lucide-react'
import { useWargameStore } from '../store/wargameStore'

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const { activeSessionId, turnHistory, currentTurnResult } = useWargameStore()

  return (
    <div className="max-w-[1500px] mx-auto px-6 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-cyan-400 uppercase">
            <BarChart2 className="w-4 h-4" />
            <span>CAMPAIGN INTELLIGENCE & METRICS</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-wide mt-1">
            CAMPAIGN ANALYTICS
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Turn-by-turn quantitative force attrition trajectories, strategic risk distributions, agent action counts, and objective score trends.
          </p>
        </div>
      </div>

      {!activeSessionId ? (
        <div className="bg-[rgba(4,15,26,0.85)] border border-slate-800 rounded-xl p-12 text-center font-mono space-y-4">
          <BarChart2 className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
          <h3 className="text-lg font-bold text-white">No Analytics Available</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Analytics are dynamically calculated during active campaign execution. Launch a wargame to view real force attrition curves.
          </p>
          <button
            onClick={() => navigate('/wargaming')}
            className="px-5 py-2.5 rounded bg-[#42C7FF] text-space-navy font-display font-bold text-xs uppercase tracking-wider hover:bg-[#63E6FF] transition-all inline-flex items-center gap-2"
          >
            <span>LAUNCH WARGAME</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Turn-by-Turn Attrition Trajectory */}
          <div className="bg-[rgba(4,15,26,0.85)] border border-[rgba(100,190,255,0.2)] rounded-xl p-6 backdrop-blur-md space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-mono text-xs font-bold text-[#42C7FF] uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" /> FORCE LOSS ATTRITION TRAJECTORY (TURN HISTORY)
              </h3>
              <span className="text-xs font-mono text-slate-400">Total Turns Executed: {turnHistory.length}</span>
            </div>

            <div className="space-y-6">
              {turnHistory.map((t) => {
                const blueLoss = t.metrics.blue_losses_percentage
                const redLoss = t.metrics.red_losses_percentage
                return (
                  <div key={t.turn_number} className="bg-[#02070D]/80 border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-3">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-white">TURN {t.turn_number}</span>
                      <span className="text-slate-400">STATUS: {t.session_status}</span>
                    </div>

                    {/* Blue Loss Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-blue-400 flex items-center gap-1"><Shield className="w-3 h-3" /> Blue Attrition</span>
                        <span className="text-slate-300 font-bold">{blueLoss.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${blueLoss}%` }} />
                      </div>
                    </div>

                    {/* Red Loss Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-red-400 flex items-center gap-1"><Crosshair className="w-3 h-3" /> Red Attrition</span>
                        <span className="text-slate-300 font-bold">{redLoss.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${redLoss}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
