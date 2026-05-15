'use client';
import { motion } from 'framer-motion';
import { Droplets, Wind, Thermometer, MapPin, CloudRain, Sun, Cloud, CloudSnow } from 'lucide-react';
import type { WeatherData, HourlyForecast } from '../../hooks/useWeather';
import { getConditionEmoji } from '../../hooks/useWeather';

interface Props {
  weather: WeatherData;
}

function HourlyIcon({ condition }: { condition: string }) {
  if (condition === 'Rain') return <CloudRain className="w-4 h-4 text-blue-400" />;
  if (condition === 'Snow') return <CloudSnow className="w-4 h-4 text-sky-300" />;
  if (condition === 'Cloudy') return <Cloud className="w-4 h-4 text-zinc-400" />;
  return <Sun className="w-4 h-4 text-amber-400" />;
}

export default function WeatherDashboard({ weather }: Props) {
  const displayHours: HourlyForecast[] = weather.hourly.slice(0, 6);
  const tempRange = weather.tempMax - weather.tempMin || 1;
  const currentPercent = Math.min(100, Math.max(0,
    ((weather.temperature - weather.tempMin) / tempRange) * 100
  ));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 p-4 shadow-md mb-4"
    >
      {/* 위치 */}
      {(weather.cityName || weather.locationLabel) && (
        <div className="flex items-center gap-1 mb-3">
          <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
          <span className="text-[11px] font-bold text-zinc-400">
            {weather.cityName || weather.locationLabel}
          </span>
        </div>
      )}

      {/* 메인 기온 행 */}
      <div className="flex items-center justify-between mb-3">
        {/* 기온 + 체감 + 최저최고 */}
        <div className="flex items-center gap-3">
          <span className="text-4xl leading-none">{getConditionEmoji(weather.condition)}</span>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
                {Math.round(weather.temperature)}°
              </span>
              <span className="text-sm text-zinc-400 font-semibold">체감 {weather.feelsLike}°</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] font-bold text-zinc-400">최저 {weather.tempMin}°</span>
              <span className="text-[10px] text-zinc-300">·</span>
              <span className="text-[11px] font-bold text-zinc-500">최고 {weather.tempMax}°</span>
            </div>
          </div>
        </div>

        {/* 습도 + 바람 */}
        <div className="flex flex-col gap-1.5 items-end">
          <div className="flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-bold text-zinc-500">{weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs font-bold text-zinc-500">{weather.windSpeed}m/s</span>
          </div>
        </div>
      </div>

      {/* 시간별 예보 */}
      {displayHours.length > 0 && (
        <div className="flex gap-1 mb-3">
          {displayHours.map((h, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.04 }}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl ${
                idx === 0 ? 'bg-zinc-100/80 dark:bg-zinc-800/50' : ''
              }`}
            >
              <span className="text-[9px] font-bold text-zinc-400">
                {idx === 0 ? '지금' : h.hour < 12 ? `오전 ${h.hour}시` : h.hour === 12 ? '오후 12시' : `오후 ${h.hour - 12}시`}
              </span>
              <HourlyIcon condition={h.condition} />
              <span className="text-[11px] font-extrabold text-zinc-700 dark:text-zinc-200">
                {h.temperature}°
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* 온도 바 */}
      <div className="relative h-1 bg-gradient-to-r from-blue-300 via-emerald-200 to-red-300 rounded-full mb-3 overflow-visible">
        <motion.div
          initial={{ left: 0 }}
          animate={{ left: `${currentPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-2 border-zinc-800 rounded-full shadow"
        />
      </div>

      {/* 옷차림 팁 */}
      {weather.weatherTip && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-start gap-1.5 px-2 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50"
        >
          <Thermometer className="w-3 h-3 text-zinc-400 mt-0.5 shrink-0" />
          <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {weather.weatherTip}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
