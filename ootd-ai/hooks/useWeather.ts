'use client';
import { useState, useEffect } from 'react';

export interface HourlyForecast {
  hour: number;          // 0-23
  temperature: number;
  weatherCode: number;
  condition: string;
  precipitation: number; // mm
}

export interface WeatherData {
  temperature: number;
  condition: string;
  // Phase 2: 확장 데이터
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  tempMin: number;
  tempMax: number;
  precipitationProbability: number; // 오늘 최대 강수확률 (%)
  hourly: HourlyForecast[];        // 향후 12시간 예보
  weatherTip: string;              // AI 코디 참고용 날씨 요약
}

const decodeWeatherCode = (code: number): string => {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Cloudy';
  if (code <= 48) return 'Cloudy';
  if (code <= 57) return 'Rain';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain';
  if (code <= 86) return 'Snow';
  return 'Rain';
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

  // 기온 범위 코멘트
  if (gap >= 10) {
    parts.push(`일교차가 ${Math.round(gap)}°C로 크니 레이어드 필수`);
  }

  // 강수 확률
  if (precipProb >= 60) {
    parts.push('비 올 확률 높음 — 방수 아우터 추천');
  } else if (precipProb >= 30) {
    parts.push('비 가능성 있음 — 우산 챙기세요');
  }

  // 오후 날씨 변화 감지
  const now = new Date().getHours();
  const futureHours = hourly.filter(h => h.hour > now && h.hour <= now + 6);
  const willRain = futureHours.some(h => h.condition === 'Rain' || h.condition === 'Snow');
  const willClear = condition !== 'Clear' && futureHours.some(h => h.condition === 'Clear');

  if (willRain && condition === 'Clear') {
    parts.push('나중에 비 예보 — 겉옷 준비');
  }
  if (willClear) {
    parts.push('곧 날씨 개선 예정');
  }

  // 기온별 코디 팁
  if (tempMax >= 28) parts.push('더운 날 — 반팔, 린넨 소재 추천');
  else if (tempMax >= 20) parts.push('쾌적한 날씨 — 가벼운 레이어드');
  else if (tempMax >= 10) parts.push('쌀쌀함 — 자켓이나 가디건 추천');
  else parts.push('추운 날 — 따뜻한 아우터 필수');

  return parts.join(' · ');
};

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    // 캐시 확인 (10분)
    const cached = sessionStorage.getItem('ootd_weather_v2');
    if (cached) {
      try {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < 10 * 60 * 1000) { setWeather(data); return; }
      } catch { /* ignore */ }
    }

    const fetchWeather = async (lat = 37.5665, lon = 126.978) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&current=temperature_2m,weather_code,apparent_temperature,relative_humidity_2m,wind_speed_10m` +
          `&hourly=temperature_2m,weather_code,precipitation_probability,precipitation` +
          `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
          `&timezone=Asia/Seoul&forecast_days=1`
        );
        const data = await res.json();

        const now = new Date();
        const currentHour = now.getHours();

        // 시간별 예보: 현재 시간부터 12시간
        const hourly: HourlyForecast[] = [];
        const hourlyTimes: string[] = data.hourly?.time || [];
        for (let i = 0; i < hourlyTimes.length && hourly.length < 12; i++) {
          const h = new Date(hourlyTimes[i]).getHours();
          const hourIndex = new Date(hourlyTimes[i]).getHours();
          if (i >= currentHour) {
            hourly.push({
              hour: hourIndex,
              temperature: Math.round(data.hourly.temperature_2m[i]),
              weatherCode: data.hourly.weather_code[i],
              condition: decodeWeatherCode(data.hourly.weather_code[i]),
              precipitation: data.hourly.precipitation?.[i] || 0,
            });
          }
        }

        const tempMin = Math.round(data.daily?.temperature_2m_min?.[0] ?? data.current.temperature_2m - 3);
        const tempMax = Math.round(data.daily?.temperature_2m_max?.[0] ?? data.current.temperature_2m + 3);
        const precipProb = data.daily?.precipitation_probability_max?.[0] ?? 0;

        const result: WeatherData = {
          temperature: Math.round(data.current.temperature_2m * 10) / 10,
          condition: decodeWeatherCode(data.current.weather_code),
          feelsLike: Math.round(data.current.apparent_temperature ?? data.current.temperature_2m),
          humidity: data.current.relative_humidity_2m ?? 0,
          windSpeed: Math.round((data.current.wind_speed_10m ?? 0) * 10) / 10,
          tempMin,
          tempMax,
          precipitationProbability: precipProb,
          hourly,
          weatherTip: generateWeatherTip({ tempMin, tempMax, condition: decodeWeatherCode(data.current.weather_code), precipProb, hourly }),
        };

        setWeather(result);
        sessionStorage.setItem('ootd_weather_v2', JSON.stringify({ data: result, ts: Date.now() }));
      } catch {
        // silently fall back — components handle null weather gracefully
      }
    };

    // 서울 기본값 즉시 가져오고, 위치 정보 오면 덮어씀
    fetchWeather();

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => { /* 위치 거부 시 서울 기본값 유지 */ },
        { timeout: 8000, maximumAge: 5 * 60 * 1000 }
      );
    }
  }, []);

  return weather;
}

export { getConditionEmoji };
