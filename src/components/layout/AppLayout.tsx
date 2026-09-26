import React, { useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, Shield, Crosshair, ArrowRight, Play, RefreshCw, Cpu, Layers } from 'lucide-react'
import Navbar from './Navbar'
import Footer from './Footer'
import { useWargameStore } from '../../store/wargameStore'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const isHomePage = location.pathname === '/'

  const { activeSessionId, currentTurnResult, turnHistory, isExecuting, currentStage } = useWargameStore()

  const currentTurn = currentTurnResult ? currentTurnResult.turn_number : turnHistory.length
  const blueLoss = currentTurnResult?.metrics.blue_losses_percentage ?? 0
  const redLoss = currentTurnResult?.metrics.red_losses_percentage ?? 0
  const sessionStatus = currentTurnResult?.session_status || (activeSessionId ? 'ACTIVE' : 'NO_CAMPAIGN')

  return (
    <div className="min-h-screen flex flex-col bg-[#02070D] text-slate-100 font-sans selection:bg-[#42C7FF]/30 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Sub-header Active Campaign Banner (Visible on operational pages) */}
      {!isHomePage && (
        <div className="pt-20 lg:pt-24 pb-3 px-6 max-w-[1500px] mx-auto w-full">
          <div className="rounded-lg border border-[rgba(100,190,255,0.2)] bg-[rgba(4,15,26,0.85)] backdrop-blur-md p-3 px-5 flex flex-wrap items-center justify-between gap-4 shadow-[0_0_20px_rgba(4,15,26,0.6)]">
            {/* Left: Active Campaign Identifier */}
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-md bg-[rgba(66,199,255,0.1)] border border-[rgba(66,199,255,0.3)]">
                <Activity className={`w-4 h-4 ${isExecuting ? 'text-amber-400 animate-pulse' : 'text-[#42C7FF]'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] tracking-widest text-slate-400 font-mono uppercase">ACTIVE CAMPAIGN</span>
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                    sessionStatus === 'CONCLUDED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    isExecuting ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    activeSessionId ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {isExecuting ? `EXECUTING (${currentStage || 'PIPELINE'})` : sessionStatus}
                  </span>
                </div>
                <div className="font-mono text-sm font-semibold text-white tracking-wider flex items-center gap-2">
                  {activeSessionId ? (
                    <>
                      <span>{activeSessionId}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-[#42C7FF]">TURN {currentTurn} / 5</span>
                    </>
                  ) : (
                    <span className="text-slate-400 font-normal text-xs">No active campaign initialized. Launch a preset from Scenarios or Wargaming.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Middle: Forces Status Quick Ticker */}
            {activeSessionId && (
              <div className="hidden md:flex items-center gap-6 px-4 py-1.5 rounded bg-[#02070D]/60 border border-slate-800/80 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-slate-400">BLUE INTEGRITY:</span>
                  <span className="font-bold text-white">{(100 - blueLoss).toFixed(1)}%</span>
                </div>
                <div className="w-px h-3 bg-slate-800" />
                <div className="flex items-center gap-2">
                  <Crosshair className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-slate-400">RED INTEGRITY:</span>
                  <span className="font-bold text-white">{(100 - redLoss).toFixed(1)}%</span>
                </div>
              </div>
            )}

            {/* Right: Quick Operational Switch */}
            <div className="flex items-center gap-3 ml-auto">
              {location.pathname !== '/wargaming' && (
                <button
                  onClick={() => navigate('/wargaming')}
                  className="px-3.5 py-1.5 rounded text-xs font-mono font-semibold tracking-wider bg-[#42C7FF]/15 border border-[#42C7FF]/40 text-[#42C7FF] hover:bg-[#42C7FF]/25 hover:text-white transition-all flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>COMMAND CONSOLE</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full">{children}</main>

      {/* Persistent Footer on non-home or integrated bottom */}
      {!isHomePage && <Footer />}
    </div>
  )
}
