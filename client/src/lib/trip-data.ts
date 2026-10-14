// Midnight Atlas reminder: keep trip logic legible, constraint-aware, and separate from presentation.

export type Interest = "Food" | "History" | "Nature" | "Adventure" | "Shopping" | "Nightlife" | "Culture";

export type TripProfile = {
  destination: string;
  destinationCountry?: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  days: number;
  budget: number;
  currency: string;
  travelers: number;
  interests: Interest[];
  startTime: string;
  endTime: string;
};

export type ItineraryItem = {
  time: string;
  title: string;
  place: string;
  duration: string;
  travelFromPrevious?: string;
  kind: "food" | "culture" | "nature" | "shopping" | "stay";
  cost: number;
  stop: number;
};

export type ItineraryDay = {
  label: string;
  date: string;
  summary: string;
  items: ItineraryItem[];
};

export const interests: Interest[] = [
  "Food",
  "History",
  "Nature",
  "Adventure",
  "Shopping",
  "Nightlife",
  "Culture",
];

export const destinationOptions = [
  { city: "Lisbon", country: "Portugal", note: "Light, tiled streets, slow lunches", code: "PT" },
  { city: "Kyoto", country: "Japan", note: "Quiet lanes, seasonal rituals", code: "JP" },
  { city: "Copenhagen", country: "Denmark", note: "Design, harbor air, long tables", code: "DK" },
];

export const defaultTripProfile: TripProfile = {
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
};

const lisbonDayOne: ItineraryItem[] = [
  { time: "10:00", title: "Breakfast", place: "Dear Breakfast · Alfama", duration: "01h 00m", kind: "food", cost: 22, stop: 1 },
  { time: "11:30", title: "Historical attraction", place: "Castelo de São Jorge", duration: "02h 00m", travelFromPrevious: "12 min walk", kind: "culture", cost: 28, stop: 2 },
  { time: "14:00", title: "Lunch", place: "Taberna Sal Grosso", duration: "01h 15m", travelFromPrevious: "18 min ride", kind: "food", cost: 46, stop: 3 },
  { time: "16:00", title: "Museum", place: "MAAT · Belém", duration: "01h 45m", travelFromPrevious: "22 min ride", kind: "culture", cost: 18, stop: 4 },
  { time: "19:00", title: "Dinner", place: "Prado Mercearia", duration: "02h 00m", travelFromPrevious: "16 min ride", kind: "food", cost: 76, stop: 5 },
];

const lisbonDayTwo: ItineraryItem[] = [
  { time: "09:30", title: "Coffee and a walk", place: "Jardim da Estrela", duration: "01h 30m", kind: "nature", cost: 12, stop: 1 },
  { time: "11:30", title: "Tile workshop", place: "Azulejo Studio · Mouraria", duration: "02h 00m", travelFromPrevious: "14 min ride", kind: "culture", cost: 58, stop: 2 },
  { time: "14:15", title: "Market lunch", place: "Mercado de Campo de Ourique", duration: "01h 15m", travelFromPrevious: "19 min ride", kind: "food", cost: 34, stop: 3 },
  { time: "17:00", title: "Riverfront pause", place: "Ribeira das Naus", duration: "01h 30m", travelFromPrevious: "15 min ride", kind: "nature", cost: 0, stop: 4 },
  { time: "20:00", title: "Small plates", place: "Ofício Tavern", duration: "02h 00m", travelFromPrevious: "11 min walk", kind: "food", cost: 62, stop: 5 },
];

const lisbonDayThree: ItineraryItem[] = [
  { time: "09:00", title: "Bakery ritual", place: "Pastéis de Belém", duration: "01h 00m", kind: "food", cost: 16, stop: 1 },
  { time: "10:30", title: "Monastery visit", place: "Mosteiro dos Jerónimos", duration: "01h 45m", travelFromPrevious: "8 min walk", kind: "culture", cost: 20, stop: 2 },
  { time: "13:00", title: "Lunch by the water", place: "Doca de Santo", duration: "01h 30m", travelFromPrevious: "14 min walk", kind: "food", cost: 42, stop: 3 },
  { time: "16:00", title: "Vintage browse", place: "Feira da Ladra", duration: "02h 00m", travelFromPrevious: "29 min ride", kind: "shopping", cost: 24, stop: 4 },
  { time: "19:30", title: "Golden hour lookout", place: "Miradouro da Graça", duration: "01h 30m", travelFromPrevious: "13 min ride", kind: "nature", cost: 0, stop: 5 },
];

export const baseItinerary: ItineraryDay[] = [
  { label: "DAY 01", date: "MON · 14 OCT", summary: "Old Lisbon, then the river", items: lisbonDayOne },
  { label: "DAY 02", date: "TUE · 15 OCT", summary: "Texture, craft, a slower table", items: lisbonDayTwo },
  { label: "DAY 03", date: "WED · 16 OCT", summary: "Belém in the morning, Alfama at dusk", items: lisbonDayThree },
];

export const rainItinerary: ItineraryDay[] = [
  { ...baseItinerary[0], items: baseItinerary[0].items.map((item) => item.title === "Museum" ? { ...item, time: "15:15", title: "Indoor museum", place: "Museu do Oriente", duration: "02h 00m", travelFromPrevious: "10 min ride", cost: 14 } : item) },
  baseItinerary[1],
  baseItinerary[2],
];

export const shortRouteItinerary: ItineraryDay[] = [
  { ...baseItinerary[0], items: [baseItinerary[0].items[0], baseItinerary[0].items[1], { ...baseItinerary[0].items[2], time: "13:30", place: "Taberna Sal Grosso", travelFromPrevious: "8 min walk" }, { ...baseItinerary[0].items[3], time: "15:15", place: "Museu do Oriente", travelFromPrevious: "10 min ride" }, baseItinerary[0].items[4]] },
  baseItinerary[1],
  baseItinerary[2],
];

export const groupTravelers = [
  { name: "Mara", initials: "M", color: "#E35B3F", preferences: { Food: 90, History: 40, Nature: 68 } },
  { name: "Theo", initials: "T", color: "#A9B9AA", preferences: { Food: 50, History: 90, Nature: 42 } },
  { name: "Nia", initials: "N", color: "#D5B37A", preferences: { Food: 64, History: 35, Nature: 80 } },
];

export function flattenItems(days: ItineraryDay[]) {
  return days.flatMap((day) => day.items);
}

export function itineraryStats(days: ItineraryDay[], profile: TripProfile) {
  const items = flattenItems(days);
  const estimatedCost = items.reduce((sum, item) => sum + item.cost, 0);
  return {
    estimatedCost: estimatedCost * Math.max(profile.travelers, 1),
    remainingBudget: Math.max(profile.budget - estimatedCost * Math.max(profile.travelers, 1), 0),
    distance: days.length === 3 ? "18.6 km" : "24.1 km",
    travelTime: days.length === 3 ? "01h 42m" : "02h 08m",
    activities: items.length,
  };
}

export const mapStops = [
  { number: 1, label: "Alfama", short: "Breakfast", x: 20, y: 28 },
  { number: 2, label: "São Jorge", short: "History", x: 32, y: 18 },
  { number: 3, label: "Baixa", short: "Lunch", x: 44, y: 42 },
  { number: 4, label: "Belém", short: "Museum", x: 75, y: 56 },
  { number: 5, label: "Prado", short: "Dinner", x: 56, y: 78 },
];

export function makeTimeLabel(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 || 12;
  return `${normalized}:${String(minute).padStart(2, "0")} ${suffix}`;
}

const currencySymbols: Record<string, string> = {
  AED: "د.إ",
  ARS: "$",
  AUD: "A$",
  BDT: "৳",
  BRL: "R$",
  CAD: "C$",
  CHF: "CHF",
  CLP: "$",
  CNY: "¥",
  COP: "$",
  CZK: "Kč",
  DKK: "kr",
  EGP: "E£",
  EUR: "€",
  GBP: "£",
  HKD: "HK$",
  HUF: "Ft",
  IDR: "Rp",
  ILS: "₪",
  INR: "₹",
  JPY: "¥",
  KES: "KSh",
  KRW: "₩",
  MXN: "MX$",
  MYR: "RM",
  NGN: "₦",
  NOK: "kr",
  NZD: "NZ$",
  PHP: "₱",
  PKR: "₨",
  PLN: "zł",
  QAR: "ر.ق",
  RON: "lei",
  SAR: "﷼",
  SEK: "kr",
  SGD: "S$",
  THB: "฿",
  TRY: "₺",
  TWD: "NT$",
  USD: "$",
  VND: "₫",
  ZAR: "R",
};

export function currencySymbol(code: string) {
  return currencySymbols[code] ?? code;
}

export function formatMoney(amount: number, currency: string) {
  return `${currencySymbol(currency)}${amount.toLocaleString("en-US")}`;
}
