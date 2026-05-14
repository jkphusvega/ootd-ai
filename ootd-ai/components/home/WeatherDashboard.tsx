'use client';
import { motion } from 'framer-motion';
import { Droplets, Wind, Thermometer, CloudRain, Sun, Cloud, CloudSnow, Umbrella, MapPin } from 'lucide-react';
import type { WeatherData, HourlyForecast } from '../../hooks/useWeather';
import { getConditionEmoji } from '../../hooks/useWeather';

interface Props {
  weather: WeatherData;
}

function HourlyConditionIcon({ condition, className }: { condition: string; className?: string }) {
  const cls = className || 'w-3.5 h-3.5';
  if (condition === 'Rain') return <CloudRain className={`${cls} text-blue-400`} />;
  if (condition === 'Snow') return <CloudSnow className={`${cls} text-sky-300`} />;
  if (condition === 'Cloudy') return <Cloud className={`${cls} text-zinc-400`} />;
  return <Sun className={`${cls} text-amber-400`} />;
}

export default function WeatherDashboard({ weather }: Props) {
  const now = new Date().getHours();

  // 시간대별 예보 (6개만 표시)
  const displayHours = weather.hourly.slice(0, 6);

  // 최저/최고 기온에서 현재 위치 퍼센트
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
      {/* 메인 기온 + 상태 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getConditionEmoji(weather.condition)}</span>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                {Math.round(weather.temperature)}°
              </span>
              <span className="text-xs text-zinc-400 font-bold">
                체감 {weather.feelsLike}°
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold text-blue-500">↓{weather.tempMin}°</span>
              <span className="text-[10px] font-bold text-red-400">↑{weather.tempMax}°</span>
            </div>
            {weather.locationLabel && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-2.5 h-2.5 text-zinc-400" />
                <span className="text-[9px] text-zinc-400">{weather.locationLabel}</span>
              </div>
            )}
          </div>
        </div>

        {/* 강수확률 + 습도 */}
        <div className="flex gap-3">
          {weather.precipitationProbability > 0 && (
            <div className="flex items-center gap-1">
              <Umbrella className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-bold text-blue-500">{weather.precipitationProbability}%</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Droplets className="w-3 h-3 text-sky-400" />
            <span className="text-[10px] font-bold text-zinc-400">{weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Wind className="w-3 h-3 text-zinc-400" />
            <span className="text-[10px] font-bold text-zinc-400">{weather.windSpeed}m/s</span>
          </div>
        </div>
      </div>

      {/* 기온 바 */}
      <div className="relative h-1.5 bg-gradient-to-r from-blue-200 via-emerald-200 to-red-200 rounded-full mb-3 overflow-visible">
        <motion.div
          initial={{ left: 0 }}
          animate={{ left: `${currentPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-zinc-900 rounded-full shadow-md"
        />
      </div>

      {/* 시간대별 예보 */}
      {displayHours.length > 0 && (
        <div className="grid grid-cols-6 gap-1">
          {displayHours.map((h, idx) => (
            <motion.div
              key={h.hour}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.04 }}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl ${
                idx === 0 ? 'bg-zinc-100/80 dark:bg-zinc-800/50' : ''
              }`}
            >
              <span className="text-[9px] font-bold text-zinc-400">
                {idx === 0 ? '지금' : `${h.hour}시`}
              </span>
              <HourlyConditionIcon condition={h.condition} />
              <span className="text-[11px] font-extrabold text-zinc-700 dark:text-zinc-200">
                {h.temperature}°
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* 코디 팁 */}
      {weather.weatherTip && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700/50"
        >
          <div className="flex items-start gap-2">
            <Thermometer className="w-3 h-3 text-zinc-400 mt-0.5 shrink-0" />
            <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {weather.weatherTip}
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
