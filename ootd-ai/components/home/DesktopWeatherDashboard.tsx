'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Wind, Thermometer, MapPin, CloudRain, Sun, Cloud, CloudSnow, CloudSun, ChevronDown } from 'lucide-react';
import type { WeatherData, HourlyForecast } from '../../hooks/useWeather';

interface Props {
  weather: WeatherData;
}

function WeatherIcon({ condition, className = "w-4 h-4" }: { condition: string; className?: string }) {
  if (condition === 'Rain') return <CloudRain className={`${className} text-indigo-400 dark:text-indigo-300`} strokeWidth={1.5} />;
  if (condition === 'Snow') return <CloudSnow className={`${className} text-sky-400 dark:text-sky-300`} strokeWidth={1.5} />;
  if (condition === 'Cloudy') return <Cloud className={`${className} text-zinc-400 dark:text-zinc-500`} strokeWidth={1.5} />;
  if (condition === 'Clear') return <Sun className={`${className} text-amber-500`} strokeWidth={1.5} />;
  return <CloudSun className={`${className} text-zinc-400 dark:text-zinc-500`} strokeWidth={1.5} />;
}

export default function DesktopWeatherDashboard({ weather }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const displayHours: HourlyForecast[] = weather.hourly.slice(0, 5);
  const tempRange = weather.tempMax - weather.tempMin || 1;
  const currentPercent = Math.min(100, Math.max(0,
    ((weather.temperature - weather.tempMin) / tempRange) * 100
  ));

  return (
    <div 
      className="relative z-40"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* 상단바 트리거 버튼 */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all">
        <WeatherIcon condition={weather.condition} className="w-5 h-5" />
        <div className="flex flex-col items-start leading-none gap-0.5">
          <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            {weather.cityName || 'Weather'}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-sm font-black text-zinc-950 dark:text-white">
              {Math.round(weather.temperature)}°
            </span>
            <span className="text-[10px] font-bold text-zinc-400">
              최고 {weather.tempMax}°
            </span>
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
      </div>

      {/* 날씨 디테일 드롭다운 팝오버 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="absolute right-0 top-[110%] w-[320px] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
          >
            {/* 위치 및 상태 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.8} />
                <span className="text-[10px] font-extrabold tracking-wider text-zinc-400 uppercase">
                  {weather.cityName || weather.locationLabel}
                </span>
              </div>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">체감 {weather.feelsLike}°</span>
            </div>

            {/* 기온 정보 */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/50 flex items-center justify-center shadow-sm">
                  <WeatherIcon condition={weather.condition} className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
                    {Math.round(weather.temperature)}°
                  </span>
                  <div className="text-[11px] font-bold text-zinc-400 mt-0.5">
                    최저 {weather.tempMin}° · 최고 {weather.tempMax}°
                  </div>
                </div>
              </div>

              {/* 상세 스펙 */}
              <div className="flex flex-col gap-1 items-end">
                <div className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-indigo-400" strokeWidth={1.8} />
                  <span className="text-xs font-extrabold text-zinc-500 dark:text-zinc-400">{weather.humidity}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.8} />
                  <span className="text-xs font-extrabold text-zinc-500 dark:text-zinc-400">{weather.windSpeed}m/s</span>
                </div>
              </div>
            </div>

            {/* 시간별 예보 */}
            {displayHours.length > 0 && (
              <div className="flex gap-1.5 mb-4">
                {/* 지금 */}
                <div className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 shadow-[0_4px_12px_rgba(0,0,0,0.005)]">
                  <span className="text-[9px] font-extrabold text-zinc-400 uppercase">지금</span>
                  <WeatherIcon condition={weather.condition} className="w-4 h-4 my-0.5" />
                  <span className="text-[11px] font-black text-zinc-800 dark:text-zinc-200">{Math.round(weather.temperature)}°</span>
                </div>

                {/* 이후 */}
                {displayHours.map((h, idx) => {
                  const label = h.hour < 12
                    ? `오전 ${h.hour === 0 ? 12 : h.hour}`
                    : h.hour === 12 ? '오후 12'
                    : `오후 ${h.hour - 12}`;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl">
                      <span className="text-[9px] font-bold text-zinc-400">{label}</span>
                      <WeatherIcon condition={h.condition} className="w-4 h-4 my-0.5" />
                      <span className="text-[11px] font-bold text-zinc-500">{h.temperature}°</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 온도 바 */}
            <div className="relative h-[3px] bg-zinc-200/60 dark:bg-zinc-800/50 rounded-full mb-4">
              <motion.div
                initial={{ left: 0 }}
                animate={{ left: `${currentPercent}%` }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 dark:bg-white rounded-full shadow-sm"
              />
            </div>

            {/* 옷차림 팁 */}
            {weather.weatherTip && (
              <div className="flex items-start gap-2 p-3 bg-zinc-50/80 dark:bg-zinc-900/60 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                <Thermometer className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" strokeWidth={1.8} />
                <div className="flex-1">
                  <span className="text-[9px] font-extrabold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase block mb-0.5">Stylist Note</span>
                  <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300 leading-normal break-keep">{weather.weatherTip}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
