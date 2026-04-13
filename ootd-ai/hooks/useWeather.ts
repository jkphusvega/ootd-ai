'use client';
import { useState, useEffect } from 'react';

export interface WeatherData {
  temperature: number;
  condition: string;
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const fetchWeather = async (lat = 37.5665, lon = 126.978) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
        );
        const data = await res.json();
        const code: number = data.current.weather_code;
        let condition = 'Clear';
        if (code >= 60 && code <= 67) condition = 'Rain';
        else if (code >= 1 && code <= 3) condition = 'Cloudy';
        else if (code >= 70) condition = 'Snow';
        setWeather({ temperature: data.current.temperature_2m, condition });
      } catch {
        // silently fall back — components handle null weather gracefully
      }
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather()
      );
    } else {
      fetchWeather();
    }
  }, []);

  return weather;
}
