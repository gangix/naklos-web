import type { Truck, Driver, Warning } from '../types';

/**
 * Calculate warnings for expiring documents across trucks and drivers
 * @param trucks - Array of trucks to check
 * @param drivers - Array of drivers to check
 * @returns Array of warnings sorted by severity (errors first, then warnings)
 */
export function calculateWarnings(trucks: Truck[], drivers: Driver[]): Warning[] {
  const warnings: Warning[] = [];
  const today = new Date();
  const warningThreshold = 30; // days

  // Calculate days remaining until a date
  const getDaysRemaining = (dateString: string | null): number => {
    if (!dateString) return Infinity;
    const expiryDate = new Date(dateString);
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Determine severity based on days remaining
  const getSeverity = (days: number): 'error' | 'warning' => {
    return days < 7 ? 'error' : 'warning';
  };

  // Check truck insurance expiry
  trucks.forEach((truck) => {
    // Compulsory insurance
    const compulsoryDays = getDaysRemaining(truck.compulsoryInsuranceExpiry);
    if (compulsoryDays <= warningThreshold && compulsoryDays >= 0) {
      warnings.push({
        id: `truck-compulsory-${truck.id}`,
        type: 'insurance-expiring',
        message: `${truck.plateNumber} - Zorunlu trafik sigortası ${compulsoryDays} gün içinde sona eriyor`,
        severity: getSeverity(compulsoryDays),
        relatedId: truck.id,
        relatedType: 'truck',
      });
    }

    // Comprehensive insurance
    const comprehensiveDays = getDaysRemaining(truck.comprehensiveInsuranceExpiry);
    if (comprehensiveDays <= warningThreshold && comprehensiveDays >= 0) {
      warnings.push({
        id: `truck-comprehensive-${truck.id}`,
        type: 'insurance-expiring',
        message: `${truck.plateNumber} - Kasko sigortası ${comprehensiveDays} gün içinde sona eriyor`,
        severity: getSeverity(comprehensiveDays),
        relatedId: truck.id,
        relatedType: 'truck',
      });
    }

    // Inspection
    const inspectionDays = getDaysRemaining(truck.inspectionExpiry);
    if (inspectionDays <= warningThreshold && inspectionDays >= 0) {
      warnings.push({
        id: `truck-inspection-${truck.id}`,
        type: 'inspection-expiring',
        message: `${truck.plateNumber} - Muayene ${inspectionDays} gün içinde sona eriyor`,
        severity: getSeverity(inspectionDays),
        relatedId: truck.id,
        relatedType: 'truck',
      });
    }
  });

  // Check driver license and certificate expiry
  drivers.forEach((driver) => {
    const driverName = `${driver.firstName} ${driver.lastName}`;

    // License expiry
    const licenseDays = getDaysRemaining(driver.licenseExpiryDate);
    if (licenseDays <= warningThreshold && licenseDays >= 0) {
      warnings.push({
        id: `driver-license-${driver.id}`,
        type: 'license-expiring',
        message: `${driverName} - Ehliyet ${licenseDays} gün içinde sona eriyor`,
        severity: getSeverity(licenseDays),
        relatedId: driver.id,
        relatedType: 'driver',
      });
    }

    // Professional certificates
    driver.certificates?.forEach((cert, index) => {
      const certDays = getDaysRemaining(cert.expiryDate);
      if (certDays <= warningThreshold && certDays >= 0) {
        const certName = cert.type === 'SRC' ? 'SRC belgesi' : 'CPC belgesi';
        warnings.push({
          id: `driver-cert-${driver.id}-${index}`,
          type: 'certificate-expiring',
          message: `${driverName} - ${certName} ${certDays} gün içinde sona eriyor`,
          severity: getSeverity(certDays),
          relatedId: driver.id,
          relatedType: 'driver',
        });
      }
    });
  });

  // Sort warnings: errors first (severity), then by days remaining (closest first)
  return warnings.sort((a, b) => {
    // First sort by severity (error before warning)
    if (a.severity === 'error' && b.severity !== 'error') return -1;
    if (a.severity !== 'error' && b.severity === 'error') return 1;

    // Then sort by message to keep consistent ordering
    return a.message.localeCompare(b.message, 'tr');
  });
}
