import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowLeft, ChevronDown, Crosshair, Eye, Layers3, Maximize2, Pause, Play, Radar, RotateCcw, Settings2, Shield, Volume2, Wind } from 'lucide-react'
import SimulationWorld, { type CameraMode } from '../components/simulation3d/World'
import SimulationHUD from '../components/SimulationHUD'
import { simulationSource } from '../simulation/mockEngine'
import type { Entity, SimulationObjective } from '@/types/simulation_3d'
import '../styles/simulation.css'

const formatTime = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(s / 60)
  const secs = s % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}
const initialLayers = { terrain: true, units: true, routes: true, objectives: true, radar: true, infrastructure: true }
const scenarios = [{ id: 'operation-horizon', name: 'Operation Horizon' }, { id: 'valley-sentinel', name: 'Valley Sentinel' }, { id: 'coastal-watch', name: 'Coastal Watch' }]

export default function Simulation() {
  const state = useSyncExternalStore(simulationSource.subscribe, simulationSource.getSnapshot, simulationSource.getSnapshot)
  const [selected, setSelected] = useState<string | null>(null)
  const [layers, setLayers] = useState(initialLayers)
  const [scenarioOpen, setScenarioOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(true)
  const [cameraMode, setCameraMode] = useState<CameraMode>('overview')
  const selectedUnit = useMemo(() => state.entities.find((unit: Entity) => unit.id === selected), [state.entities, selected])
  const selectedObjective = useMemo(() => state.objectives.find((objective: SimulationObjective) => objective.id === selected), [state.objectives, selected])
  useEffect(() => { simulationSource.start(); return () => undefined }, [])
  const toggleLayer = (key: keyof typeof layers) => setLayers(current => ({ ...current, [key]: !current[key] }))

  return <main className="sim-page">
    <header className="sim-topbar">
      <div className="sim-brand"><Link to="/" aria-label="Back to NIRNAY home" className="sim-back"><ArrowLeft size={16} /></Link><span className="sim-brand-mark">N</span><div><strong>NIRNAY</strong><small>DECISION INTELLIGENCE</small></div><i /></div>
      <div className="sim-headline"><span>STRATEGIC SIMULATION</span><b>OPERATION HORIZON</b></div>
      <div className="sim-topmeta"><span className="connection"><i /> MOCK ENVIRONMENT</span><span className="sim-user">ANALYST CONSOLE <b>AC</b></span></div>
    </header>

    <section className="sim-main">
      <SimulationWorld units={state.entities} objectives={state.objectives} selected={selected} onSelect={setSelected} layers={layers} cameraMode={cameraMode} simulationTime={state.simulationTime} events={state.events} />
      <div className="sim-vignette" />
      <div className="sim-map-grid" />
      <div className="sim-coordinates">34°18' N&nbsp; 76°42' E <span>·</span> SYNTHETIC REGION / GRID H-04</div>
      <div className="sim-toolbar"><button title="Map layers" onClick={() => setPanelOpen(v => !v)}><Layers3 size={16} /></button><button title="Focus selected" onClick={() => setSelected(null)}><Crosshair size={16} /></button><button title="Toggle overview" onClick={() => setPanelOpen(v => !v)}><Maximize2 size={15} /></button></div>

      <section className="sim-hud glass"><div className="sim-hud-top"><div className="sim-emblem"><Shield size={17} /></div><div><span className="eyebrow">SCENARIO MONITOR</span><h1>{state.scenario}</h1></div><span className="live-pill"><i /> {state.running ? 'LIVE' : 'PAUSED'}</span></div><div className="sim-stat-row"><div><small>SIMULATION TIME</small><strong>{formatTime(state.simulationTime)}</strong></div><div><small>ACTIVE UNITS</small><strong>{state.entities.length.toString().padStart(2, '0')}</strong></div><div><small>OBJECTIVES</small><strong>{state.objectives.length.toString().padStart(2, '0')}</strong></div></div><div className="sim-hud-foot"><span><Activity size={13} /> AGENT CYCLE <b>06 / 06</b></span><span>SYNC <b>LOCAL</b></span></div></section>

      {panelOpen && <aside className="sim-controls glass"><div className="panel-heading"><div><span className="eyebrow">MISSION CONTROL</span><h2>Simulation</h2></div><Settings2 size={17} /></div>
        <div className="scenario-select-wrap"><button className="scenario-select" onClick={() => setScenarioOpen(v => !v)}><span><small>SCENARIO</small><b>{state.scenario}</b></span><ChevronDown size={16} /></button>{scenarioOpen && <div className="scenario-options">{scenarios.map(scenario => <button key={scenario.id} onClick={() => { simulationSource.setScenario(scenario.id); setScenarioOpen(false); setSelected(null) }}>{scenario.name}<span>{scenario.id === state.scenarioId ? '●' : ''}</span></button>)}</div>}</div>
        <label className="camera-select-wrap"><span>CAMERA VIEW</span><select className="camera-select" value={cameraMode} onChange={event => setCameraMode(event.target.value as CameraMode)}><option value="overview">Strategic overview</option><option value="follow">Follow selected unit</option><option value="aircraft">Aircraft camera</option><option value="terrain">Terrain camera</option><option value="objective">Objective camera</option><option value="tactical">Top-down tactical</option></select></label>
        <div className="run-controls"><button className="run-main" onClick={() => simulationSource.setRunning(!state.running)}>{state.running ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}{state.running ? 'PAUSE' : 'RESUME'}</button><button onClick={() => simulationSource.reset()}><RotateCcw size={15} /> RESET</button></div>
        <div className="control-block"><div className="control-title"><span>SIMULATION SPEED</span><b>{state.speed.toFixed(1)}×</b></div><div className="speed-options">{[.5, 1, 2, 4].map(speed => <button key={speed} className={state.speed === speed ? 'active' : ''} onClick={() => simulationSource.setSpeed(speed)}>{speed}×</button>)}</div></div>
        <div className="control-block layer-block"><div className="control-title"><span>DISPLAY LAYERS</span><Eye size={14} /></div>{(Object.keys(layers) as Array<keyof typeof layers>).map((key, index) => <button key={key} className="layer-row" onClick={() => toggleLayer(key)}><span className={`layer-check ${layers[key] ? 'checked' : ''}`}>{layers[key] && '✓'}</span><span>{['Terrain', 'Units', 'Routes', 'Objectives', 'Radar', 'Infrastructure'][index]}</span><i className={`layer-dot layer-${key}`} /></button>)}</div>
        <div className="weather-card"><div><Wind size={15} /><span>ENVIRONMENT</span></div><strong>Overcast · 12°C</strong><small>Visibility 18 km <b>WIND 8 kt</b></small></div>
      </aside>}

      <div className="sim-map-legend"><span><i className="blue-dot" /> BLUE</span><span><i className="red-dot" /> RED</span><span><i className="neutral-dot" /> NEUTRAL</span></div>
      <div className="sim-scale"><span>0</span><i /><span>5 km</span></div>
    </section>

    <footer className="sim-bottom">
      <div className="timeline-panel glass"><div className="timeline-title"><div><span className="eyebrow">AGENT ACTIVITY</span><strong>Decision cycle</strong></div><button aria-label="Activity settings"><Activity size={15} /></button></div><div className="agent-track">{['ENVIRONMENT', 'BLUE AGENT', 'COMMANDER', 'RED AGENT', 'SIMULATION', 'EVALUATION'].map((agent, i) => <div className={`agent-node ${i < 4 ? 'complete' : i === 4 ? 'current' : ''}`} key={agent}><i /><span>{agent}</span>{i < 5 && <b />}</div>)}</div></div>
      <SimulationHUD entity={selectedUnit} objective={selectedObjective} events={state.events} scenario={state.scenario} onClose={() => setSelected(null)} />
    </footer>
    <div className="sim-disclaimer"><Radar size={12} /> SYNTHETIC TRAINING ENVIRONMENT <span>·</span> ALL UNIT DATA IS SIMULATED</div>
  </main>
}
