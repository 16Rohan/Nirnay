import { Activity } from 'lucide-react'
import type { Entity, SimulationEvent, SimulationObjective } from '../../../contracts/simulation_3d'

type Props = {
  entity?: Entity
  objective?: SimulationObjective
  events: SimulationEvent[]
  scenario: string
  onClose: () => void
}

const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

export default function SimulationHUD({ entity, objective, events, scenario, onClose }: Props) {
  return <>
    {entity || objective ? <section className="selection-card glass">
      <button className="selection-close" aria-label="Close selected item" onClick={onClose}>×</button>
      <span className="eyebrow">{entity ? 'UNIT PROFILE · SIMULATED' : 'OBJECTIVE · SIMULATED'}</span>
      <h3>{entity?.id ?? objective?.id}</h3>
      <p>{entity?.name ?? objective?.name}</p>
      <div className="selection-data">{entity ? <>
        <span>STATUS<b>{entity.status}</b></span>
        <span>ALTITUDE<b>{entity.altitude.toLocaleString()} m</b></span>
        <span>SPEED<b>{entity.speed} m/s</b></span>
        <span>HEADING<b>{entity.heading}°</b></span>
      </> : <>
        <span>STATE<b>{objective?.state}</b></span>
        <span>SCENARIO<b>{scenario}</b></span>
      </>}</div>
    </section> : null}
    <div className="event-feed glass">
      <div className="event-heading"><span className="eyebrow">RECENT EVENTS</span><span>LOCAL MOCK DATA</span></div>
      {events.slice(0, 3).map((event, index) => <div className="event-row" key={event.id}>
        <i className={event.type === 'intercept' || event.type === 'launch' ? 'event-orange' : ''} />
        <span><b>{event.agent}</b> {event.message}</span>
        <time>{formatTime(event.simulationTime)}</time>
      </div>)}
      {events.length === 0 && <div className="event-row"><Activity size={12} /><span>Awaiting simulation events</span></div>}
    </div>
  </>
}
