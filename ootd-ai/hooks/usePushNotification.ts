'use client';
import { useState, useEffect, useCallback } from 'react';

export type PushState = 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed' | 'loading';

export function usePushNotification(userId: string | undefined) {
  const [state, setState] = useState<PushState>('loading');

  const registerSW = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      return reg;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const checkState = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setState('unsupported');
        return;
      }
      const permission = Notification.permission;
      if (permission === 'denied') { setState('denied'); return; }

      const reg = await navigator.serviceWorker.register('/sw.js');
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? 'subscribed' : 'unsubscribed');
    };
    checkState();
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    setState('loading');
    try {
      const reg = await registerSW();
      if (!reg) { setState('unsupported'); return false; }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setState('denied'); return false; }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
      const keyBytes = urlBase64ToUint8Array(publicKey);

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes.buffer as ArrayBuffer,
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), userId }),
      });

      setState('subscribed');
      return true;
    } catch (err) {
      console.error('Subscribe error:', err);
      setState('unsubscribed');
      return false;
    }
  }, [userId, registerSW]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState('loading');
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (!reg) { setState('unsubscribed'); return true; }
      const sub = await reg.pushManager.getSubscription();
      if (!sub) { setState('unsubscribed'); return true; }

      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });

      await sub.unsubscribe();
      setState('unsubscribed');
      return true;
    } catch {
      setState('subscribed');
      return false;
    }
  }, []);

  return { state, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
