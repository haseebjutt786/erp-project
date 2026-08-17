import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getSettings } from '../../services/api.js';

// WeatherAPI.com — free tier, instant activation
// Get key at: https://www.weatherapi.com/signup.aspx
const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY || '';

const getWeatherMeta = (condCode, isDay) => {
  // WeatherAPI condition codes: https://www.weatherapi.com/docs/weather_conditions.json
  if ([1000].includes(condCode))
    return isDay
      ? { icon: 'ti-sun',          color: '#ff7b0d', bg: 'from-orange-400 to-yellow-500' }
      : { icon: 'ti-moon-stars',   color: '#466ae6', bg: 'from-indigo-600 to-blue-800'   };
  if ([1003,1006,1009].includes(condCode))
    return { icon: 'ti-cloud',         color: '#6b7280', bg: 'from-gray-400 to-slate-500'    };
  if ([1030,1135,1147].includes(condCode))
    return { icon: 'ti-mist',          color: '#9ca3af', bg: 'from-gray-300 to-gray-500'     };
  if ([1063,1150,1153,1180,1183,1186,1189,1192,1195,1240,1243,1246].includes(condCode))
    return { icon: 'ti-cloud-rain',    color: '#0096c7', bg: 'from-blue-400 to-cyan-600'     };
  if ([1066,1114,1117,1210,1213,1216,1219,1222,1225,1255,1258].includes(condCode))
    return { icon: 'ti-snowflake',     color: '#94d2bd', bg: 'from-cyan-300 to-blue-400'     };
  if ([1087,1273,1276,1279,1282].includes(condCode))
    return { icon: 'ti-bolt',          color: '#7b4fa0', bg: 'from-purple-500 to-violet-700' };
  if ([1168,1171,1198,1201,1204,1207,1249,1252].includes(condCode))
    return { icon: 'ti-cloud-storm',   color: '#0096c7', bg: 'from-blue-500 to-indigo-600'   };
  return   { icon: 'ti-cloud',         color: '#6b7280', bg: 'from-gray-400 to-gray-600'     };
};

export default function WeatherCard() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchByQuery = useCallback(async (query) => {
    if (!WEATHER_API_KEY) {
      setError('Add VITE_WEATHER_API_KEY in frontend/.env');
      setLoading(false);
      return;
    }
    try {
      const url = `https://api.weatherapi.com/v1/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(query)}&aqi=no`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Error ${res.status}`);
      }
      const data = await res.json();
      setWeather(data);
      setError(null);
    } catch (e) {
      setError(e.message || 'Weather unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  const init = useCallback(() => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchByQuery(`${pos.coords.latitude},${pos.coords.longitude}`),
        async () => {
          try {
            const { data } = await getSettings();
            const city = (data.companyAddress || 'Karachi').split(',').pop().trim();
            fetchByQuery(city);
          } catch {
            fetchByQuery('Karachi');
          }
        },
        { timeout: 6000 }
      );
    } else {
      fetchByQuery('Karachi');
    }
  }, [fetchByQuery]);

  useEffect(() => {
    init();
    const t = setInterval(init, 30 * 60 * 1000);
    return () => clearInterval(t);
  }, [init]);

  if (loading) {
    return (
      <div className="rounded-xl bg-gray-200 dark:bg-dark-surface animate-skeleton overflow-hidden shadow-card" style={{ minHeight: 148 }}>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/30" />
            <div className="h-3 bg-white/30 rounded w-20" />
          </div>
          <div className="h-10 bg-white/20 rounded w-24" />
          <div className="h-3 bg-white/20 rounded w-32" />
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-dark-border shadow-card p-5 flex flex-col items-center justify-center gap-2 text-center" style={{ minHeight: 148 }}>
        <i className="ti ti-cloud-off text-gray-300 text-3xl" />
        <p className="text-xs text-gray-400 leading-relaxed max-w-[160px]">{error}</p>
        <button onClick={init} className="text-xs text-brand-400 font-600 hover:text-brand-500 transition-colors">
          <i className="ti ti-refresh mr-1" />Retry
        </button>
      </div>
    );
  }

  const cur      = weather.current;
  const loc      = weather.location;
  const condCode = cur.condition.code;
  const isDay    = cur.is_day === 1;
  const meta     = getWeatherMeta(condCode, isDay);
  const windKph  = Math.round(cur.wind_kph);

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      className={`rounded-xl overflow-hidden shadow-card bg-gradient-to-br ${meta.bg}`}>
      <div className="p-5">
        {/* Location + condition */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <i className="ti ti-map-pin text-white/70 text-xs" />
              <span className="text-white/80 text-xs font-600 truncate max-w-[100px]">{loc.name}</span>
            </div>
            <p className="text-white/70 text-xs capitalize">{cur.condition.text}</p>
          </div>
          <i className={`ti ${meta.icon} text-white text-4xl flex-shrink-0`} />
        </div>

        {/* Temperature */}
        <div className="flex items-end gap-1.5 mb-3">
          <span className="text-white text-5xl font-800 leading-none tabular-nums">
            {Math.round(cur.temp_c)}°
          </span>
          <div className="pb-1">
            <p className="text-white/60 text-xs">Feels {Math.round(cur.feelslike_c)}°</p>
            <p className="text-white/50 text-xs">C</p>
          </div>
        </div>

        {/* Humidity + Wind */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <i className="ti ti-droplet text-white/70 text-sm" />
            <div>
              <p className="text-white/50 text-[10px]">Humidity</p>
              <p className="text-white text-xs font-700">{cur.humidity}%</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <i className="ti ti-wind text-white/70 text-sm" />
            <div>
              <p className="text-white/50 text-[10px]">Wind</p>
              <p className="text-white text-xs font-700">{windKph} km/h</p>
            </div>
          </div>
          <button onClick={init} className="ml-auto text-white/40 hover:text-white transition-colors" title="Refresh">
            <i className="ti ti-refresh text-sm" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
