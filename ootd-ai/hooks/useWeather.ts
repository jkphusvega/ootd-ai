'use client';
import { useState, useEffect } from 'react';

export interface WeatherData {
  temperature: number;
  condition: string;
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    // 캐시 확인 (15분)
    const cached = sessionStorage.getItem('ootd_weather');
    if (cached) {
      try {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < 10 * 60 * 1000) { setWeather(data); return; }
      } catch {}
    }

    const decodeWeatherCode = (code: number): string => {
      if (code === 0) return 'Clear';
      if (code <= 3) return 'Cloudy';                        // 1~3: 구름 조금~흐림
      if (code <= 48) return 'Cloudy';                       // 45,48: 안개
      if (code <= 57) return 'Rain';                         // 51~57: 이슬비
      if (code <= 67) return 'Rain';                         // 61~67: 비
      if (code <= 77) return 'Snow';                         // 71~77: 눈
      if (code <= 82) return 'Rain';                         // 80~82: 소나기
      if (code <= 86) return 'Snow';                         // 85~86: 눈 소나기
      return 'Rain';                                         // 95~99: 뇌우
    };

    const fetchWeather = async (lat = 37.5665, lon = 126.978) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
        );
        const data = await res.json();
        const result = {
          temperature: Math.round(data.current.temperature_2m * 10) / 10,
          condition: decodeWeatherCode(data.current.weather_code),
        };
        setWeather(result);
        sessionStorage.setItem('ootd_weather', JSON.stringify({ data: result, ts: Date.now() }));
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
