'use client';
import { useState, useEffect, useRef } from 'react';

export interface HourlyForecast {
  hour: number;
  temperature: number;
  weatherCode: number;
  condition: string;
  precipitation: number;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  tempMin: number;
  tempMax: number;
  precipitationProbability: number;
  hourly: HourlyForecast[];
  weatherTip: string;
  locationLabel: string;
  cityName: string;
}

// OWM weather condition id → simple label
const decodeOWM = (id: number): string => {
  if (id >= 200 && id < 300) return 'Rain';
  if (id >= 300 && id < 400) return 'Rain';
  if (id >= 500 && id < 600) return 'Rain';
  if (id >= 600 && id < 700) return 'Snow';
  if (id >= 700 && id < 800) return 'Cloudy';
  if (id === 800) return 'Clear';
  return 'Cloudy';
};

const getConditionEmoji = (condition: string): string => {
  if (condition === 'Clear') return '☀️';
  if (condition === 'Cloudy') return '☁️';
  if (condition === 'Rain') return '🌧️';
  if (condition === 'Snow') return '❄️';
  return '🌤';
};

const generateWeatherTip = (data: {
  tempMin: number; tempMax: number; condition: string;
  precipProb: number; hourly: HourlyForecast[];
}): string => {
  const { tempMin, tempMax, condition, precipProb, hourly } = data;
  const gap = tempMax - tempMin;
  const parts: string[] = [];

  if (gap >= 10) parts.push(`일교차가 ${Math.round(gap)}°C로 크니 레이어드 필수`);

  if (precipProb >= 60) parts.push('비 올 확률 높음 — 방수 아우터 추천');
  else if (precipProb >= 30) parts.push('비 가능성 있음 — 우산 챙기세요');

  const now = new Date().getHours();
  const futureHours = hourly.filter(h => h.hour > now && h.hour <= now + 6);
  const willRain = futureHours.some(h => h.condition === 'Rain' || h.condition === 'Snow');
  const willClear = condition !== 'Clear' && futureHours.some(h => h.condition === 'Clear');

  if (willRain && condition === 'Clear') parts.push('나중에 비 예보 — 겉옷 준비');
  if (willClear) parts.push('곧 날씨 개선 예정');

  if (tempMax >= 28) parts.push('더운 날 — 반팔, 린넨 소재 추천');
  else if (tempMax >= 20) parts.push('쾌적한 날씨 — 가벼운 레이어드');
  else if (tempMax >= 10) parts.push('쌀쌀함 — 자켓이나 가디건 추천');
  else parts.push('추운 날 — 따뜻한 아우터 필수');

  return parts.join(' · ');
};

const CACHE_KEY = 'ootd_weather_v6';
const CACHE_TTL = 5 * 60 * 1000;
const OWM_KEY = process.env.NEXT_PUBLIC_OWM_KEY || '';

const getPosition = (): Promise<{ lat: number; lon: number }> =>
  new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ lat: 37.5665, lon: 126.978 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve({ lat: 37.5665, lon: 126.978 }),
      { timeout: 15000, maximumAge: 0 }
    );
  });

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const isFetchingRef = useRef(false);

  const updateWeather = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const { lat, lon } = await getPosition();
      const isSeoul = lat === 37.5665 && lon === 126.978;

      // Current weather
      const [currentRes, forecastRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric&cnt=16`),
      ]);

      const current = await currentRes.json();
      const forecast = await forecastRes.json();

      const condition = decodeOWM(current.weather?.[0]?.id ?? 800);

      // Build hourly from 3-hour forecast slots — only future slots
      const nowTs = Date.now() / 1000;
      const futureSlots = (forecast.list || []).filter((slot: any) => slot.dt > nowTs);
      const hourly: HourlyForecast[] = futureSlots.slice(0, 6).map((slot: any) => ({
        hour: new Date(slot.dt * 1000).getHours(),
        temperature: Math.round(slot.main.temp),
        weatherCode: slot.weather?.[0]?.id ?? 800,
        condition: decodeOWM(slot.weather?.[0]?.id ?? 800),
        precipitation: slot.rain?.['3h'] ?? slot.snow?.['3h'] ?? 0,
      }));

      // tempMin/Max from today's forecast slots
      const todaySlots = futureSlots.filter((slot: any) => {
        const d = new Date(slot.dt * 1000);
        const today = new Date();
        return d.getDate() === today.getDate();
      });
      const temps = todaySlots.map((s: any) => s.main.temp);
      const tempMin = Math.round(temps.length ? Math.min(...temps) : current.main.temp_min);
      const tempMax = Math.round(temps.length ? Math.max(...temps) : current.main.temp_max);

      // Max pop (precipitation probability) from today's slots
      const precipProb = Math.round(
        Math.max(0, ...todaySlots.map((s: any) => (s.pop ?? 0) * 100))
      );

      const result: WeatherData = {
        temperature: Math.round(current.main.temp * 10) / 10,
        condition,
        feelsLike: Math.round(current.main.feels_like),
        humidity: current.main.humidity,
        windSpeed: Math.round(current.wind?.speed * 10) / 10,
        tempMin, tempMax,
        precipitationProbability: precipProb,
        hourly,
        weatherTip: generateWeatherTip({ tempMin, tempMax, condition, precipProb, hourly }),
        locationLabel: isSeoul
          ? '서울 (위치 기본값)'
          : `${lat.toFixed(3)}, ${lon.toFixed(3)}`,
        cityName: current.name || '',
      };

      setWeather(result);
      if (!isSeoul) {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, ts: Date.now() }));
      }
    } catch {
      // silently fail
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        setWeather(data);
        if (Date.now() - ts < CACHE_TTL) return;
      }
    } catch { /* ignore */ }

    updateWeather();

    const onVisible = () => { if (document.visibilityState === 'visible') updateWeather(); };
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(updateWeather, 30 * 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return weather;
}

export { getConditionEmoji };
