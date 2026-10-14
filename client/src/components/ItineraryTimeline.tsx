// Midnight Atlas reminder: time, distance, and cost are the visual spine of the itinerary.

import { ArrowUpRight, Car, Footprints, MapPin, TrainFront } from "lucide-react";
import { formatMoney, itineraryStats, makeTimeLabel, type ItineraryDay, type TripProfile } from "@/lib/trip-data";

type ItineraryTimelineProps = {
  days: ItineraryDay[];
  profile: TripProfile;
  selectedDay: number;
  onDayChange: (day: number) => void;
  compact?: boolean;
};

function TravelIcon({ label }: { label: string }) {
  if (label.toLowerCase().includes("walk")) return <Footprints size={13} />;
  if (label.toLowerCase().includes("train")) return <TrainFront size={13} />;
  return <Car size={13} />;
}

export default function ItineraryTimeline({ days, profile, selectedDay, onDayChange, compact = false }: ItineraryTimelineProps) {
  const stats = itineraryStats(days, profile);
  const day = days[selectedDay] ?? days[0];

  return (
    <div className={`itinerary-wrap ${compact ? "is-compact" : ""}`}>
      <div className="itinerary-heading-row">
        <div>
          <p className="eyebrow">GENERATED ROUTE / {profile.destination.toUpperCase()}</p>
          <h3>{day.summary}</h3>
        </div>
        <button className="text-link" type="button" onClick={() => document.getElementById("planner")?.scrollIntoView({ behavior: "smooth" })}>Edit inputs <ArrowUpRight size={15} /></button>
      </div>

      <div className="day-tabs" role="tablist" aria-label="Itinerary days">
        {days.map((item, index) => <button type="button" role="tab" aria-selected={selectedDay === index} className={selectedDay === index ? "is-selected" : ""} key={item.label} onClick={() => onDayChange(index)}><span>{item.label}</span><small>{item.date}</small></button>)}
      </div>

      <div className="timeline" aria-live="polite">
        {day.items.map((item, index) => (
          <div className="timeline-item" key={`${item.time}-${item.title}`}>
            <div className="timeline-time"><span>{makeTimeLabel(item.time)}</span><small>{item.duration}</small></div>
            <div className="timeline-spine"><span className={`timeline-dot kind-${item.kind}`} />{index < day.items.length - 1 && <span className="timeline-line" />}</div>
            <div className="timeline-content"><div className="activity-row"><div><p className="activity-type">{item.kind.toUpperCase()}</p><h4>{item.title}</h4><p className="activity-place"><MapPin size={13} /> {item.place}</p></div><span className="activity-cost">{formatMoney(item.cost, profile.currency)}</span></div>{item.travelFromPrevious && <div className="travel-badge"><TravelIcon label={item.travelFromPrevious} /> {item.travelFromPrevious} <span className="travel-rule" /></div>}</div>
          </div>
        ))}
      </div>

      <div className="itinerary-stats">
        <div><span>EST. COST</span><strong>{formatMoney(stats.estimatedCost, profile.currency)}</strong><small>for {profile.travelers} traveller{profile.travelers > 1 ? "s" : ""}</small></div>
        <div><span>REMAINING</span><strong>{formatMoney(stats.remainingBudget, profile.currency)}</strong><small>of {formatMoney(profile.budget, profile.currency)} budget</small></div>
        <div><span>DISTANCE</span><strong>{stats.distance}</strong><small>across {stats.activities} stops</small></div>
        <div><span>TRAVEL TIME</span><strong>{stats.travelTime}</strong><small>kept intentionally light</small></div>
      </div>
    </div>
  );
}
