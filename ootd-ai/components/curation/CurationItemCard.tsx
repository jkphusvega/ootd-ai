'use client';
import { motion } from 'framer-motion';
import { ExternalLink, Sun, Cloud, CloudRain, CloudSnow } from 'lucide-react';

interface CurationItem {
  category: string;
  name: string;
  image_url: string;
  reason: string;
}

interface WeatherInfo { temperature: number; condition: string; }

interface Props {
  item: CurationItem;
  index: number;
  showWeather?: boolean;
  weather?: WeatherInfo | null;
}

function WeatherBadge({ weather }: { weather: WeatherInfo }) {
  const Icon = weather.condition === 'Rain' ? CloudRain
    : weather.condition === 'Snow' ? CloudSnow
    : weather.condition === 'Cloudy' ? Cloud : Sun;
  return (
    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-full">
      <Icon className="w-3 h-3" />
      <span className="text-[9px] font-bold text-zinc-700 dark:text-zinc-200">{Math.round(weather.temperature)}°</span>
    </div>
  );
}

const getSearchUrls = (name: string) => {
  const q = encodeURIComponent(name);
  return {
    musinsa: `https://www.musinsa.com/search/musinsa/goods?q=${q}`,
    cm29: `https://www.29cm.co.kr/search?query=${q}`,
  };
};

export default function CurationItemCard({ item, index, showWeather, weather }: Props) {
  const urls = getSearchUrls(item.name);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800/60 shadow-sm overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-zinc-50 dark:bg-zinc-800">
        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" draggable={false} />
        <div className="absolute top-2.5 left-2.5">
          <span className="text-[8px] font-extrabold tracking-widest text-white/90 uppercase px-2 py-1 bg-black/40 backdrop-blur-md rounded-full">{item.category}</span>
        </div>
        {showWeather && weather && <WeatherBadge weather={weather} />}
      </div>
      <div className="p-3.5">
        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mb-1 line-clamp-1">{item.name}</p>
        <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2 mb-3">{item.reason}</p>
        <div className="flex gap-1.5">
          <a href={urls.musinsa} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-900 dark:bg-white rounded-lg hover:opacity-80 transition">
            <ExternalLink className="w-2.5 h-2.5 text-white dark:text-zinc-900" />
            <span className="text-[9px] font-bold text-white dark:text-zinc-900">무신사</span>
          </a>
          <a href={urls.cm29} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
            <ExternalLink className="w-2.5 h-2.5 text-zinc-600 dark:text-zinc-400" />
            <span className="text-[9px] font-bold text-zinc-700 dark:text-zinc-300">29CM</span>
          </a>
        </div>
      </div>
    </motion.div>
  );
}
