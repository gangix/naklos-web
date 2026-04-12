import { useState, useEffect } from 'react';
import { truckApi, driverApi } from '../services/api';
import type { Truck, Driver } from '../types';

const WARN_THRESHOLD_DAYS = 30;

const daysUntil = (dateStr: string | null | undefined): number | null => {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const isExpiringSoon = (dateStr: string | null | undefined): boolean => {
  const days = daysUntil(dateStr);
  return days !== null && days <= WARN_THRESHOLD_DAYS;
};

const isMissing = (dateStr: string | null | undefined): boolean => !dateStr;

/**
 * Lightweight hook that checks whether any truck or driver has documents
 * expiring within 30 days (or missing dates). Returns the total warning count.
 */
export function useDocumentWarnings(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const [trucksPage, driversPage] = await Promise.all([
          truckApi.getByFleet(0, 1000),
          driverApi.getByFleet(0, 1000),
        ]);

        if (cancelled) return;

        const trucks = trucksPage.content as Truck[];
        const drivers = driversPage.content as Driver[];
        let warnings = 0;

        for (const truck of trucks) {
          const dates = [
            truck.compulsoryInsuranceExpiry,
            truck.comprehensiveInsuranceExpiry,
            truck.inspectionExpiry,
          ];
          for (const d of dates) {
            if (isMissing(d) || isExpiringSoon(d)) warnings++;
          }
        }

        for (const driver of drivers) {
          if (isMissing(driver.licenseExpiryDate) || isExpiringSoon(driver.licenseExpiryDate)) {
            warnings++;
          }
          const srcCert = driver.certificates?.find((c) => c.type === 'SRC');
          const cpcCert = driver.certificates?.find((c) => c.type === 'CPC');
          if (isMissing(srcCert?.expiryDate) || isExpiringSoon(srcCert?.expiryDate)) warnings++;
          if (isMissing(cpcCert?.expiryDate) || isExpiringSoon(cpcCert?.expiryDate)) warnings++;
        }

        setCount(warnings);
      } catch {
        // Silently ignore — sidebar badge is best-effort
      }
    };

    check();
    return () => { cancelled = true; };
  }, []);

  return count;
}
