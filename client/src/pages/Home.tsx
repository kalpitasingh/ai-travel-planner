// Midnight Atlas reminder: keep the journey legible from first glance to generated route; this is a working product surface, not a landing-page shell.

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CloudRain,
  Menu,
  MoveRight,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import GlobeCanvas from "@/components/GlobeCanvas";
import ItineraryTimeline from "@/components/ItineraryTimeline";
import RouteMap from "@/components/RouteMap";
import TripPlanner from "@/components/TripPlanner";
import {
  baseItinerary,
  defaultTripProfile,
  groupTravelers,
  rainItinerary,
  shortRouteItinerary,
  type ItineraryDay,
  type ItineraryItem,
  type TripProfile,
} from "@/lib/trip-data";

type GeocodedPlace = {
  name: string;
  latitude: number;
  longitude: number;
};

function buildStopsFromItinerary(
  itinerary: ItineraryDay[],
  selectedDay: number,
  profile: TripProfile,
  geocodedPlaces: Map<string, GeocodedPlace>,
) {
  const day = itinerary[selectedDay] ?? itinerary[0];
  const fallbackLat = profile.destinationLatitude;
  const fallbackLng = profile.destinationLongitude;

  if (!day || day.items.length === 0) {
    if (fallbackLat === undefined || fallbackLng === undefined) return [];
    return [
      {
        number: 1,
        label: profile.destination,
        short: "Destination",
        x: 50,
        y: 50,
        lat: fallbackLat,
        lng: fallbackLng,
      },
    ];
  }

  const stopsMap = new Map<number, ItineraryItem>();
  for (const item of day.items) {
    if (!stopsMap.has(item.stop)) {
      stopsMap.set(item.stop, item);
    }
  }

  const stops = Array.from(stopsMap.entries()).sort((a, b) => a[0] - b[0]);
  const count = stops.length;

  return stops.map(([number, item], index) => {
    const placeKey = item.place.split(" ·")[0].trim();
    const geocoded = geocodedPlaces.get(placeKey);
    const lat = geocoded?.latitude ?? fallbackLat;
    const lng = geocoded?.longitude ?? fallbackLng;

    const angle =
      (index / Math.max(count - 1, 1)) * Math.PI * 0.6 - Math.PI * 0.3;
    const radius = 25;
    const x = 50 + Math.sin(angle) * radius;
    const y = 50 - Math.cos(angle) * radius * 0.6;

    return {
      number,
      label: placeKey,
      short: item.title,
      x,
      y,
      lat,
      lng,
    };
  });
}

function useGeocodedPlaces(
  itinerary: ItineraryDay[],
  selectedDay: number,
  profile: TripProfile,
) {
  const [geocodedPlaces, setGeocodedPlaces] = useState<
    Map<string, GeocodedPlace>
  >(new Map());

  useEffect(() => {
    const day = itinerary[selectedDay] ?? itinerary[0];
    if (!day) return;

    const city = profile.destination;
    const country = profile.destinationCountry ?? "";
    const destLat = profile.destinationLatitude;
    const destLon = profile.destinationLongitude;

    let cancelled = false;
    const cache = new Map<string, GeocodedPlace>();
    const placeEntries = new Map<string, { kind: string; title: string }>();
    for (const item of day.items) {
      const name = item.place.split(" ·")[0].trim();
      if (name) placeEntries.set(name, { kind: item.kind, title: item.title });
    }

    async function fetchPlaces() {
      const entries = Array.from(placeEntries.entries());
      for (const [name, info] of entries) {
        if (cancelled) return;
        try {
          const params = new URLSearchParams({
            q: name,
            city,
            country,
            kind: info.kind,
            title: info.title,
          });
          if (destLat !== undefined) params.set("destLat", String(destLat));
          if (destLon !== undefined) params.set("destLon", String(destLon));
          const response = await fetch(`/api/geocode?${params.toString()}`);
          if (response.ok) {
            const data = (await response.json()) as GeocodedPlace;
            if (data.latitude && data.longitude) {
              cache.set(name, data);
            }
          }
        } catch {
          // skip this place, will fall back to destination coordinates
        }
      }
      if (!cancelled) {
        setGeocodedPlaces(cache);
      }
    }

    fetchPlaces();

    return () => {
      cancelled = true;
    };
  }, [
    itinerary,
    selectedDay,
    profile.destination,
    profile.destinationCountry,
    profile.destinationLatitude,
    profile.destinationLongitude,
  ]);

  return geocodedPlaces;
}

const heroImage = "/manus-storage/tripmind-hero_2de8c59f.jpg";
const planningImage = "/manus-storage/tripmind-planning_095a3dfe.jpg";
const mapTexture = "/manus-storage/tripmind-map-texture_a178759b.jpg";
const markImage = "/manus-storage/tripmind-mark_24555a7b.png";

function scrollToSection(id: string) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Home() {
  const [profile, setProfile] = useState<TripProfile>(defaultTripProfile);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>(baseItinerary);
  const [selectedDay, setSelectedDay] = useState(0);
  const [replanMode, setReplanMode] = useState<"rain" | "distance" | null>(
    "rain",
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [groupFocus, setGroupFocus] = useState<"balance" | "food" | "history">(
    "balance",
  );
  const geocodedPlaces = useGeocodedPlaces(itinerary, selectedDay, profile);

  const activeChange = useMemo(
    () =>
      replanMode === "rain"
        ? {
            label: "WEATHER SHIFT",
            prompt: "It's raining.",
            from: "15:00 · Outdoor attraction",
            to: "15:15 · Indoor museum",
            note: "TripMind protected the rest of your afternoon.",
          }
        : {
            label: "CONSTRAINT SHIFT",
            prompt: "Reduce travel time.",
            from: "14:00 · Lunch in Baixa",
            to: "13:30 · Lunch in Alfama",
            note: "One small reroute saves 18 minutes.",
          },
    [replanMode],
  );

  const handlePlanComplete = (nextProfile: TripProfile) => {
    setProfile(nextProfile);
    setItinerary(baseItinerary);
    setSelectedDay(0);
    window.setTimeout(() => scrollToSection("itinerary"), 120);
  };

  const handleReplan = (mode: "rain" | "distance") => {
    setReplanMode(mode);
    setItinerary(mode === "rain" ? rainItinerary : shortRouteItinerary);
    setSelectedDay(0);
  };

  return (
    <div className="tripmind-app">
      <header className="site-nav">
        <button
          className="brand-lockup"
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="TripMind home"
        >
          <img src={markImage} alt="" />
          <span>TripMind</span>
          <small>INTELLIGENT TRAVEL PLANNING</small>
        </button>
        <nav
          className={`nav-links ${mobileNavOpen ? "is-open" : ""}`}
          aria-label="Primary navigation"
        >
          <button
            type="button"
            onClick={() => {
              scrollToSection("explore");
              setMobileNavOpen(false);
            }}
          >
            Explore
          </button>
          <button
            type="button"
            onClick={() => {
              scrollToSection("how-it-works");
              setMobileNavOpen(false);
            }}
          >
            How it works
          </button>
          <button
            type="button"
            onClick={() => {
              scrollToSection("itinerary");
              setMobileNavOpen(false);
            }}
          >
            My trips
          </button>
          <button
            className="nav-cta"
            type="button"
            onClick={() => {
              scrollToSection("planner");
              setMobileNavOpen(false);
            }}
          >
            Plan a trip <ArrowRight size={14} />
          </button>
        </nav>
        <button
          className="mobile-nav-toggle"
          type="button"
          aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          {mobileNavOpen ? <X /> : <Menu />}
        </button>
      </header>

      <main>
        <div className="atlas-thread" aria-hidden="true">
          <span className="thread-knot knot-a" />
          <span className="thread-knot knot-b" />
          <span className="thread-knot knot-c" />
          <span className="thread-knot knot-d" />
        </div>
        <section
          className="hero"
          id="explore"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(8,15,17,.95) 0%, rgba(8,15,17,.76) 42%, rgba(8,15,17,.22) 76%, rgba(8,15,17,.62) 100%), url(${heroImage})`,
          }}
        >
          <div className="hero-grain" />
          <div className="hero-copy">
            <p className="eyebrow reveal-up">
              TRIPMIND / INTELLIGENT TRAVEL PLANNING
            </p>
            <h1 className="reveal-up delay-1">
              Your journey.
              <br />
              <em>Intelligently planned.</em>
            </h1>
            <p className="hero-description reveal-up delay-2">
              TripMind builds personalized journeys around your time, budget,
              interests and the way you actually want to travel.
            </p>
            <div className="hero-actions reveal-up delay-3">
              <button
                type="button"
                className="signal-button"
                onClick={() => scrollToSection("planner")}
              >
                Plan a trip <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="text-link light"
                onClick={() => scrollToSection("how-it-works")}
              >
                Explore <ArrowDown size={15} />
              </button>
            </div>
          </div>
          <div className="hero-globe">
            <div className="globe-label label-a">
              <span className="label-pulse" /> LIVE ROUTES <strong>03</strong>
            </div>
            <div className="globe-orbit-label orbit-label-left">
              01 / LISBON
            </div>
            <GlobeCanvas />
            <div className="globe-caption">
              <span>ACTIVE ORBIT / 2026</span>
              <span>MOVE THE WORLD</span>
            </div>
            <div className="globe-orbit-label orbit-label-right">
              05 DAYS · 18.6 KM
            </div>
          </div>
          <div className="hero-footer">
            <span>Lisbon · Kyoto · Copenhagen</span>
            <span className="scroll-cue">
              <i /> scroll to begin
            </span>
            <span>05° 32′ 18″ N</span>
          </div>
          <div className="hero-command-strip">
            <span className="command-index">TRIP 001</span>
            <button type="button" onClick={() => scrollToSection("planner")}>
              <span>Start with a place</span>
              <strong>Lisbon, Portugal</strong>
              <ArrowRight size={16} />
            </button>
            <span className="command-hint">
              The route begins with one good question.
            </span>
          </div>
        </section>

        <section className="intro-strip" id="how-it-works">
          <div className="section-index">
            01 <span>/</span> THE IDEA
          </div>
          <div className="plate-coordinates">
            38°43′23″ N<br />
            <span>09°08′27″ W</span>
          </div>
          <div className="intro-statement">
            <p className="eyebrow">02 / NOT A LIST. A LIVING PLAN.</p>
            <h2>
              Good travel has a <em>rhythm.</em>
            </h2>
            <p>
              TripMind takes the details that make a day feel like yours—when
              you wake up, what you can spend, how far you want to wander—and
              turns them into a route that can change with you.
            </p>
            <div className="manifesto-rule">
              <span /> <strong>PLACE / PACE / POSSIBILITY</strong>
            </div>
          </div>
          <div className="intro-aside">
            <img
              className="planning-image"
              src={planningImage}
              alt="A traveler walking through a Lisbon street"
              loading="lazy"
            />
            <span className="image-caption">FIELD NOTE 01 / LISBON</span>
          </div>
        </section>

        <TripPlanner onComplete={handlePlanComplete} />

        <section className="results-section" id="itinerary">
          <div className="section-kicker">
            <span className="section-index">
              02 <span>/</span> YOUR ROUTE
            </span>
            <span className="kicker-rule" />
            <span className="kicker-status">
              <span className="live-dot" /> MOCK DATA / READY TO CONNECT
            </span>
          </div>
          <div className="results-heading">
            <div>
              <p className="eyebrow">
                {profile.destination.toUpperCase()} / {profile.days} DAYS /{" "}
                {profile.travelers} TRAVELLER{profile.travelers > 1 ? "S" : ""}
              </p>
              <h2>
                A route with
                <br />
                <em>room to breathe.</em>
              </h2>
            </div>
            <div className="results-note">
              <Sparkles size={16} />
              <p>
                Built around your pace, with travel time protected between the
                things you came for.
              </p>
            </div>
          </div>
          <div className="results-layout">
            <ItineraryTimeline
              days={itinerary}
              profile={profile}
              selectedDay={selectedDay}
              onDayChange={setSelectedDay}
            />
            <div className="route-map-sticky">
              <RouteMap
                stops={buildStopsFromItinerary(
                  itinerary,
                  selectedDay,
                  profile,
                  geocodedPlaces,
                )}
                title={`ROUTE PLATE / ${profile.destination.toUpperCase()}`}
              />
            </div>
          </div>
        </section>

        <section
          className="replan-section"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(11,20,22,.97), rgba(11,20,22,.86)), url(${mapTexture})`,
          }}
        >
          <div className="section-kicker">
            <span className="section-index">
              03 <span>/</span> LIVE CONSTRAINTS
            </span>
            <span className="kicker-rule" />
            <span className="kicker-status">THE PLAN IS NEVER FINISHED</span>
          </div>
          <div className="replan-grid">
            <div className="replan-copy">
              <p className="eyebrow">DYNAMIC REPLANNING</p>
              <h2>
                When the day
                <br />
                <em>changes, you do too.</em>
              </h2>
              <p>
                TripMind doesn’t hand you a static answer. Add a constraint and
                watch the route adapt while the shape of the day stays intact.
              </p>
              <div className="replan-controls">
                <button
                  type="button"
                  className={replanMode === "rain" ? "is-active" : ""}
                  onClick={() => handleReplan("rain")}
                >
                  <CloudRain size={16} /> It’s raining
                </button>
                <button
                  type="button"
                  className={replanMode === "distance" ? "is-active" : ""}
                  onClick={() => handleReplan("distance")}
                >
                  <SlidersHorizontal size={16} /> Reduce travel time
                </button>
              </div>
            </div>
            <div className="replan-demo">
              <div className="replan-demo-header">
                <span>{activeChange.label}</span>
                <RefreshCw size={15} />
                <span className="replan-live">ADAPTING</span>
              </div>
              <p className="replan-prompt">“{activeChange.prompt}”</p>
              <div className="replan-swap">
                <div className="swap-row old">
                  <span>ORIGINAL</span>
                  <strong>{activeChange.from}</strong>
                  <X size={15} />
                </div>
                <div className="swap-line">
                  <span />
                  <MoveRight size={14} />
                  <span />
                </div>
                <div className="swap-row new">
                  <span>TRIPMIND / UPDATED</span>
                  <strong>{activeChange.to}</strong>
                  <CheckIcon />
                </div>
              </div>
              <p className="replan-note">{activeChange.note}</p>
            </div>
          </div>
        </section>

        <section className="group-section">
          <div className="section-kicker">
            <span className="section-index">
              04 <span>/</span> GROUP TRAVEL
            </span>
            <span className="kicker-rule" />
            <span className="kicker-status">
              THREE PREFERENCES / ONE BALANCE
            </span>
          </div>
          <div className="group-heading">
            <div>
              <p className="eyebrow">EVERYONE GETS A SAY</p>
              <h2>
                Find the <em>beautiful middle.</em>
              </h2>
            </div>
            <p>
              TripMind listens to the group without flattening anyone’s point of
              view. Preferences become a shared route, not a compromise nobody
              remembers.
            </p>
          </div>
          <div className="group-layout">
            <div className="traveler-list">
              {groupTravelers.map((traveler) => (
                <div className="traveler-row" key={traveler.name}>
                  <div
                    className="traveler-avatar"
                    style={{ background: traveler.color }}
                  >
                    {traveler.initials}
                  </div>
                  <div className="traveler-name">
                    <strong>{traveler.name}</strong>
                    <span>
                      traveller{" "}
                      {traveler.name === "Mara"
                        ? "01"
                        : traveler.name === "Theo"
                          ? "02"
                          : "03"}
                    </span>
                  </div>
                  <div className="preference-bars">
                    {Object.entries(traveler.preferences).map(
                      ([key, value]) => (
                        <div className="preference-bar" key={key}>
                          <span>{key}</span>
                          <div>
                            <i
                              style={{
                                width: `${value}%`,
                                background: traveler.color,
                              }}
                            />
                          </div>
                          <b>{value}%</b>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="group-balance">
              <div className="balance-head">
                <span>
                  <Users size={16} /> BALANCED ITINERARY
                </span>
                <span>LIVE MODEL</span>
              </div>
              <div className="balance-ring">
                <div className="ring ring-outer" />
                <div className="ring ring-middle" />
                <div className="ring ring-inner" />
                <div className="ring-core">
                  <span>
                    {groupFocus === "balance"
                      ? "78"
                      : groupFocus === "food"
                        ? "86"
                        : "82"}
                  </span>
                  <small>match</small>
                </div>
                <span className="ring-label label-top">FOOD</span>
                <span className="ring-label label-right">HISTORY</span>
                <span className="ring-label label-bottom">NATURE</span>
              </div>
              <div className="balance-tabs">
                <button
                  type="button"
                  className={groupFocus === "balance" ? "is-active" : ""}
                  onClick={() => setGroupFocus("balance")}
                >
                  Balanced
                </button>
                <button
                  type="button"
                  className={groupFocus === "food" ? "is-active" : ""}
                  onClick={() => setGroupFocus("food")}
                >
                  Food first
                </button>
                <button
                  type="button"
                  className={groupFocus === "history" ? "is-active" : ""}
                  onClick={() => setGroupFocus("history")}
                >
                  History first
                </button>
              </div>
              <p>
                {groupFocus === "balance"
                  ? "A calm blend of tastes, texture, and time."
                  : groupFocus === "food"
                    ? "The table becomes the anchor for the day."
                    : "A little more context between every turn."}
              </p>
            </div>
          </div>
        </section>

        <section className="closing-section">
          <div className="closing-mark">
            <img src={markImage} alt="" />
          </div>
          <p className="eyebrow">THE NEXT GOOD DETOUR</p>
          <h2>
            Leave room for
            <br />
            <em>what you couldn’t plan.</em>
          </h2>
          <button
            type="button"
            className="signal-button"
            onClick={() => scrollToSection("planner")}
          >
            Plan a trip <ArrowRight size={16} />
          </button>
          <div className="closing-orbit orbit-a" />
          <div className="closing-orbit orbit-b" />
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand">
          <img src={markImage} alt="" />
          <span>TripMind</span>
          <small>INTELLIGENT TRAVEL PLANNING</small>
        </div>
        <p>Intelligent travel planning, for the way you actually move.</p>
        <div>
          <span>© 2026 TripMind</span>
          <button type="button" onClick={() => scrollToSection("explore")}>
            Back to top <ArrowUpRight size={14} />
          </button>
        </div>
      </footer>
    </div>
  );
}

function CheckIcon() {
  return (
    <span className="check-icon" aria-label="Updated">
      <span />
    </span>
  );
}
