'use client';
import { useState, useEffect } from 'react';

export function useRotatingMessage(messages: readonly string[], intervalMs = 2500): [string, number] {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    setIdx(0);
    const id = setInterval(() => setIdx(i => (i + 1) % messages.length), intervalMs);
    return () => clearInterval(id);
  // messages is a module-level constant reference; changes only on intent (e.g. phase switch)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, intervalMs]);
  return [messages[idx] ?? '', idx];
}
