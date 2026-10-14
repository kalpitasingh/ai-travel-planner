// Midnight Atlas reminder: the map is a visual route plate—informative, tactile, and connected to the timeline.

import { useState } from "react";
import { ArrowUpRight, Layers3, Navigation, Route as RouteIcon } from "lucide-react";

type RouteStop = {
  number: number;
  label: string;
  short: string;
  x?: number;
  y?: number;
  lat?: number;
  lng?: number;
};

type RouteMapProps = {
  stops: RouteStop[];
  selectedStop?: number;
  onSelectStop?: (stop: number) => void;
  title?: string;
};

function buildRoutePath(stops: RouteStop[]): string {
  if (stops.length === 0) return "";
  if (stops.length === 1) return `M${stops[0].x ?? 50} ${stops[0].y ?? 50}`;

  const points = stops.map((stop) => ({ x: stop.x ?? 50, y: stop.y ?? 50 }));
  let path = `M${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    path += ` C${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
}

export default function RouteMap({ stops, selectedStop, onSelectStop, title = "ROUTE" }: RouteMapProps) {
  const [activeStop, setActiveStop] = useState(selectedStop ?? stops[0]?.number ?? 1);
  const chooseStop = (stop: number) => {
    setActiveStop(stop);
    onSelectStop?.(stop);
  };
  const active = stops.find((stop) => stop.number === activeStop) ?? stops[0];
  const routePath = buildRoutePath(stops);

  return (
    <div className="route-map-card">
      <div className="map-card-topline"><span className="eyebrow"><Navigation size={12} /> {title}</span><button type="button" className="map-icon-button" aria-label="Open map layers"><Layers3 size={16} /></button></div>
      <div className="map-canvas" role="img" aria-label="Stylized map showing route stops">
        <svg className="route-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{routePath && (<><path className="route-shadow" d={routePath} /><path className="route-path" d={routePath} /></>)}</svg>
        {stops.map((stop) => <button type="button" className={`map-stop ${activeStop === stop.number ? "is-active" : ""}`} style={{ left: `${stop.x ?? 50}%`, top: `${stop.y ?? 50}%` }} key={stop.number} onClick={() => chooseStop(stop.number)} aria-label={`Stop ${stop.number}: ${stop.short}`}><span>{stop.number}</span></button>)}
        <div className="map-compass"><span>N</span><Navigation size={15} /></div>
        <div className="map-scale"><span>0</span><i /><span>1 km</span></div>
        {active && (<div className="map-selected"><span>STOP {String(active.number).padStart(2, "0")}</span><strong>{active.label}</strong><small>{active.short}</small><ArrowUpRight size={14} /></div>)}
      </div>
      <div className="map-footer"><div><RouteIcon size={15} /><span><strong>{stops.length} stops</strong> total route</span></div><button type="button" onClick={() => chooseStop(stops[0]?.number ?? 1)} disabled={stops.length === 0}>View all stops <ArrowUpRight size={14} /></button></div>
    </div>
  );
}
