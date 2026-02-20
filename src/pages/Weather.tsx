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

      {/* ── Farming Advisory ── */}
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

      {/* ── Precipitation & Wind for coming days ── */}
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
