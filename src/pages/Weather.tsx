import { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  RefreshCw,
  Wind,
  Droplets,
  Eye,
  Thermometer,
  CloudRain,
  Sun,
  Cloud,
  CloudSnow,
  CloudLightning,
  Cloudy,
  Navigation,
  AlertTriangle,
  Leaf,
  ArrowUp,
  ArrowDown,
  Clock,
  Bug,
  Gauge,
  CheckCircle2,
  XCircle,
  Sprout,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeatherData {
  location: string;
  area: string;
  country: string;
  lat: number;
  lon: number;
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    windDir: number;
    visibility: number;
    weatherCode: number;
    isDay: number;
    uvIndex: number;
    precipitation: number;
    dewPoint: number;
  };
  hourly: Array<{
    time: string;
    temp: number;
    weatherCode: number;
    precip: number;
    isDay: number;
  }>;
  daily: Array<{
    date: string;
    tempMax: number;
    tempMin: number;
    weatherCode: number;
    precipSum: number;
    windMax: number;
    uvIndexMax: number;
    sunrise: string;
    sunset: string;
  }>;
}

// ─── Weather Code Helpers ──────────────────────────────────────────────────────

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
  45: "Foggy", 48: "Icy Fog", 51: "Light Drizzle", 53: "Drizzle",
  55: "Heavy Drizzle", 61: "Light Rain", 63: "Rain", 65: "Heavy Rain",
  71: "Light Snow", 73: "Snow", 75: "Heavy Snow", 77: "Snow Grains",
  80: "Light Showers", 81: "Showers", 82: "Heavy Showers",
  85: "Snow Showers", 86: "Heavy Snow Showers",
  95: "Thunderstorm", 96: "Thunderstorm w/ Hail", 99: "Thunderstorm w/ Heavy Hail",
};

function getWeatherDesc(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? "Unknown";
}

function WeatherIcon({ code, isDay, size = "md" }: { code: number; isDay?: number; size?: "sm" | "md" | "lg" }) {
  const sz = size === "lg" ? "h-20 w-20" : size === "sm" ? "h-5 w-5" : "h-8 w-8";
  const iconClass = cn(sz, "drop-shadow");

  if (code === 0 || code === 1) {
    return isDay !== 0
      ? <Sun className={cn(iconClass, "text-yellow-400")} />
      : <Sun className={cn(iconClass, "text-blue-300")} />;
  }
  if (code === 2 || code === 3) return <Cloudy className={cn(iconClass, "text-slate-400")} />;
  if (code >= 45 && code <= 48) return <Cloud className={cn(iconClass, "text-slate-300")} />;
  if (code >= 51 && code <= 67) return <CloudRain className={cn(iconClass, "text-blue-400")} />;
  if (code >= 71 && code <= 77) return <CloudSnow className={cn(iconClass, "text-sky-300")} />;
  if (code >= 80 && code <= 82) return <CloudRain className={cn(iconClass, "text-blue-500")} />;
  if (code >= 85 && code <= 86) return <CloudSnow className={cn(iconClass, "text-sky-200")} />;
  if (code >= 95) return <CloudLightning className={cn(iconClass, "text-purple-400")} />;
  return <Sun className={cn(iconClass, "text-yellow-400")} />;
}

function getBgGradient(code: number, isDay: number): string {
  if (isDay === 0) return "from-slate-900 via-blue-950 to-indigo-950";
  if (code === 0 || code === 1) return "from-sky-400 via-blue-500 to-indigo-500";
  if (code === 2 || code === 3) return "from-slate-400 via-slate-500 to-slate-600";
  if (code >= 51 && code <= 82) return "from-slate-600 via-blue-700 to-slate-800";
  if (code >= 95) return "from-slate-800 via-purple-900 to-slate-900";
  if (code >= 71 && code <= 86) return "from-sky-200 via-blue-300 to-indigo-400";
  return "from-sky-400 via-blue-500 to-indigo-500";
}

// ─── Farming Advisory ─────────────────────────────────────────────────────────

function getFarmingTip(data: WeatherData): { icon: string; tip: string; color: string } {
  const { weatherCode, humidity, windSpeed, uvIndex } = data.current;
  const maxPrecip = Math.max(...data.daily.slice(0, 3).map((d) => d.precipSum));

  if (weatherCode >= 95) return { icon: "⚡", tip: "Thunderstorm alert! Stay indoors, secure farm equipment and livestock.", color: "text-purple-600 bg-purple-50 border-purple-200" };
  if (weatherCode >= 61 && weatherCode <= 82) return { icon: "🌧️", tip: "Rain expected. Avoid spraying pesticides. Check drainage in fields.", color: "text-blue-600 bg-blue-50 border-blue-200" };
  if (maxPrecip < 1 && humidity < 40) return { icon: "💧", tip: "Dry conditions ahead. Irrigate crops and mulch soil to retain moisture.", color: "text-orange-600 bg-orange-50 border-orange-200" };
  if (windSpeed > 30) return { icon: "💨", tip: "High winds today. Avoid aerial spraying. Stake tall plants if needed.", color: "text-teal-600 bg-teal-50 border-teal-200" };
  if (uvIndex >= 8) return { icon: "☀️", tip: "Intense UV today. Best to work in early morning or after 4PM.", color: "text-yellow-600 bg-yellow-50 border-yellow-200" };
  if (humidity > 85) return { icon: "🍄", tip: "High humidity — watch for fungal diseases on crops. Improve ventilation.", color: "text-green-600 bg-green-50 border-green-200" };
  return { icon: "🌱", tip: "Good conditions for field work. Ideal time to water, weed, or transplant.", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
}

// ─── Spray Advisory ──────────────────────────────────────────────────────────

interface SprayWindow {
  safe: boolean;
  label: string;
  reason: string;
  windows: string[];
}

function getSprayAdvisory(data: WeatherData): SprayWindow {
  const { windSpeed, weatherCode, humidity } = data.current;
  const isRaining = weatherCode >= 51 && weatherCode <= 99;
  const windows: string[] = [];

  if (isRaining) {
    return { safe: false, label: "Avoid Spraying", reason: "Active rain will wash away chemicals before absorption.", windows: [] };
  }
  if (windSpeed > 20) {
    return { safe: false, label: "Avoid Spraying", reason: `Wind at ${windSpeed} km/h causes drift. Spray only when wind < 15 km/h.`, windows: [] };
  }

  // Find calm windows in today's hourly data
  data.hourly.slice(0, 14).forEach((h) => {
    const hour = new Date(h.time).getHours();
    if (h.precip === 0 && (hour <= 9 || hour >= 17)) {
      const label = hour < 12 ? `${hour === 0 ? 12 : hour}:00 AM` : hour === 12 ? "12:00 PM" : `${hour - 12}:00 PM`;
      if (!windows.includes(label)) windows.push(label);
    }
  });

  if (humidity > 85) {
    return { safe: true, label: "Spray with Caution", reason: "High humidity — good for absorption but watch for fungal spread after spraying.", windows: windows.slice(0, 3) };
  }
  return { safe: true, label: "Good to Spray", reason: "Calm conditions. Best time is early morning (6–9 AM) or evening (5–7 PM) to avoid evaporation.", windows: windows.slice(0, 4) };
}

// ─── Irrigation Need ─────────────────────────────────────────────────────────

interface IrrigationNeed {
  score: number;   // 0–10
  label: string;
  color: string;
  detail: string;
  etMm: number;  // estimated ET in mm
}

function getIrrigationNeed(data: WeatherData): IrrigationNeed {
  const { temp, humidity, windSpeed, uvIndex } = data.current;
  // Simplified Hargreaves-Samani approximation of ET0 (mm/day)
  const tRange = data.daily[0].tempMax - data.daily[0].tempMin;
  const tMean = (data.daily[0].tempMax + data.daily[0].tempMin) / 2;
  const ra = (uvIndex / 10) * 15; // rough extraterrestrial radiation proxy
  const et0 = Math.max(0, 0.0023 * (tMean + 17.8) * Math.sqrt(Math.abs(tRange)) * ra);
  const etMm = Math.round(et0 * 10) / 10;

  const recentRain = data.daily.slice(0, 2).reduce((s, d) => s + d.precipSum, 0);
  const windFactor = windSpeed > 20 ? 1.2 : 1;
  let score = Math.min(10, Math.max(0, Math.round((etMm - recentRain * 0.4) * windFactor * 1.5)));

  if (humidity < 35) score = Math.min(10, score + 2);
  if (humidity > 75) score = Math.max(0, score - 1);

  if (score <= 2) return { score, etMm, label: "Not Needed", color: "text-emerald-600", detail: "Soil likely has adequate moisture. Skip irrigation today to avoid waterlogging." };
  if (score <= 4) return { score, etMm, label: "Low Need", color: "text-green-600", detail: `Evapotranspiration is low (~${etMm} mm). Light irrigation in 2–3 days should suffice.` };
  if (score <= 6) return { score, etMm, label: "Moderate Need", color: "text-amber-600", detail: `Estimated ET: ~${etMm} mm/day. Consider irrigating within 24 hours, especially sandy soils.` };
  if (score <= 8) return { score, etMm, label: "High Need", color: "text-orange-600", detail: `ET ~${etMm} mm/day with low recent rainfall. Irrigate today, preferably at dawn or dusk.` };
  return { score, etMm, label: "Critical", color: "text-red-600", detail: `ET ~${etMm} mm/day in hot dry conditions. Irrigate immediately to prevent wilting and yield loss.` };
}

// ─── Pest & Disease Risk ─────────────────────────────────────────────────────

interface PestRisk {
  fungalScore: number;   // 0–10
  insectScore: number;   // 0–10
  fungalLabel: string;
  insectLabel: string;
  fungalDetail: string;
  insectDetail: string;
}

function getPestRisk(data: WeatherData): PestRisk {
  const { humidity, temp, weatherCode } = data.current;
  const recentRain = data.daily.slice(0, 2).reduce((s, d) => s + d.precipSum, 0);
  const isRainy = weatherCode >= 51 && weatherCode <= 99;

  // Fungal risk: driven by humidity, rain, and mild temps
  let fungalScore = 0;
  if (humidity > 80) fungalScore += 4;
  else if (humidity > 65) fungalScore += 2;
  if (recentRain > 5) fungalScore += 3;
  else if (recentRain > 0) fungalScore += 1;
  if (temp >= 18 && temp <= 28) fungalScore += 2;
  if (isRainy) fungalScore += 1;
  fungalScore = Math.min(10, fungalScore);

  // Insect/pest risk: driven by warm temps and dry weather
  let insectScore = 0;
  if (temp >= 25 && temp <= 38) insectScore += 4;
  else if (temp >= 20) insectScore += 2;
  if (humidity < 50) insectScore += 3;
  else if (humidity < 65) insectScore += 1;
  if (!isRainy) insectScore += 2;
  insectScore = Math.min(10, insectScore);

  const riskLabel = (s: number) => s <= 2 ? "Low" : s <= 5 ? "Moderate" : s <= 7 ? "High" : "Very High";

  return {
    fungalScore, insectScore,
    fungalLabel: riskLabel(fungalScore),
    insectLabel: riskLabel(insectScore),
    fungalDetail: fungalScore > 6
      ? "Prime fungal conditions. Scout crops daily. Apply preventive fungicide."
      : fungalScore > 4
        ? "Moderate fungal risk. Check for early symptoms on leaves and stems."
        : "Low fungal pressure today. Continue regular monitoring.",
    insectDetail: insectScore > 6
      ? "High insect activity likely. Check for aphids, thrips, or stem borers."
      : insectScore > 4
        ? "Moderate insect presence. Use yellow sticky traps for early detection."
        : "Low insect pressure. Favourable conditions for beneficials like bees.",
  };
}

// ─── Best Working Hours ───────────────────────────────────────────────────────

interface WorkWindow {
  hour: string;
  score: number;
  reason: string;
}

function getBestWorkHours(data: WeatherData): WorkWindow[] {
  return data.hourly
    .slice(0, 13)
    .map((h) => {
      const hour = new Date(h.time).getHours();
      let score = 10;
      const reasons: string[] = [];

      // Temperature penalty
      if (h.temp > 38) { score -= 4; reasons.push("extreme heat"); }
      else if (h.temp > 33) { score -= 2; reasons.push("hot"); }
      else if (h.temp < 8) { score -= 2; reasons.push("cold"); }

      // Rain penalty
      if (h.precip > 2) { score -= 4; reasons.push("heavy rain"); }
      else if (h.precip > 0) { score -= 2; reasons.push("light rain"); }

      // Dark penalty
      if (h.isDay === 0) { score -= 3; reasons.push("night"); }

      // UV bonus (peak hours are bad)
      if (hour >= 11 && hour <= 15 && h.isDay === 1) { score -= 2; reasons.push("peak UV"); }

      // Early morning bonus
      if (hour >= 5 && hour <= 9) score += 1;
      // Evening bonus
      if (hour >= 16 && hour <= 18) score += 1;

      score = Math.max(0, Math.min(10, score));
      const reason = reasons.length ? `(${reasons.join(", ")})` : "ideal";
      return {
        hour: hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`,
        score,
        reason,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// ─── Crop Data ───────────────────────────────────────────────────────────────

const CROPS = [
  { id: "wheat", name: "Wheat", emoji: "🌾" },
  { id: "rice", name: "Rice", emoji: "🍚" },
  { id: "cotton", name: "Cotton", emoji: "🪴" },
  { id: "maize", name: "Maize", emoji: "🌽" },
  { id: "tomato", name: "Tomato", emoji: "🍅" },
  { id: "potato", name: "Potato", emoji: "🥔" },
  { id: "onion", name: "Onion", emoji: "🧅" },
  { id: "sugarcane", name: "Sugarcane", emoji: "🎋" },
  { id: "soybean", name: "Soybean", emoji: "🫘" },
  { id: "groundnut", name: "Groundnut", emoji: "🥜" },
  { id: "chilli", name: "Chilli", emoji: "🌶️" },
  { id: "mustard", name: "Mustard", emoji: "🌿" },
  { id: "banana", name: "Banana", emoji: "🍌" },
  { id: "mango", name: "Mango", emoji: "🥭" },
  { id: "grapes", name: "Grapes", emoji: "🍇" },
  { id: "tea", name: "Tea", emoji: "🍃" },
];

type Severity = "info" | "warning" | "danger";

interface CropPrecaution {
  icon: string;
  title: string;
  detail: string;
  severity: Severity;
}

function getCropPrecautions(cropId: string, data: WeatherData): CropPrecaution[] {
  const { weatherCode, humidity, windSpeed, uvIndex, feelsLike, temp } = data.current;
  const maxPrecip = Math.max(...data.daily.slice(0, 3).map((d) => d.precipSum));
  const isRainy = weatherCode >= 51 && weatherCode <= 82;
  const isStorm = weatherCode >= 95;
  const isHot = temp >= 38;
  const isCold = feelsLike < 10;
  const isWindy = windSpeed > 25;
  const isHumid = humidity > 80;
  const isDry = maxPrecip < 1 && humidity < 40;

  const tips: CropPrecaution[] = [];

  // ── Universal storm warning ──
  if (isStorm) {
    tips.push({
      icon: "⚡", severity: "danger",
      title: "Thunderstorm – Stop All Field Work",
      detail: "Do not operate machinery or stand near tall trees. Secure irrigation pipes and tools immediately."
    });
  }

  switch (cropId) {
    case "wheat":
      if (isRainy || isStorm) tips.push({ icon: "🌧️", severity: "warning", title: "Avoid Harvesting in Rain", detail: "Wet wheat is prone to grain spoilage and fungal infection. Wait for 2–3 dry days before cutting." });
      if (isHot) tips.push({ icon: "🌡️", severity: "danger", title: "Heat Stress – Urgent Irrigation", detail: "Temps above 38°C during grain fill causes shrivelling. Irrigate immediately, preferably at dawn." });
      if (isCold) tips.push({ icon: "❄️", severity: "warning", title: "Frost Risk on Seedlings", detail: "Light frost can damage young wheat seedlings. Use sprinkler irrigation at night to prevent frost damage." });
      if (isDry) tips.push({ icon: "💧", severity: "warning", title: "Soil Moisture Low", detail: "Apply protective irrigation (4–5 cm). Crown root initiation stage is the most critical for water." });
      if (isHumid) tips.push({ icon: "🍄", severity: "warning", title: "Yellow/Brown Rust Alert", detail: "High humidity favours rust diseases. Apply Propiconazole 25 EC @ 0.1% at first sign of spots." });
      break;

    case "rice":
      if (isWindy) tips.push({ icon: "💨", severity: "warning", title: "Lodging Risk", detail: "Strong winds can flatten paddy at grain filling stage. Drain field slightly to stiffen stems." });
      if (isStorm || isRainy) tips.push({ icon: "🌊", severity: "danger", title: "Check Field Bunds", detail: "Heavy rain may breach bunds and cause flooding. Inspect and reinforce bunds; open drainage channels." });
      if (isHumid) tips.push({ icon: "🍄", severity: "danger", title: "Blast Disease Alert", detail: "Humidity >80% is ideal for rice blast. Spray Tricyclazole 75 WP @ 0.6 g/L water preventively." });
      if (isHot) tips.push({ icon: "🌡️", severity: "warning", title: "Spikelet Sterility Risk", detail: "Temps >35°C at flowering reduce grain set. Maintain standing water to cool crop." });
      if (isDry) tips.push({ icon: "💧", severity: "warning", title: "Maintain Flood Water", detail: "Rice needs 5 cm standing water. Irrigate immediately; do not let soil crack." });
      break;

    case "cotton":
      if (isRainy || isStorm) tips.push({ icon: "🌧️", severity: "danger", title: "Protect Open Bolls", detail: "Rain on open bolls causes fibre staining and rotting. Harvest any mature open bolls urgently before more rain." });
      if (isHumid) tips.push({ icon: "🍄", severity: "warning", title: "Boll Rot Risk", detail: "High humidity increases boll rot. Ensure proper plant spacing and spray Copper Oxychloride 50 WP @ 3 g/L." });
      if (isHot) tips.push({ icon: "🌡️", severity: "warning", title: "Increase Irrigation Frequency", detail: "Cotton is drought-sensitive at flowering. Irrigate every 7–10 days and apply mulch to conserve soil moisture." });
      if (isWindy) tips.push({ icon: "💨", severity: "info", title: "Delay Pesticide Spray", detail: "Winds above 25 km/h cause spray drift onto neighbouring crops. Spray only in early morning calm." });
      if (isDry) tips.push({ icon: "💧", severity: "warning", title: "Critical Irrigation Period", detail: "Flowering & boll development needs consistent moisture. Deficit irrigation now reduces yield significantly." });
      break;

    case "maize":
      if (isWindy) tips.push({ icon: "💨", severity: "warning", title: "Stalk Lodging Alert", detail: "Winds can topple maize at tasselling stage. Avoid top-dressing urea in windy conditions; stake if needed." });
      if (isRainy) tips.push({ icon: "🌧️", severity: "info", title: "Waterlogging Caution", detail: "Maize cannot tolerate waterlogging for more than 48 hours. Clear drainage channels immediately after rain." });
      if (isHumid) tips.push({ icon: "🍄", severity: "warning", title: "Downy Mildew / Blight Risk", detail: "High humidity promotes downy mildew. Spray Metalaxyl MZ 72 WP @ 2.5 g/L at first sign." });
      if (isHot) tips.push({ icon: "🌡️", severity: "warning", title: "Silk Drying Risk", detail: "Heat >38°C desiccates silks and reduces pollination. Irrigation at silking is critical." });
      if (isDry) tips.push({ icon: "💧", severity: "danger", title: "Irrigate at Silking", detail: "Silking and grain fill are the most drought-sensitive stages. Even one missed irrigation can cut yield by 30%." });
      break;

    case "tomato":
      if (isHumid || isRainy) tips.push({ icon: "🍄", severity: "danger", title: "Late Blight Alert", detail: "Humid/rainy weather is prime for Phytophthora blight. Spray Mancozeb 75 WP @ 2.5 g/L every 5–7 days." });
      if (isHot) tips.push({ icon: "🌡️", severity: "warning", title: "Blossom Drop Warning", detail: "Temps >35°C cause flower drop. Spray Planofix (NAA) @ 4.5 mg/L and irrigate in the evening." });
      if (uvIndex >= 7) tips.push({ icon: "☀️", severity: "info", title: "Use Shade Net (30–50%)", detail: "Intense sunlight causes sunscald on fruits. Use shade nets and harvest fruits before they are over-ripe." });
      if (isWindy) tips.push({ icon: "💨", severity: "info", title: "Stake & Tie Plants", detail: "High winds can snap staked tomato plants. Check all ties and add extra stakes to tall varieties." });
      if (isDry) tips.push({ icon: "💧", severity: "warning", title: "Prevent Blossom End Rot", detail: "Irregular watering leads to calcium deficiency and blossom end rot. Drip irrigate consistently." });
      break;

    case "potato":
      if (isHumid || isRainy) tips.push({ icon: "🍄", severity: "danger", title: "Late Blight Emergency", detail: "This weather is ideal for Phytophthora infestans. Spray Cymoxanil + Mancozeb @ 3 g/L every 5 days." });
      if (isCold) tips.push({ icon: "❄️", severity: "warning", title: "Frost Protection Needed", detail: "Ground frost will kill potato foliage. Apply light irrigation before sunset to create frost-protective water film." });
      if (isHot) tips.push({ icon: "🌡️", severity: "warning", title: "Tuber Greening Risk", detail: "Heat causes tubers to rise near surface. Earth up rows and add mulch to prevent sun exposure." });
      if (isDry) tips.push({ icon: "💧", severity: "warning", title: "Tuber Initiation Irrigation", detail: "Potato needs consistent moisture at tuber initiation. Irrigate every 10–12 days; avoid water stress." });
      break;

    case "onion":
      if (isRainy || isStorm) tips.push({ icon: "🌧️", severity: "warning", title: "Thrips & Purple Blotch Alert", detail: "Rain splashes spores of purple blotch. Spray Iprodione + Carbendazim @ 2 g/L after rain subsides." });
      if (isHumid) tips.push({ icon: "🍄", severity: "warning", title: "Downy Mildew Watch", detail: "Humidity >80% favours downy mildew on leaves. Spray Metalaxyl MZ 72 WP @ 2.5 g/L preventively." });
      if (isDry) tips.push({ icon: "💧", severity: "info", title: "Bulb Development Irrigation", detail: "Onion needs steady moisture for bulb sizing. Irrigate every 7–8 days; stop 10 days before harvest." });
      if (isHot) tips.push({ icon: "🌡️", severity: "info", title: "Early Maturity Possible", detail: "High heat accelerates maturity. Monitor neck fall (tops bending over) and plan harvest 2–3 weeks early." });
      break;

    case "sugarcane":
      if (isWindy) tips.push({ icon: "💨", severity: "danger", title: "Lodging – Prop Up Canes", detail: "High winds topple sugarcane. Immediately bind and prop fallen canes with bamboo stakes to prevent yield loss." });
      if (isRainy || isStorm) tips.push({ icon: "🌧️", severity: "warning", title: "Red Rot Watch", detail: "Waterlogged soils spread red rot fungus. Open furrows for drainage; destroy affected stools." });
      if (isDry) tips.push({ icon: "💧", severity: "warning", title: "Irrigation Critical at Grand Growth", detail: "Sugarcane needs water every 10–15 days during grand growth stage. Deficit now hits juice brix heavily." });
      if (isHumid) tips.push({ icon: "🍄", severity: "info", title: "Smut Disease Check", detail: "Inspect regularly for whip smut (black whip-like growth). Remove and burn infected stools." });
      break;

    case "soybean":
      if (isRainy || isHumid) tips.push({ icon: "🍄", severity: "warning", title: "Rust & Stem Fly Alert", detail: "Humid weather promotes soybean rust. Spray Hexaconazole 5 EC @ 1 mL/L; monitor for stem fly damage." });
      if (isWindy || isStorm) tips.push({ icon: "💨", severity: "info", title: "Delay Spraying", detail: "Soybean plants are delicate. Avoid foliar sprays in windy conditions to prevent crop damage and drift." });
      if (isHot) tips.push({ icon: "🌡️", severity: "warning", title: "Pod Fill Irrigation", detail: "Heat stress at R5–R6 stage reduces seed size. Ensure moisture availability; apply light irrigation." });
      if (isDry) tips.push({ icon: "💧", severity: "warning", title: "Critical Pod-Fill Stage", detail: "Drought during pod fill reduces protein content and yield. Irrigate if soil is dry 5 cm below surface." });
      break;

    case "groundnut":
      if (isDry) tips.push({ icon: "💧", severity: "danger", title: "Irrigate at Peg & Pod Fill", detail: "Drought at pegging causes complete pod failure. Immediately irrigate; even one drought event cuts yield by 40%." });
      if (isRainy || isHumid) tips.push({ icon: "🍄", severity: "warning", title: "Tikka Disease / Collar Rot Alert", detail: "Wet weather promotes Cercospora tikka and collar rot. Apply Chlorothalonil 75 WP @ 2 g/L." });
      if (isHot) tips.push({ icon: "🌡️", severity: "info", title: "Mulch to Conserve Moisture", detail: "Spread paddy straw mulch between rows to reduce soil temp and conserve moisture for pod development." });
      if (isCold) tips.push({ icon: "❄️", severity: "info", title: "Delayed Maturity Possible", detail: "Cold weather slows pod maturation. Check maturity by sampling; harvest only when shell inner wall is dark." });
      break;

    case "chilli":
      if (isHumid || isRainy) tips.push({ icon: "🍄", severity: "danger", title: "Anthracnose (Die-Back) Alert", detail: "Wet weather causes fruit rot and die-back. Spray Carbendazim 50 WP @ 1 g/L at weekly intervals." });
      if (isHot) tips.push({ icon: "🌡️", severity: "warning", title: "Flower Drop in Heat", detail: "Temps >35°C cause flower and fruit drop. Spray Boron @ 0.2% and irrigate in the evening." });
      if (isCold) tips.push({ icon: "❄️", severity: "warning", title: "Frost Damage Risk", detail: "Chilli is frost-sensitive. Cover with polythene overnight; apply sulphur dust to reduce frost impact." });
      if (isWindy) tips.push({ icon: "💨", severity: "info", title: "Support Tall Plants", detail: "Wind can snap gangly chilli plants. Stake plants to bamboo poles and tie loosely." });
      break;

    case "mustard":
      if (isCold) tips.push({ icon: "❄️", severity: "info", title: "Good Conditions for Flowering", detail: "Cool temperatures (10–20°C) are ideal for mustard flowering and pod set. No immediate action needed." });
      if (isHumid || isRainy) tips.push({ icon: "🍄", severity: "danger", title: "Alternaria Blight / Powdery Mildew", detail: "Wet conditions trigger alternaria blight and white rust. Spray Mancozeb 75 WP @ 2 g/L immediately." });
      if (isHot) tips.push({ icon: "🌡️", severity: "danger", title: "Silique Shrivelling Risk", detail: "Heat during seed fill shrivels mustard pods. Irrigate if possible; advance harvest by 4–5 days." });
      if (isWindy) tips.push({ icon: "💨", severity: "info", title: "Lodging Possible at Maturity", detail: "Tall mustard plants can lodge in wind before harvest. Plan combining or cutting within a few days." });
      break;

    case "banana":
      if (isWindy) tips.push({ icon: "💨", severity: "danger", title: "Stake Plants Immediately", detail: "Banana pseudostems snap in winds above 25 km/h. Prop each plant with bamboo stakes tied at an angle." });
      if (isCold) tips.push({ icon: "❄️", severity: "danger", title: "Cover Young Suckers", detail: "Temps below 10°C cause chilling injury. Cover young suckers with polythene or straw; delay bunch emergence plants." });
      if (isHumid || isRainy) tips.push({ icon: "🍄", severity: "warning", title: "Sigatoka Leaf Spot Alert", detail: "Rain and humidity spread Sigatoka disease. Spray Propiconazole 25 EC @ 1 mL/L on leaf undersides." });
      if (isHot) tips.push({ icon: "🌡️", severity: "info", title: "Increase Irrigation", detail: "Banana is high water-use. In heat, irrigate every 3–4 days; mulch heavily around the base." });
      break;

    case "mango":
      if (isCold) tips.push({ icon: "❄️", severity: "warning", title: "Protect Flowering Shoots", detail: "Cold winds and frost damage mango panicles. Spray potassium nitrate @ 1% to delay and protect flowering." });
      if (isRainy || isHumid) tips.push({ icon: "🍄", severity: "danger", title: "Powdery Mildew & Anthracnose", detail: "Pre-harvest rains cause anthracnose fruit rot. Spray Carbendazim 50 WP @ 1 g/L during panicle development." });
      if (isHot && uvIndex >= 7) tips.push({ icon: "☀️", severity: "warning", title: "Sunburn on Fruits", detail: "Intense sun causes yellow patching on fruits. Apply whitewash (lime) to tree trunks and cover exposed clusters." });
      if (isWindy) tips.push({ icon: "💨", severity: "warning", title: "Pre-Mature Fruit Drop", detail: "Strong winds cause premature fruit drop. Spray NAA @ 20 ppm to improve fruit retention." });
      break;

    case "grapes":
      if (isHumid || isRainy) tips.push({ icon: "🍄", severity: "danger", title: "Downy & Powdery Mildew Emergency", detail: "Grapes are extremely susceptible. Spray Fosetyl Aluminium @ 2.5 g/L for downy; Sulfur 80 WP @ 3 g/L for powdery mildew." });
      if (isRainy) tips.push({ icon: "🌧️", severity: "warning", title: "Berry Cracking at Harvest", detail: "Rain just before harvest causes berry splitting and botrytis rot. Harvest ripe clusters immediately if possible." });
      if (isHot) tips.push({ icon: "🌡️", severity: "warning", title: "Berry Shrivelling", detail: "Heat causes loss of berry plumpness and sugar concentration. Irrigate and apply kaolin spray to reduce surface temp." });
      if (isWindy) tips.push({ icon: "💨", severity: "info", title: "Check Trellis & Wires", detail: "High winds can dislodge canes from trellis wires. Inspect and re-tie all cordons and canes." });
      break;

    case "tea":
      if (isHumid || isRainy) tips.push({ icon: "🍄", severity: "warning", title: "Blister Blight Alert", detail: "Humid rains promote blister blight on young shoots. Spray Hexaconazole 5 EC @ 0.5 mL/L at 7-day intervals." });
      if (uvIndex >= 7) tips.push({ icon: "☀️", severity: "info", title: "Optimal Plucking Window", detail: "High UV promotes anthocyanin in leaves. Pluck in early morning (before 10 AM) for best quality flush." });
      if (isCold) tips.push({ icon: "❄️", severity: "warning", title: "Frost Burns Young Shoots", detail: "Night frost damages tender tea shoots in highland gardens. Light overhead irrigation before dawn helps prevent frost." });
      if (isDry) tips.push({ icon: "💧", severity: "warning", title: "Drought Reduces Flush Yield", detail: "Dry spells significantly reduce new growth. Irrigate if possible; apply mulch to conserve soil moisture in rows." });
      break;
  }

  // Fallback if nothing generated
  if (tips.length === 0) {
    tips.push({ icon: "✅", severity: "info", title: "Conditions Look Favourable", detail: `Current weather poses no immediate risk to your ${CROPS.find(c => c.id === cropId)?.name ?? cropId} crop. Continue normal farm operations.` });
  }

  return tips;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

async function reverseGeocode(lat: number, lon: number): Promise<{ city: string; area: string; country: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    const addr = data.address ?? {};
    const city =
      addr.city || addr.town || addr.village || addr.county || "Unknown";
    const area =
      addr.neighbourhood ||
      addr.suburb ||
      addr.quarter ||
      addr.district ||
      addr.state_district ||
      addr.state ||
      "";
    return { city, area: area !== city ? area : "", country: addr.country || "" };
  } catch {
    return { city: "Your Location", area: "", country: "" };
  }
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("current", [
    "temperature_2m", "apparent_temperature", "relative_humidity_2m",
    "wind_speed_10m", "wind_direction_10m", "visibility", "weather_code",
    "is_day", "uv_index", "precipitation", "dew_point_2m",
  ].join(","));
  url.searchParams.set("hourly", "temperature_2m,weather_code,precipitation,is_day");
  url.searchParams.set("daily", [
    "temperature_2m_max", "temperature_2m_min", "weather_code",
    "precipitation_sum", "wind_speed_10m_max", "uv_index_max",
    "sunrise", "sunset",
  ].join(","));
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");

  const [weatherRes, geoRes] = await Promise.all([
    fetch(url.toString()),
    reverseGeocode(lat, lon),
  ]);

  if (!weatherRes.ok) throw new Error("Weather API failed");
  const w = await weatherRes.json();

  const nowIdx = w.hourly.time.findIndex((t: string) => {
    const tDate = new Date(t);
    const now = new Date();
    return tDate.getHours() === now.getHours() && tDate.toDateString() === now.toDateString();
  });
  const startIdx = nowIdx >= 0 ? nowIdx : 0;

  return {
    location: geoRes.city,
    area: geoRes.area,
    country: geoRes.country,
    lat,
    lon,
    current: {
      temp: Math.round(w.current.temperature_2m),
      feelsLike: Math.round(w.current.apparent_temperature),
      humidity: w.current.relative_humidity_2m,
      windSpeed: Math.round(w.current.wind_speed_10m),
      windDir: w.current.wind_direction_10m,
      visibility: Math.round((w.current.visibility ?? 10000) / 1000),
      weatherCode: w.current.weather_code,
      isDay: w.current.is_day,
      uvIndex: w.current.uv_index ?? 0,
      precipitation: w.current.precipitation ?? 0,
      dewPoint: Math.round(w.current.dew_point_2m),
    },
    hourly: w.hourly.time.slice(startIdx, startIdx + 24).map((time: string, i: number) => ({
      time: time,
      temp: Math.round(w.hourly.temperature_2m[startIdx + i]),
      weatherCode: w.hourly.weather_code[startIdx + i],
      precip: w.hourly.precipitation[startIdx + i] ?? 0,
      isDay: w.hourly.is_day[startIdx + i] ?? 1,
    })),
    daily: w.daily.time.map((date: string, i: number) => ({
      date: date,
      tempMax: Math.round(w.daily.temperature_2m_max[i]),
      tempMin: Math.round(w.daily.temperature_2m_min[i]),
      weatherCode: w.daily.weather_code[i],
      precipSum: w.daily.precipitation_sum[i] ?? 0,
      windMax: Math.round(w.daily.wind_speed_10m_max[i]),
      uvIndexMax: w.daily.uv_index_max[i] ?? 0,
      sunrise: w.daily.sunrise[i],
      sunset: w.daily.sunset[i],
    })),
  };
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-white/15 backdrop-blur-sm p-3 border border-white/20">
      <div className="flex items-center gap-1.5 text-white/70 text-xs font-medium">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-white text-xl font-bold leading-none">{value}</span>
      {sub && <span className="text-white/60 text-[11px]">{sub}</span>}
    </div>
  );
}

function CropPrecautionCard({ tip }: { tip: CropPrecaution }) {
  const styles: Record<Severity, { border: string; bg: string; badge: string; badgeText: string }> = {
    info: { border: "border-l-emerald-400", bg: "bg-emerald-50", badge: "bg-emerald-100", badgeText: "text-emerald-700" },
    warning: { border: "border-l-amber-400", bg: "bg-amber-50", badge: "bg-amber-100", badgeText: "text-amber-700" },
    danger: { border: "border-l-red-500", bg: "bg-red-50", badge: "bg-red-100", badgeText: "text-red-700" },
  };
  const s = styles[tip.severity];
  return (
    <div className={`rounded-xl border-l-4 ${s.border} ${s.bg} p-3.5 flex gap-3`}>
      <span className="text-2xl flex-shrink-0 mt-0.5">{tip.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-semibold text-slate-800 text-sm">{tip.title}</span>
          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${s.badge} ${s.badgeText}`}>
            {tip.severity}
          </span>
        </div>
        <p className="text-slate-600 text-xs leading-relaxed">{tip.detail}</p>
      </div>
    </div>
  );
}

function windDirLabel(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

function formatHour(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  return h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;
}

function formatDay(iso: string, idx: number): string {
  if (idx === 0) return "Today";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Weather = () => {
  const { t } = useLanguage();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string | null>(() => {
    return localStorage.getItem("kisanmitra-crop") || null;
  });

  const handleCropSelect = (cropId: string) => {
    const next = selectedCrop === cropId ? null : cropId;
    setSelectedCrop(next);
    if (next) localStorage.setItem("kisanmitra-crop", next);
    else localStorage.removeItem("kisanmitra-crop");
  };

  const loadWeather = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWeather(lat, lon);
      setWeather(data);
      setLastUpdated(new Date());
    } catch (e) {
      setError("Failed to load weather data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const requestLocation = useCallback(() => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => loadWeather(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        // Fallback to a default location (New Delhi, India) on permission deny
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Location access denied. Showing default location (New Delhi)."
            : "Unable to get location. Showing default location."
        );
        loadWeather(28.6139, 77.209); // New Delhi fallback
      },
      { timeout: 10000 }
    );
  }, [loadWeather]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // ── Loading State ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 pb-20">
        <div className="flex flex-col items-center gap-4 text-white">
          <div className="relative h-20 w-20">
            <div className="absolute inset-0 rounded-full border-4 border-white/30 border-t-white animate-spin" />
            <Sun className="absolute inset-0 m-auto h-10 w-10 text-yellow-300 animate-pulse" />
          </div>
          <p className="text-lg font-semibold tracking-wide">Detecting your location…</p>
          <p className="text-white/70 text-sm">Fetching live weather data</p>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────────

  if (error && !weather) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 pb-20 px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="h-14 w-14 text-yellow-400" />
          <p className="text-white text-lg font-semibold">Something went wrong</p>
          <p className="text-white/60 text-sm max-w-xs">{error}</p>
          <button
            onClick={requestLocation}
            className="mt-2 px-6 py-2.5 bg-primary text-white rounded-full font-semibold text-sm hover:opacity-90 transition"
          >
            Try Again
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!weather) return null;

  const bgGrad = getBgGradient(weather.current.weatherCode, weather.current.isDay);
  const farmTip = getFarmingTip(weather);

  // ── Main UI ────────────────────────────────────────────────────────────────

  return (
    <div className={cn("min-h-screen bg-gradient-to-br pb-24 text-white", bgGrad)}>

      {/* ── Header ── */}
      <div className="px-4 pt-10 pb-2 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-white font-semibold text-base">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span>{weather.location}</span>
            {weather.country && <span className="text-white/55 font-normal text-sm">· {weather.country}</span>}
          </div>
          {weather.area && (
            <p className="text-white/70 text-sm mt-0.5 pl-6">
              {weather.area}
            </p>
          )}
          {lastUpdated && (
            <p className="text-white/40 text-[11px] mt-0.5 pl-6">
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        <button
          onClick={requestLocation}
          className="p-2 rounded-full bg-white/15 hover:bg-white/25 transition"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* ── Current Temperature ── */}
      <div className="px-4 py-6 flex flex-col items-center text-center">
        <WeatherIcon code={weather.current.weatherCode} isDay={weather.current.isDay} size="lg" />
        <div className="mt-4 flex items-start">
          <span className="text-8xl font-black tracking-tight leading-none">{weather.current.temp}</span>
          <span className="text-3xl font-light mt-4 text-white/80">°C</span>
        </div>
        <p className="text-xl font-medium text-white/90 mt-1">
          {getWeatherDesc(weather.current.weatherCode)}
        </p>
        <p className="text-white/60 text-sm mt-0.5">
          Feels like {weather.current.feelsLike}°C
        </p>
        {/* High / Low from today's daily */}
        <div className="flex gap-3 mt-2 text-sm text-white/70">
          <span className="flex items-center gap-0.5"><ArrowUp className="h-3.5 w-3.5 text-red-300" />{weather.daily[0].tempMax}°</span>
          <span className="flex items-center gap-0.5"><ArrowDown className="h-3.5 w-3.5 text-blue-300" />{weather.daily[0].tempMin}°</span>
        </div>
      </div>

      {/* ── Error banner (soft, when fallback) ── */}
      {error && (
        <div className="mx-4 mb-3 px-3 py-2 rounded-xl bg-yellow-500/20 border border-yellow-400/30 flex items-center gap-2 text-yellow-200 text-xs">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div className="mx-4 grid grid-cols-2 gap-2.5 mb-4">
        <StatCard
          icon={<Droplets className="h-3.5 w-3.5" />}
          label="Humidity"
          value={`${weather.current.humidity}%`}
          sub={`Dew point ${weather.current.dewPoint}°C`}
        />
        <StatCard
          icon={<Wind className="h-3.5 w-3.5" />}
          label="Wind"
          value={`${weather.current.windSpeed} km/h`}
          sub={windDirLabel(weather.current.windDir)}
        />
        <StatCard
          icon={<Eye className="h-3.5 w-3.5" />}
          label="Visibility"
          value={`${weather.current.visibility} km`}
        />
        <StatCard
          icon={<Thermometer className="h-3.5 w-3.5" />}
          label="UV Index"
          value={String(Math.round(weather.current.uvIndex))}
          sub={
            weather.current.uvIndex < 3 ? "Low" :
              weather.current.uvIndex < 6 ? "Moderate" :
                weather.current.uvIndex < 8 ? "High" : "Very High"
          }
        />
        <StatCard
          icon={<Sun className="h-3.5 w-3.5" />}
          label="Sunrise"
          value={new Date(weather.daily[0].sunrise).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        />
        <StatCard
          icon={<Navigation className="h-3.5 w-3.5" />}
          label="Sunset"
          value={new Date(weather.daily[0].sunset).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        />
      </div>

      {/* ── Hourly Forecast ── */}
      <div className="mx-4 mb-4">
        <h2 className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">
          Hourly Forecast
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {weather.hourly.map((h, i) => (
            <div
              key={i}
              className={cn(
                "flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl border text-center min-w-[60px]",
                i === 0
                  ? "bg-white/30 border-white/40"
                  : "bg-white/10 border-white/15"
              )}
            >
              <span className="text-white/60 text-[11px]">{i === 0 ? "Now" : formatHour(h.time)}</span>
              <WeatherIcon code={h.weatherCode} isDay={h.isDay} size="sm" />
              <span className="text-white text-sm font-bold">{h.temp}°</span>
              {h.precip > 0 && (
                <span className="text-blue-200 text-[10px]">{h.precip.toFixed(1)}mm</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 7-Day Forecast ── */}
      <div className="mx-4 mb-4">
        <h2 className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">
          7-Day Forecast
        </h2>
        <div className="rounded-2xl overflow-hidden border border-white/20 divide-y divide-white/10">
          {weather.daily.map((d, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-3 bg-white/10 hover:bg-white/15 transition"
            >
              <span className={cn("text-sm font-medium w-20", i === 0 ? "text-white" : "text-white/80")}>
                {formatDay(d.date, i)}
              </span>
              <div className="flex items-center gap-1.5">
                <WeatherIcon code={d.weatherCode} isDay={1} size="sm" />
                <span className="text-white/70 text-xs hidden sm:block">{getWeatherDesc(d.weatherCode)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                {d.precipSum > 0.1 && (
                  <span className="text-blue-200 text-xs flex items-center gap-0.5">
                    <Droplets className="h-3 w-3" />{d.precipSum.toFixed(1)}mm
                  </span>
                )}
                <span className="text-blue-300 font-medium">{d.tempMin}°</span>
                <span className="text-white font-bold">{d.tempMax}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Crop Selector ── */}
      <div className="mx-4 mb-4">
        <h2 className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">
          🌱 Select Your Crop
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CROPS.map((crop) => {
            const isActive = selectedCrop === crop.id;
            return (
              <button
                key={crop.id}
                onClick={() => handleCropSelect(crop.id)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border transition-all",
                  isActive
                    ? "bg-white text-slate-800 border-white shadow-md scale-105"
                    : "bg-white/15 text-white border-white/20 hover:bg-white/25"
                )}
              >
                <span>{crop.emoji}</span>
                <span>{crop.name}</span>
              </button>
            );
          })}
        </div>
        {selectedCrop && (
          <p className="text-white/50 text-[11px] mt-1.5 pl-1">
            Tap the same crop again to deselect
          </p>
        )}
      </div>

      {/* ── Crop-Specific Precautions ── */}
      {selectedCrop ? (
        <div className="mx-4 mb-4">
          <h2 className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">
            🛡️ {CROPS.find(c => c.id === selectedCrop)?.emoji} {CROPS.find(c => c.id === selectedCrop)?.name} Precautions
          </h2>
          <div className="flex flex-col gap-2.5">
            {getCropPrecautions(selectedCrop, weather).map((tip, i) => (
              <CropPrecautionCard key={i} tip={tip} />
            ))}
          </div>
        </div>
      ) : (
        /* ── Generic Farming Advisory (shown when no crop selected) ── */
        <div className="mx-4 mb-4">
          <h2 className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">
            🌾 Farming Advisory
          </h2>
          <div className={cn("rounded-2xl p-4 border flex gap-3 items-start bg-white/95", farmTip.color.split(" ").filter(c => c.startsWith("border")).join(" "))}>
            <span className="text-2xl mt-0.5">{farmTip.icon}</span>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Leaf className={cn("h-4 w-4", farmTip.color.split(" ").find(c => c.startsWith("text-")) ?? "text-green-600")} />
                <span className={cn("font-semibold text-sm", farmTip.color.split(" ").find(c => c.startsWith("text-")) ?? "text-green-600")}>
                  Farm Advisory
                </span>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed">{farmTip.tip}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Spray Advisory ── */}
      <div className="mx-4 mb-4">
        <h2 className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">
          🧪 Spray Advisory
        </h2>
        {(() => {
          const spray = getSprayAdvisory(weather);
          return (
            <div className={cn(
              "rounded-2xl p-4 border flex gap-3 items-start",
              spray.safe ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
            )}>
              {spray.safe
                ? <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                : <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />}
              <div className="flex-1">
                <p className={cn("font-semibold text-sm mb-1", spray.safe ? "text-emerald-700" : "text-red-700")}>
                  {spray.label}
                </p>
                <p className="text-slate-600 text-xs leading-relaxed">{spray.reason}</p>
                {spray.windows.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    <span className="text-slate-500 text-[11px] mr-0.5 self-center">Best times:</span>
                    {spray.windows.map((w, i) => (
                      <span key={i} className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{w}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Irrigation Need ── */}
      <div className="mx-4 mb-4">
        <h2 className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">
          💧 Irrigation Need
        </h2>
        {(() => {
          const irr = getIrrigationNeed(weather);
          const pct = (irr.score / 10) * 100;
          const barColor = irr.score <= 3 ? "bg-emerald-400" : irr.score <= 5 ? "bg-amber-400" : irr.score <= 7 ? "bg-orange-500" : "bg-red-500";
          return (
            <div className="rounded-2xl bg-white/95 border border-white/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-blue-500" />
                  <span className={cn("font-bold text-sm", irr.color)}>{irr.label}</span>
                </div>
                <span className="text-slate-400 text-xs">ET₀ ≈ {irr.etMm} mm/day</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">{irr.detail}</p>
            </div>
          );
        })()}
      </div>

      {/* ── Pest & Disease Risk ── */}
      <div className="mx-4 mb-4">
        <h2 className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">
          🐛 Pest & Disease Risk
        </h2>
        {(() => {
          const risk = getPestRisk(weather);
          const riskBar = (score: number) => {
            const color = score <= 2 ? "bg-emerald-400" : score <= 5 ? "bg-amber-400" : score <= 7 ? "bg-orange-500" : "bg-red-500";
            return <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-1 mb-1.5"><div className={cn("h-full rounded-full", color)} style={{ width: `${score * 10}%` }} /></div>;
          };
          return (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl bg-white/95 border border-white/20 p-3.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-lg">🍄</span>
                  <span className="text-slate-700 text-xs font-semibold">Fungal Risk</span>
                  <span className={cn("ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    risk.fungalScore <= 2 ? "bg-emerald-100 text-emerald-700" :
                      risk.fungalScore <= 5 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                    {risk.fungalLabel}
                  </span>
                </div>
                {riskBar(risk.fungalScore)}
                <p className="text-slate-500 text-[11px] leading-snug">{risk.fungalDetail}</p>
              </div>
              <div className="rounded-2xl bg-white/95 border border-white/20 p-3.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Bug className="h-4 w-4 text-orange-500" />
                  <span className="text-slate-700 text-xs font-semibold">Insect Risk</span>
                  <span className={cn("ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    risk.insectScore <= 2 ? "bg-emerald-100 text-emerald-700" :
                      risk.insectScore <= 5 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                    {risk.insectLabel}
                  </span>
                </div>
                {riskBar(risk.insectScore)}
                <p className="text-slate-500 text-[11px] leading-snug">{risk.insectDetail}</p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Best Working Hours ── */}
      <div className="mx-4 mb-4">
        <h2 className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">
          ⏰ Best Working Hours Today
        </h2>
        <div className="rounded-2xl overflow-hidden border border-white/20 divide-y divide-white/10">
          {getBestWorkHours(weather).map((w, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5 bg-white/10">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-white/50" />
                <span className="text-white font-medium text-sm w-14">{w.hour}</span>
                <span className="text-white/50 text-xs">{w.reason}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 5 }).map((_, si) => (
                  <div key={si} className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    si < Math.round(w.score / 2)
                      ? w.score >= 8 ? "bg-emerald-400" : w.score >= 5 ? "bg-amber-400" : "bg-red-400"
                      : "bg-white/20"
                  )} />
                ))}
                <span className={cn("text-xs font-bold w-6 text-right",
                  w.score >= 8 ? "text-emerald-400" : w.score >= 5 ? "text-amber-400" : "text-red-400")}>
                  {w.score}/10
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Upcoming Rain & Wind ── */}
      <div className="mx-4 mb-6">
        <h2 className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-2">
          Upcoming Rain & Wind
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {weather.daily.slice(0, 3).map((d, i) => (
            <div key={i} className="rounded-2xl bg-white/10 border border-white/15 p-3 text-center">
              <p className="text-white/60 text-[11px] mb-1">{formatDay(d.date, i)}</p>
              <p className="text-blue-200 font-bold text-lg">{d.precipSum.toFixed(1)}<span className="text-xs font-normal">mm</span></p>
              <p className="text-white/60 text-[11px] flex items-center justify-center gap-0.5 mt-0.5">
                <Wind className="h-3 w-3" />{d.windMax} km/h
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Attribution ── */}
      <p className="text-center text-white/30 text-[10px] pb-4">
        Weather data: Open-Meteo · Location: OpenStreetMap
      </p>

      <BottomNav />
    </div>
  );
};

export default Weather;
