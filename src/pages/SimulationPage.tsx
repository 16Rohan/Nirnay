import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Shield, Crosshair, CheckCircle2, AlertOctagon, Activity, FileText, ArrowRight } from 'lucide-react'
import { useWargameStore } from '../store/wargameStore'

export default function SimulationPage() {
  const navigate = useNavigate()
  const { activeSessionId, currentTurnResult, turnHistory } = useWargameStore()

  const currentTurn = currentTurnResult ? currentTurnResult.turn_number : turnHistory.length
  const blueLoss = currentTurnResult?.metrics.blue_losses_percentage ?? 0
  const redLoss = currentTurnResult?.metrics.red_losses_percentage ?? 0

  return (
    <div className="max-w-[1500px] mx-auto px-6 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-amber-400 uppercase">
            <Zap className="w-4 h-4" />
            <span>DETERMINISTIC SIMULATION ADJUDICATION</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-wide mt-1">
            SIMULATION ENGINE STATE & OUTCOMES
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Inspect the underlying rule-based combat adjudication output, Lanchester differential attrition equations, action validity checks, and state transitions for each turn.
          </p>
        </div>

        {activeSessionId && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/wargaming')}
              className="px-4 py-2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold hover:bg-amber-500/30 transition-all flex items-center gap-2"
            >
              <span>RETURN TO CONSOLE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {!activeSessionId ? (
        <div className="bg-[rgba(4,15,26,0.85)] border border-slate-800 rounded-xl p-12 text-center font-mono space-y-4">
          <Zap className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
          <h3 className="text-lg font-bold text-white">No Simulation Results Available</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Run a turn from the Wargaming Console to execute the deterministic simulation engine and inspect combat adjudication metrics.
          </p>
          <button
            onClick={() => navigate('/wargaming')}
            className="px-5 py-2.5 rounded bg-[#42C7FF] text-space-navy font-display font-bold text-xs uppercase tracking-wider hover:bg-[#63E6FF] transition-all inline-flex items-center gap-2"
          >
            <span>START WARGAME SESSION</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Status Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[rgba(4,15,26,0.85)] border border-slate-800 rounded-xl p-4 font-mono">
              <span className="text-slate-400 text-[10px] uppercase">CAMPAIGN ID</span>
              <div className="text-lg font-bold text-white mt-1">{activeSessionId}</div>
            </div>

            <div className="bg-[rgba(4,15,26,0.85)] border border-slate-800 rounded-xl p-4 font-mono">
              <span className="text-slate-400 text-[10px] uppercase">SIMULATED TURN</span>
              <div className="text-lg font-bold text-[#42C7FF] mt-1">TURN {currentTurn} / 5</div>
            </div>

            <div className="bg-[rgba(4,15,26,0.85)] border border-blue-500/30 rounded-xl p-4 font-mono">
              <span className="text-blue-400 text-[10px] uppercase">BLUE ATTRITION</span>
              <div className="text-lg font-bold text-white mt-1">{blueLoss.toFixed(1)}%</div>
            </div>

            <div className="bg-[rgba(4,15,26,0.85)] border border-red-500/30 rounded-xl p-4 font-mono">
              <span className="text-red-400 text-[10px] uppercase">RED ATTRITION</span>
              <div className="text-lg font-bold text-white mt-1">{redLoss.toFixed(1)}%</div>
            </div>
          </div>

          {/* Detailed Turn Adjudication Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Decided COAs */}
            <div className="bg-[rgba(4,15,26,0.85)] border border-[rgba(100,190,255,0.2)] rounded-xl p-6 backdrop-blur-md space-y-6">
              <h3 className="font-mono text-xs font-bold text-[#42C7FF] uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4" /> AGENT ACTIONS ADJUDICATED
              </h3>

              <div className="space-y-4">
                {/* Blue Team Actions */}
                <div className="bg-blue-950/20 border border-blue-500/20 rounded-lg p-4 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between text-blue-400 font-bold uppercase">
                    <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> BLUE COA: {currentTurnResult?.decisions.blue_coa_name}</span>
                    <span>{currentTurnResult?.decisions.blue_actions_count || 3} Actions</span>
                  </div>
                  <p className="text-slate-300">{currentTurnResult?.decisions.blue_intent}</p>
                </div>

                {/* Red Team Actions */}
                <div className="bg-red-950/20 border border-red-500/20 rounded-lg p-4 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between text-red-400 font-bold uppercase">
                    <span className="flex items-center gap-1.5"><Crosshair className="w-4 h-4" /> RED INTENT</span>
                    <span>{currentTurnResult?.decisions.red_actions_count || 1} Actions</span>
                  </div>
                  <p className="text-slate-300">{currentTurnResult?.decisions.red_intent}</p>
                </div>
              </div>
            </div>

            {/* Objective Evaluation */}
            <div className="bg-[rgba(4,15,26,0.85)] border border-[rgba(100,190,255,0.2)] rounded-xl p-6 backdrop-blur-md space-y-6">
              <h3 className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> OBJECTIVE & TERMINATION STATE
              </h3>

              <div className="space-y-3 font-mono text-xs">
                {currentTurnResult?.metrics.objectives?.map((obj, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#02070D]/70 border border-slate-800 p-3 rounded">
                    <span className="text-slate-200">{obj.objective}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase text-[10px]">
                      {obj.status}
                    </span>
                  </div>
                )) || (
                  <div className="text-slate-400">All objectives active and under adjudication.</div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 font-mono text-xs space-y-1">
                <span className="text-slate-400 uppercase">TERMINATION CONDITION:</span>
                <div className="text-amber-400 font-bold text-sm">{currentTurnResult?.metrics.termination_condition || 'IN_PROGRESS'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
