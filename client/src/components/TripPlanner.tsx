// Midnight Atlas reminder: each control should feel like editing a field note, not filling a form.

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Banknote, Check, Clock3, Compass, Minus, Plus, Search, Sparkles } from "lucide-react";
import { interests, type Interest, type TripProfile } from "@/lib/trip-data";

type TripPlannerProps = {
  onComplete: (profile: TripProfile) => void;
};

type CurrencyOption = {
  code: string;
  name: string;
  symbol: string;
};

const steps = [
  { eyebrow: "01 / DESTINATION", title: "Where are you going?" },
  { eyebrow: "02 / PACE", title: "How long are you staying?" },
  { eyebrow: "03 / PARAMETERS", title: "What's your budget?" },
  { eyebrow: "04 / COMPANY", title: "Who are you travelling with?" },
  { eyebrow: "05 / CURIOSITY", title: "What do you want to experience?" },
  { eyebrow: "06 / RHYTHM", title: "What does your ideal day look like?" },
];

const currencies: CurrencyOption[] = [
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "ARS", name: "Argentine Peso", symbol: "$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CLP", name: "Chilean Peso", symbol: "$" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "COP", name: "Colombian Peso", symbol: "$" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "Pound Sterling", symbol: "£" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "ILS", name: "Israeli New Shekel", symbol: "₪" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł" },
  { code: "QAR", name: "Qatari Riyal", symbol: "ر.ق" },
  { code: "RON", name: "Romanian Leu", symbol: "lei" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "TWD", name: "New Taiwan Dollar", symbol: "NT$" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
];

const currencyByCode = Object.fromEntries(currencies.map((currency) => [currency.code, currency])) as Record<string, CurrencyOption>;

type DestinationResult = {
  name: string;
  address: string;
  city: string;
  category: string;
  latitude: number;
  longitude: number;
};

export default function TripPlanner({ onComplete }: TripPlannerProps) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<TripProfile>({
    destination: "Lisbon",
    destinationCountry: "Portugal",
    destinationLatitude: 38.7077507,
    destinationLongitude: -9.1365919,
    days: 5,
    budget: 100000,
    currency: "INR",
    travelers: 2,
    interests: ["Food", "History", "Culture"],
    startTime: "09:00",
    endTime: "21:00",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DestinationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search-destinations?q=${encodeURIComponent(query)}`);
        const data = (await response.json()) as { destinations?: DestinationResult[]; error?: string };
        setSearchResults(data.destinations ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => {
      if (searchDebounceRef.current !== null) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  const selectedCurrency = currencyByCode[profile.currency] ?? currencyByCode.INR;

  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(profile.destination);
    if (step === 4) return profile.interests.length > 0;
    return true;
  }, [profile, step]);

  const selectInterest = (interest: Interest) => {
    setProfile((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest],
    }));
  };

  const selectCurrency = (code: string) => {
    const nextCurrency = currencyByCode[code];
    if (!nextCurrency) return;
    setProfile((current) => ({ ...current, currency: nextCurrency.code }));
  };

  const updateBudget = (raw: string) => {
    if (raw === "") {
      setProfile((current) => ({ ...current, budget: 0 }));
      return;
    }
    const nextBudget = Number(raw);
    if (!Number.isFinite(nextBudget) || nextBudget < 0) return;
    setProfile((current) => ({ ...current, budget: nextBudget }));
  };

  const next = () => {
    if (!canContinue) return;
    if (step === steps.length - 1) onComplete(profile);
    else setStep((current) => current + 1);
  };

  const previous = () => setStep((current) => Math.max(0, current - 1));

  return (
    <div className="planner-shell" id="planner">
      <div className="planner-rail">
        <div className="planner-intro">
          <p className="eyebrow">BUILD A TRIP / 06 STEPS</p>
          <h2>Start with<br /><em>your rhythm.</em></h2>
          <p className="planner-note">A considered itinerary begins with a few small decisions. TripMind uses them to make the whole day feel possible.</p>
        </div>
        <div className="step-list" aria-label="Trip planner progress">
          {steps.map((item, index) => (
            <button type="button" key={item.eyebrow} className={`step-marker ${index === step ? "is-active" : ""} ${index < step ? "is-complete" : ""}`} onClick={() => index < step && setStep(index)} aria-current={index === step ? "step" : undefined}>
              <span className="step-number">{index < step ? <Check size={12} /> : String(index + 1).padStart(2, "0")}</span>
              <span className="step-copy">{item.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="planner-panel">
        <div className="planner-topline">
          <span>{steps[step].eyebrow}</span>
          <span>{String(step + 1).padStart(2, "0")} / 06</span>
        </div>
        <div className="planner-progress"><span style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>

        <div className="planner-question" key={step}>
          <h3>{steps[step].title}</h3>
          {step === 0 && (
            <div className="destination-search">
              <div className="destination-search-input">
                <Search size={17} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search a destination..."
                  aria-label="Search destinations"
                />
                {isSearching && <span className="destination-search-status">SEARCHING</span>}
              </div>
              {searchResults.length > 0 && (
                <div className="destination-options">
                  {searchResults.map((destination) => (
                    <button
                      type="button"
                      key={`${destination.name}-${destination.latitude}-${destination.longitude}`}
                      className={`destination-option ${profile.destination === destination.name && profile.destinationLatitude === destination.latitude ? "is-selected" : ""}`}
                      onClick={() => {
                        setSearchQuery(destination.name);
                        setSearchResults([]);
                        setProfile({
                          ...profile,
                          destination: destination.name,
                          destinationCountry: destination.address,
                          destinationLatitude: destination.latitude,
                          destinationLongitude: destination.longitude,
                        });
                      }}
                    >
                      <span className="destination-code">{destination.city.slice(0, 2).toUpperCase()}</span>
                      <span><strong>{destination.name}</strong><small>{destination.address}</small></span>
                      <span className="selection-dot" />
                    </button>
                  ))}
                </div>
              )}
              {!isSearching && searchQuery.trim() && searchResults.length === 0 && (
                <p className="destination-search-empty">No destinations found.</p>
              )}
            </div>
          )}
          {step === 1 && (
            <div className="duration-choice">
              <div className="duration-number"><span>{profile.days}</span><small>days</small></div>
              <input aria-label="Trip duration in days" type="range" min="2" max="14" value={profile.days} onChange={(event) => setProfile({ ...profile, days: Number(event.target.value) })} />
              <div className="range-labels"><span>quick escape</span><span>slow travel</span></div>
            </div>
          )}
          {step === 2 && (
            <div className="budget-choice">
              <div className="time-input">
                <Banknote size={17} />
                <label htmlFor="budget-currency">Currency</label>
                <select
                  id="budget-currency"
                  aria-label="Budget currency"
                  value={selectedCurrency.code}
                  onChange={(event) => selectCurrency(event.target.value)}
                  style={{ border: 0, background: "transparent", color: "var(--gold)", fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 29, cursor: "pointer" }}
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} · {currency.name} ({currency.symbol})
                    </option>
                  ))}
                </select>
              </div>
              <div className="budget-value">
                <span>
                  {selectedCurrency.symbol}
                  <input
                    aria-label={`Trip budget in ${selectedCurrency.name}`}
                    type="number"
                    inputMode="decimal"
                    step="any"
                    value={profile.budget}
                    onChange={(event) => updateBudget(event.target.value)}
                    style={{ width: "100%", minWidth: 0, border: 0, background: "transparent", color: "inherit", font: "inherit", letterSpacing: "inherit", outline: "none" }}
                  />
                </span>
                <small>for the trip · {selectedCurrency.code}</small>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="traveler-choice">
              <div className="traveler-orbit"><Compass size={34} strokeWidth={1.2} /><span>{profile.travelers} <small>travellers</small></span></div>
              <div className="counter-control"><button type="button" aria-label="Remove traveller" onClick={() => setProfile({ ...profile, travelers: Math.max(1, profile.travelers - 1) })}><Minus size={15} /></button><strong>{profile.travelers}</strong><button type="button" aria-label="Add traveller" onClick={() => setProfile({ ...profile, travelers: Math.min(8, profile.travelers + 1) })}><Plus size={15} /></button></div>
              <p>Planning for a group changes the balance of time, budget, and everyone’s small non-negotiables.</p>
            </div>
          )}
          {step === 4 && (
            <div className="interest-grid">
              {interests.map((interest) => (
                <button type="button" key={interest} className={`interest-option ${profile.interests.includes(interest) ? "is-selected" : ""}`} onClick={() => selectInterest(interest)}><span>{interest}</span>{profile.interests.includes(interest) ? <Check size={15} /> : <Plus size={15} />}</button>
              ))}
              <p className="interest-hint">Choose as many as feel true. TripMind will find the overlap.</p>
            </div>
          )}
          {step === 5 && (
            <div className="schedule-choice">
              <div className="time-input"><Clock3 size={17} /><label htmlFor="start-time">Start the day</label><input id="start-time" type="time" value={profile.startTime} onChange={(event) => setProfile({ ...profile, startTime: event.target.value })} /></div>
              <div className="time-connector"><span /> <small>your day</small> <span /></div>
              <div className="time-input"><Clock3 size={17} /><label htmlFor="end-time">Call it a night</label><input id="end-time" type="time" value={profile.endTime} onChange={(event) => setProfile({ ...profile, endTime: event.target.value })} /></div>
              <div className="schedule-summary"><Sparkles size={15} /><span>We’ll keep the day spacious enough for an unplanned stop.</span></div>
            </div>
          )}
        </div>

        <div className="planner-actions">
          <button type="button" className="quiet-button" onClick={previous} disabled={step === 0}><ArrowLeft size={15} /> Back</button>
          <button type="button" className="signal-button" onClick={next} disabled={!canContinue}>{step === steps.length - 1 ? "Build my itinerary" : "Continue"}<ArrowRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}
