import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { truckApi } from '../services/api';
import i18n from '../i18n';

const STORAGE_KEY = 'naklos_location_sharing';
const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

interface LocationSharingState {
  enabled: boolean;
  sending: boolean;
  lastCity: string | null;
  lastUpdatedAt: string | null;
  error: string | null;
  toggle: () => void;
  sendNow: () => void;
}

const LocationSharingContext = createContext<LocationSharingState | undefined>(undefined);

export const LocationSharingProvider = ({ children }: { children: ReactNode }) => {
  const [enabled, setEnabled] = useState(localStorage.getItem(STORAGE_KEY) === 'true');
  const [sending, setSending] = useState(false);
  const [lastCity, setLastCity] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError(i18n.t('location.notSupported'));
      return;
    }

    setSending(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=tr`
          );
          const data = await resp.json();
          const city =
            data?.address?.city ||
            data?.address?.town ||
            data?.address?.state_district ||
            data?.address?.state ||
            'Bilinmiyor';

          await truckApi.updateMyTruckLocation(latitude, longitude, city);
          setLastCity(city);
          setLastUpdatedAt(new Date().toISOString());
          setError(null);
        } catch (err) {
          console.error('Location update failed:', err);
          setError(i18n.t('location.sendFailed'));
        } finally {
          setSending(false);
        }
      },
      (err) => {
        setSending(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError(i18n.t('location.denied'));
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError(i18n.t('location.unavailable'));
        } else {
          setError(i18n.t('location.error'));
        }
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      setError(null);
      return next;
    });
  }, []);

  useEffect(() => {
    if (enabled) {
      sendLocation();
      intervalRef.current = setInterval(sendLocation, INTERVAL_MS);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, sendLocation]);

  return (
    <LocationSharingContext.Provider value={{
      enabled, sending, lastCity, lastUpdatedAt, error, toggle, sendNow: sendLocation,
    }}>
      {children}
    </LocationSharingContext.Provider>
  );
};

export const useLocationSharing = () => {
  const ctx = useContext(LocationSharingContext);
  if (!ctx) {
    throw new Error('useLocationSharing must be used within LocationSharingProvider');
  }
  return ctx;
};
