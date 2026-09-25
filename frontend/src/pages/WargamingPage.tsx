import React, { useState, useEffect, useRef } from 'react';

interface ObjectiveResult {
  objective: string;
  status: string;
  score: number;
}

interface TurnMetrics {
  blue_losses_percentage: number;
  red_losses_percentage: number;
  termination_condition: string;
  status: string;
  objectives: ObjectiveResult[];
}

interface EmergentEvent {
  type: string;
  description: string;
  impact: string;
}

interface EvaluationSummary {
  strategic_conclusion: string;
  risks: string[];
  tradeoffs: string[];
  uncertainties: string[];
  strategic_implications: string[];
  emergent_events: EmergentEvent[];
}

interface TurnDecisions {
  blue_coa_name: string;
  blue_intent: string;
  blue_actions_count: number;
  red_intent: string;
  red_actions_count: number;
}

interface TurnResult {
  session_id: string;
  turn_number: number;
  scenario_id: string;
  parent_scenario_id: string | null;
  human_guidance: string;
  concluded: boolean;
  session_status: string;
  metrics: TurnMetrics;
  evaluation: EvaluationSummary;
  decisions: TurnDecisions;
  step_logs: string[];
  strategic_report: string;
  interpreted_command?: any;
}

interface StageInfo {
  key: string;
  label: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  details?: string;
  duration_s?: number;
  provenance?: {
    source?: string;
    model?: string;
    mode?: string;
  };
  data?: any;
}

const INITIAL_STAGES: StageInfo[] = [
  { key: 'intent', label: 'Human Directive', status: 'idle', details: 'Awaiting operator strategic directive' },
  { key: 'context', label: 'Context Assembly', status: 'idle', details: 'Resolving memory & constraints' },
  { key: 'orchestrator', label: 'Scenario Contract', status: 'idle', details: 'Synthesizing scenario contract' },
  { key: 'environment', label: 'Environment Assessment', status: 'idle', details: 'Terrain, weather, mobility' },
  { key: 'blue_team', label: 'Blue Team Agent', status: 'idle', details: 'Course of Action formulation' },
  { key: 'red_team', label: 'Red Team Agent', status: 'idle', details: 'Adaptive adversarial response' },
  { key: 'simulation', label: 'Deterministic Simulator', status: 'idle', details: 'Rule-based combat adjudication' },
  { key: 'evaluation', label: 'Strategic Evaluation', status: 'idle', details: 'Outcome analysis & trade-offs' },
];

export default function WargamingPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [presetId, setPresetId] = useState('DEMO-001');
  const [loading, setLoading] = useState(false);
  const [turnsHistory, setTurnsHistory] = useState<TurnResult[]>([]);
  const [selectedTurnIdx, setSelectedTurnIdx] = useState<number>(0);
  const [humanCommand, setHumanCommand] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stages, setStages] = useState<StageInfo[]>(INITIAL_STAGES);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [isTerminalOutcome, setIsTerminalOutcome] = useState(false);
  const [terminalDetails, setTerminalDetails] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  // Active turn & latest turn
  const activeTurn: TurnResult | null =
    turnsHistory.length > 0 ? turnsHistory[selectedTurnIdx] || turnsHistory[turnsHistory.length - 1] : null;

  const latestTurn: TurnResult | null =
    turnsHistory.length > 0 ? turnsHistory[turnsHistory.length - 1] : null;

  const isSessionConcluded =
    isTerminalOutcome ||
    latestTurn?.concluded === true ||
    latestTurn?.session_status === 'concluded' ||
    (latestTurn?.turn_number || 0) >= 5;

  // Real-time WebSocket listener for progressive execution
  useEffect(() => {
    if (!sessionId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/${sessionId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'log') {
          setLiveLogs((prev) => [...prev, msg.log]);
        } else if (msg.type === 'command_conflict') {
          setError(`Directive Conflict: ${msg.reason}`);
          setLoading(false);
        } else if (msg.type === 'stage_event') {
          handleStageEvent(msg);
        }
      } catch (e) {
        // Ping or non-json message
      }
    };

    ws.onerror = () => {
      // Non-fatal ws error
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [sessionId]);

  const handleStageEvent = (msg: any) => {
    const { event_type, stage, payload } = msg;

    setStages((prev) =>
      prev.map((s) => {
        if (event_type === 'CONTEXT_STARTED' && s.key === 'context') {
          return { ...s, status: 'running', details: 'Resolving memory & constraints...' };
        }
        if (event_type === 'CONTEXT_LOADED' && s.key === 'context') {
          return { ...s, status: 'completed', details: `Loaded ${payload.dimensions || 5} strategic context dimensions` };
        }
        if (event_type === 'ORCHESTRATOR_STARTED' && s.key === 'orchestrator') {
          return { ...s, status: 'running', details: 'Synthesizing dynamic scenario contract with NIM LLM...' };
        }
        if (event_type === 'ORCHESTRATOR_COMPLETED' && s.key === 'orchestrator') {
          return {
            ...s,
            status: 'completed',
            details: `${payload.title || 'Contract generated'} (${payload.blue_forces || 0} Blue, ${payload.red_forces || 0} Red)`,
            duration_s: payload.duration_s,
            provenance: { source: 'NIM', mode: payload.classification === 'FALLBACK' ? 'FALLBACK' : 'LIVE' },
          };
        }
        if (event_type === 'ENVIRONMENT_STARTED' && s.key === 'environment') {
          return { ...s, status: 'running', details: 'Assessing terrain, weather & mobility multipliers...' };
        }
        if (event_type === 'ENVIRONMENT_COMPLETED' && s.key === 'environment') {
          return {
            ...s,
            status: 'completed',
            details: `Weather: ${payload.weather?.condition || 'Clear'} | Vis: ${payload.visibility_km}km`,
            duration_s: payload.duration_s,
            provenance: payload.provenance,
          };
        }
        if (event_type === 'BLUE_STARTED' && s.key === 'blue_team') {
          return { ...s, status: 'running', details: 'Formulating Course of Action grounded in intent & constraints...' };
        }
        if (event_type === 'BLUE_COMPLETED' && s.key === 'blue_team') {
          return {
            ...s,
            status: 'completed',
            details: `${payload.coa_name} (${payload.actions_count} action(s))`,
            duration_s: payload.duration_s,
            provenance: payload.provenance,
            data: payload,
          };
        }
        if (event_type === 'RED_STARTED' && s.key === 'red_team') {
          return { ...s, status: 'running', details: 'Observing Blue COA and calculating adversarial adaptation...' };
        }
        if (event_type === 'RED_COMPLETED' && s.key === 'red_team') {
          return {
            ...s,
            status: 'completed',
            details: `${payload.red_objective} (${payload.actions_count} action(s))`,
            duration_s: payload.duration_s,
            provenance: payload.provenance,
            data: payload,
          };
        }
        if (event_type === 'SIMULATION_STARTED' && s.key === 'simulation') {
          return { ...s, status: 'running', details: 'Validating actions and running Lanchester combat adjudication...' };
        }
        if (event_type === 'TERMINAL_EVENT') {
          setIsTerminalOutcome(true);
          setTerminalDetails(`${payload.condition}: ${payload.reason}`);
          if (s.key === 'simulation') {
            return { ...s, status: 'completed', details: `TERMINAL EVENT: ${payload.condition}` };
          }
        }
        if (event_type === 'SIMULATION_COMPLETED' && s.key === 'simulation') {
          return {
            ...s,
            status: 'completed',
            details: `Blue Loss: ${payload.blue_losses_percentage}% | Red Loss: ${payload.red_losses_percentage}% [${payload.termination_condition}]`,
            duration_s: payload.duration_s,
            data: payload,
          };
        }
        if (event_type === 'EVALUATION_STARTED' && s.key === 'evaluation') {
          return { ...s, status: 'running', details: 'Analyzing strategic trade-offs, risks & emergent developments...' };
        }
        if (event_type === 'EVALUATION_COMPLETED' && s.key === 'evaluation') {
          return {
            ...s,
            status: 'completed',
            details: payload.conclusion ? (payload.conclusion.length > 90 ? payload.conclusion.slice(0, 90) + '...' : payload.conclusion) : 'Evaluation finalized.',
            duration_s: payload.duration_s,
          };
        }
        if (event_type === 'CAMPAIGN_TERMINATED') {
          setIsTerminalOutcome(true);
          setTerminalDetails(payload.reason || 'Simulation concluded.');
        }
        return s;
      })
    );
  };

  const resetStageSkeleton = (directiveText: string) => {
    setStages([
      { key: 'intent', label: 'Human Directive', status: 'completed', details: `"${directiveText}"` },
      { key: 'context', label: 'Strategic Context', status: 'running', details: 'Resolving memory & constraints...' },
      { key: 'orchestrator', label: 'Scenario Contract', status: 'idle', details: 'Awaiting context' },
      { key: 'environment', label: 'Environment Assessment', status: 'idle', details: 'Awaiting contract' },
      { key: 'blue_team', label: 'Blue Team Agent', status: 'idle', details: 'Awaiting environment' },
      { key: 'red_team', label: 'Red Team Agent', status: 'idle', details: 'Awaiting Blue COA' },
      { key: 'simulation', label: 'Deterministic Simulator', status: 'idle', details: 'Awaiting plans' },
      { key: 'evaluation', label: 'Strategic Evaluation', status: 'idle', details: 'Awaiting simulation' },
    ]);
  };

  const startWargame = async () => {
    setLoading(true);
    setError(null);
    setIsTerminalOutcome(false);
    setTerminalDetails(null);
    const initialGuidance = 'Anchor defensive perimeter at Forward Logistics Point Alpha';
    resetStageSkeleton(initialGuidance);

    try {
      // Pre-initialize session to get session_id immediately and connect WebSocket before execution
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const initRes = await fetch('/wargame/session/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preset_id: presetId,
            turn_duration: '1m',
            human_guidance: initialGuidance,
            seed: 42,
          }),
        });
        if (initRes.ok) {
          const initData = await initRes.json();
          activeSessionId = initData.session_id;
          setSessionId(activeSessionId);
        }
      }

      const res = await fetch('/wargame/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSessionId,
          preset_id: presetId,
          turn_duration: '1m',
          human_guidance: initialGuidance,
          seed: 42,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errJson.detail || `Failed to start wargame: ${res.statusText}`);
      }
      const data: TurnResult = await res.json();
      setSessionId(data.session_id);
      setTurnsHistory([data]);
      setSelectedTurnIdx(0);
      if (data.concluded) {
        setIsTerminalOutcome(true);
      }
    } catch (err: any) {
      setError(err.message || 'Error starting wargame session');
    } finally {
      setLoading(false);
    }
  };

  const submitCommandAndAdvance = async () => {
    if (!sessionId || !humanCommand.trim()) return;
    setLoading(true);
    setError(null);
    resetStageSkeleton(humanCommand);

    try {
      const res = await fetch(`/wargame/command/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: humanCommand,
          advance_turn: true,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errJson.detail || `Command failed: ${res.statusText}`);
      }
      const data: TurnResult = await res.json();
      setTurnsHistory((prev) => {
        const updated = [...prev, data];
        setSelectedTurnIdx(updated.length - 1);
        return updated;
      });
      if (data.concluded) {
        setIsTerminalOutcome(true);
      }
      setHumanCommand('');
    } catch (err: any) {
      setError(err.message || 'Error executing turn with command');
    } finally {
      setLoading(false);
    }
  };

  const continueTurn = async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    resetStageSkeleton(latestTurn?.human_guidance || 'Holding operational guidance');

    try {
      const res = await fetch(`/wargame/continue/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(errJson.detail || `Continue failed: ${res.statusText}`);
      }
      const data: TurnResult = await res.json();
      setTurnsHistory((prev) => {
        const updated = [...prev, data];
        setSelectedTurnIdx(updated.length - 1);
        return updated;
      });
      if (data.concluded) {
        setIsTerminalOutcome(true);
      }
    } catch (err: any) {
      setError(err.message || 'Error continuing to next turn');
    } finally {
      setLoading(false);
    }
  };

  const resetCampaign = () => {
    setSessionId(null);
    setTurnsHistory([]);
    setSelectedTurnIdx(0);
    setHumanCommand('');
    setError(null);
    setIsTerminalOutcome(false);
    setTerminalDetails(null);
    setStages(INITIAL_STAGES);
    setLiveLogs([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 flex flex-col gap-6">
      {/* Top Navigation & Status Bar */}
      <header className="flex flex-wrap items-center justify-between border-b border-cyan-900/60 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-3.5 w-3.5 rounded-full bg-cyan-400 animate-pulse shadow-md shadow-cyan-400/50" />
            <h1 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300">
              NIRNAY // PROGRESSIVE STRATEGIC WARGAMING
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Progressive Execution, Intelligent Agents & Command Semantics Engine (PRD-06)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {sessionId ? (
            <div className="flex flex-wrap items-center gap-2 bg-slate-900 border border-cyan-800/70 px-3 py-1.5 rounded-lg text-xs">
              <span className="text-slate-400">SESSION:</span>
              <span className="font-mono text-cyan-300 font-bold">{sessionId}</span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-200 font-semibold">
                TURN {latestTurn?.turn_number || 1} / 5
              </span>
              <span
                className={`px-2 py-0.5 rounded font-bold uppercase ${
                  isSessionConcluded
                    ? 'bg-purple-950 text-purple-300 border border-purple-700'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                }`}
              >
                {isSessionConcluded ? 'CAMPAIGN CONCLUDED' : 'AWAITING DIRECTIVE'}
              </span>
              <button
                onClick={resetCampaign}
                className="ml-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded"
              >
                New Session
              </button>
            </div>
          ) : (
            <button
              onClick={startWargame}
              disabled={loading}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-2.5 rounded-lg shadow-lg shadow-cyan-950 transition-all disabled:opacity-50 text-sm"
            >
              {loading ? 'INITIALIZING TURN 1...' : 'START TURN 1'}
            </button>
          )}
        </div>
      </header>

      {/* Terminal Campaign Banner */}
      {isSessionConcluded && (
        <div className="bg-purple-950/80 border-2 border-purple-600 p-4 rounded-xl shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛑</span>
            <div>
              <h3 className="text-sm font-black tracking-wider uppercase text-purple-200">
                Campaign Terminated // Deterministic Conclusion
              </h3>
              <p className="text-xs text-purple-300 mt-0.5">
                {terminalDetails || 'Deterministic terminal state enforced. No scenario resurrection permitted.'}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-purple-900 border border-purple-400 text-purple-100 px-3 py-1 rounded">
            FINAL STATE
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-950/80 border border-red-700 text-red-200 p-4 rounded-lg text-sm flex justify-between items-center">
          <span>
            <strong>Conflict / Error:</strong> {error}
          </span>
          <button onClick={() => setError(null)} className="text-xs text-red-300 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {!sessionId ? (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/40">
          <div className="max-w-lg space-y-4">
            <h2 className="text-xl font-bold text-slate-100">Progressive Execution & Intelligent Command Console</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Experience the genuine strategic wargaming environment with progressive turn visualization, grounded
              multi-turn agent reasoning, and authoritative deterministic adjudication.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
              <select
                value={presetId}
                onChange={(e) => setPresetId(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              >
                <option value="DEMO-001">DEMO-001: Eastern Valley Standoff</option>
                <option value="BORDER-002">BORDER-002: Highland Border Escalation</option>
                <option value="COASTAL-003">COASTAL-003: Coastal Littoral Denial</option>
              </select>
              <button
                onClick={startWargame}
                disabled={loading}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-2 rounded-lg text-sm transition-all"
              >
                {loading ? 'Starting...' : 'Launch Campaign (Turn 1)'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Progressive Turn Execution Pipeline Skeleton (PRD-06 Requirement) */}
          <div className="bg-slate-900/90 border border-cyan-800/60 rounded-xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <h3 className="text-xs font-black tracking-wider uppercase text-cyan-300">
                  Turn {loading ? (latestTurn ? latestTurn.turn_number + 1 : 1) : activeTurn?.turn_number} Execution Skeleton
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {loading ? '● LIVE PROGRESSIVE EXECUTION' : '✓ TURN ADJUDICATED'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              {stages.map((stg) => (
                <div
                  key={stg.key}
                  className={`p-3 rounded-lg border text-xs flex flex-col justify-between transition-all ${
                    stg.status === 'running'
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : stg.status === 'completed'
                      ? 'bg-slate-950/70 border-emerald-800/60 text-slate-200'
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold uppercase tracking-wider text-[11px] truncate">{stg.label}</span>
                    <span className="flex items-center gap-1">
                      {stg.status === 'completed' && (
                        <>
                          {stg.duration_s !== undefined && (
                            <span className="text-[10px] font-mono text-emerald-400 font-semibold">{stg.duration_s}s</span>
                          )}
                          <span className="text-emerald-400 font-bold">✓</span>
                        </>
                      )}
                      {stg.status === 'running' && (
                        <span className="flex items-center gap-1">
                          <span className="text-cyan-400 animate-ping inline-block h-2 w-2 rounded-full bg-cyan-400" />
                          <span className="px-1 py-0.2 rounded bg-cyan-900/60 border border-cyan-500 text-cyan-300 font-mono text-[8px] font-bold">
                            {stg.key === 'simulation' ? 'SIM' : 'GEN'}
                          </span>
                        </span>
                      )}
                      {stg.status === 'idle' && <span className="text-slate-600">○</span>}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 line-clamp-2">{stg.details || 'Pending stage trigger'}</p>

                  {stg.provenance && (
                    <div className="mt-2 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono">
                      <span className="text-slate-400 truncate">{stg.provenance.source || 'NIM'}</span>
                      <span
                        className={`px-1 py-0.2 rounded font-bold uppercase ${
                          stg.provenance.mode === 'LIVE'
                            ? 'bg-emerald-950 text-emerald-300'
                            : 'bg-amber-950 text-amber-300'
                        }`}
                      >
                        {stg.provenance.mode || 'LIVE'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Turn-by-Turn Selector Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Campaign Turns:</span>
            {turnsHistory.map((t, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedTurnIdx(idx)}
                className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                  selectedTurnIdx === idx
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span>TURN {t.turn_number}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded ${
                    selectedTurnIdx === idx ? 'bg-slate-950 text-cyan-300' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  B: {t.metrics.blue_losses_percentage}% | R: {t.metrics.red_losses_percentage}%
                </span>
              </button>
            ))}

            {!isSessionConcluded && (
              <div className="text-xs text-cyan-400 animate-pulse font-mono font-semibold ml-2">
                ➜ Next: Turn {(latestTurn?.turn_number || 0) + 1}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Detailed Turn Developments */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Situation Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
                <div className="flex justify-between items-center mb-4 border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-base font-black tracking-wider uppercase text-cyan-400">
                      Turn {activeTurn?.turn_number} Ground-Truth Situation
                    </h3>
                    <span className="text-xs text-slate-400">
                      Scenario Contract ID: <span className="font-mono text-slate-300">{activeTurn?.scenario_id}</span>
                      {activeTurn?.parent_scenario_id && ` (Inherited from: ${activeTurn.parent_scenario_id})`}
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded bg-slate-950 border border-slate-700 font-mono text-emerald-400">
                    {activeTurn?.metrics.status} ({activeTurn?.metrics.termination_condition})
                  </span>
                </div>

                {/* Attrition and Force Health */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-blue-950/40 border border-blue-800/50 p-3 rounded-lg">
                    <span className="text-[11px] font-bold text-blue-300">BLUE FORCE ATTRITION</span>
                    <div className="text-2xl font-mono font-black text-blue-400 mt-1">
                      {activeTurn?.metrics.blue_losses_percentage}%
                    </div>
                  </div>
                  <div className="bg-red-950/40 border border-red-800/50 p-3 rounded-lg">
                    <span className="text-[11px] font-bold text-red-300">RED FORCE ATTRITION</span>
                    <div className="text-2xl font-mono font-black text-red-400 mt-1">
                      {activeTurn?.metrics.red_losses_percentage}%
                    </div>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg col-span-2">
                    <span className="text-[11px] font-bold text-slate-400">OPERATIONAL OBJECTIVES</span>
                    <div className="mt-1 space-y-1">
                      {activeTurn?.metrics.objectives && activeTurn.metrics.objectives.length > 0 ? (
                        activeTurn.metrics.objectives.map((obj, i) => (
                          <div key={i} className="text-xs flex justify-between">
                            <span className="text-slate-300 truncate">{obj.objective}</span>
                            <span className="font-mono font-bold text-cyan-400">{obj.status}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-500">Defensive perimeter integrity maintained</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tactical Decisions & Plans for this turn */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/70 p-3.5 rounded-lg border border-blue-900/40">
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-1">
                      Blue Course of Action: {activeTurn?.decisions.blue_coa_name}
                    </div>
                    <p className="text-xs text-slate-300 italic mb-2">"{activeTurn?.decisions.blue_intent}"</p>
                    <div className="text-[11px] text-slate-400 flex justify-between border-t border-slate-800 pt-1.5">
                      <span>Actions: {activeTurn?.decisions.blue_actions_count}</span>
                      <span className="text-blue-300 font-mono font-semibold">Active Strategy</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-3.5 rounded-lg border border-red-900/40">
                    <div className="text-xs font-bold text-red-400 uppercase tracking-wide mb-1">
                      Red Adversary Response
                    </div>
                    <p className="text-xs text-slate-300 italic mb-2">"{activeTurn?.decisions.red_intent}"</p>
                    <div className="text-[11px] text-slate-400 flex justify-between border-t border-slate-800 pt-1.5">
                      <span>Actions: {activeTurn?.decisions.red_actions_count}</span>
                      <span className="text-red-300 font-mono font-semibold">Adaptive Spearhead</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evaluation, Strategic Assessment & Emergent Events */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
                <h3 className="text-sm font-bold tracking-wider uppercase text-cyan-400 mb-3">
                  Turn {activeTurn?.turn_number} Strategic Evaluation & Developments
                </h3>
                <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 text-sm text-slate-200 leading-relaxed mb-4">
                  {activeTurn?.evaluation.strategic_conclusion}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Risks */}
                  <div className="bg-slate-950/50 p-3 rounded-lg border border-amber-900/30">
                    <span className="text-xs font-bold text-amber-400 block mb-1.5">STRATEGIC RISKS</span>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                      {activeTurn?.evaluation.risks && activeTurn.evaluation.risks.length > 0 ? (
                        activeTurn.evaluation.risks.map((r, i) => <li key={i}>{r}</li>)
                      ) : (
                        <li className="text-slate-500">No critical risks logged</li>
                      )}
                    </ul>
                  </div>

                  {/* Strategic Implications */}
                  <div className="bg-slate-950/50 p-3 rounded-lg border border-cyan-900/30">
                    <span className="text-xs font-bold text-cyan-400 block mb-1.5">OPERATIONAL IMPLICATIONS</span>
                    <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                      {activeTurn?.evaluation.strategic_implications && activeTurn.evaluation.strategic_implications.length > 0 ? (
                        activeTurn.evaluation.strategic_implications.map((s, i) => <li key={i}>{s}</li>)
                      ) : (
                        <li className="text-slate-500">Standard operational line</li>
                      )}
                    </ul>
                  </div>

                  {/* Emergent Events */}
                  <div className="bg-slate-950/50 p-3 rounded-lg border border-purple-900/30">
                    <span className="text-xs font-bold text-purple-400 block mb-1.5">EMERGENT EVENTS</span>
                    <div className="space-y-1.5 text-xs text-slate-300">
                      {activeTurn?.evaluation.emergent_events && activeTurn.evaluation.emergent_events.length > 0 ? (
                        activeTurn.evaluation.emergent_events.map((e, i) => (
                          <div key={i} className="bg-purple-950/30 p-1.5 rounded border border-purple-800/40">
                            <span className="font-bold text-purple-300 block text-[10px] uppercase">{e.type}</span>
                            <span>{e.description}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500">No emergent shocks</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step Logs for the selected turn */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Turn {activeTurn?.turn_number} Execution Telemetry
                </h4>
                <div className="font-mono text-[11px] text-slate-400 space-y-1 max-h-40 overflow-y-auto bg-slate-950/80 p-3 rounded border border-slate-800/80">
                  {activeTurn?.step_logs &&
                    activeTurn.step_logs.map((log, i) => <div key={i}>{log}</div>)}
                </div>
              </div>
            </div>

            {/* Right Col: Human Operator Guidance Console for Next Turn */}
            <div className="flex flex-col gap-6">
              <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-cyan-800/60 rounded-xl p-5 shadow-xl flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <h3 className="text-sm font-black tracking-wider uppercase text-slate-100">
                      Command Console // Turn {(latestTurn?.turn_number || 0) + 1}
                    </h3>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono">HITL INTERFACE</span>
                </div>

                <div className="text-xs text-slate-400">
                  Prior Strategic Intent (Turn {latestTurn?.turn_number}):
                  <div className="text-slate-200 font-semibold bg-slate-950 p-2.5 rounded border border-slate-800 mt-1 text-xs">
                    "{latestTurn?.human_guidance}"
                  </div>
                </div>

                {latestTurn?.interpreted_command && (
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                    <span className="text-[11px] font-bold text-cyan-300 block mb-1">STRUCTURED COMMAND INTENT</span>
                    <div className="font-mono text-[10px] text-slate-400 space-y-0.5">
                      <div>
                        Type:{' '}
                        <span className="text-slate-200 font-semibold">
                          {latestTurn.interpreted_command.structured_intent?.intent_type ||
                            latestTurn.interpreted_command.input?.intent?.intent_type ||
                            'STRATEGIC_GUIDANCE'}
                        </span>
                      </div>
                      <div>
                        Priority:{' '}
                        <span className="text-slate-200">
                          {latestTurn.interpreted_command.structured_intent?.priority || 'EXPLICIT_HUMAN_STRATEGIC_INTENT'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {!isSessionConcluded ? (
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-bold text-cyan-300 flex items-center justify-between">
                      <span>Issue Directive for Turn {(latestTurn?.turn_number || 0) + 1}:</span>
                      <span className="text-[10px] text-slate-500 font-normal">Natural Language Semantics</span>
                    </label>
                    <textarea
                      rows={4}
                      value={humanCommand}
                      onChange={(e) => setHumanCommand(e.target.value)}
                      placeholder="e.g. Shift mobile armor to counter river crossing at LOC-BRAVO, establish ambush screen, preserve fuel reserve."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none font-sans leading-relaxed"
                    />

                    <div className="flex flex-col gap-2 pt-1">
                      <button
                        onClick={submitCommandAndAdvance}
                        disabled={loading || !humanCommand.trim()}
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-4 py-2.5 rounded-lg text-xs shadow-md transition-all disabled:opacity-40"
                      >
                        {loading
                          ? 'CALCULATING DETERMINISTIC SIMULATION...'
                          : `EXECUTE TURN ${(latestTurn?.turn_number || 0) + 1} WITH DIRECTIVE`}
                      </button>
                      <button
                        onClick={continueTurn}
                        disabled={loading}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-lg text-xs transition-all disabled:opacity-40"
                      >
                        {loading ? 'Processing...' : `Advance to Turn ${(latestTurn?.turn_number || 0) + 1} (Hold Guidance)`}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-purple-950/40 border border-purple-800/50 p-4 rounded-lg text-center space-y-2">
                    <span className="text-xs font-black text-purple-300 block">5-TURN CAMPAIGN COMPLETED</span>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      All operational turns have been adjudicated. Review past turn telemetry above or launch a new scenario.
                    </p>
                    <button
                      onClick={resetCampaign}
                      className="mt-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-1.5 rounded text-xs"
                    >
                      Start New Wargame
                    </button>
                  </div>
                )}
              </div>

              {/* Full Campaign Progression Summary */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Campaign Lineage (Turns: {turnsHistory.length} / 5)
                </h4>
                <div className="space-y-2">
                  {turnsHistory.map((t, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedTurnIdx(idx)}
                      className={`p-2 rounded border text-xs cursor-pointer transition-all flex justify-between items-center ${
                        selectedTurnIdx === idx
                          ? 'bg-cyan-950/50 border-cyan-700 text-cyan-200'
                          : 'bg-slate-950/70 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-cyan-400">Turn {t.turn_number}</span>
                        <span className="text-[11px] text-slate-400 ml-2">
                          Losses: B {t.metrics.blue_losses_percentage}% | R {t.metrics.red_losses_percentage}%
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">Scn {t.scenario_id}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
