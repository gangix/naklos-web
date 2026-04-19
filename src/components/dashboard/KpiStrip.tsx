import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Truck, FileWarning, Fuel, Users } from 'lucide-react';
import { useFleetRoster } from '../../contexts/FleetRosterContext';
import { useFuelCounts } from '../../contexts/FuelCountsContext';
import { useDocumentAttention } from '../../hooks/useDocumentAttention';
import KpiTile from './KpiTile';

/** 4-tile KPI strip for the dashboard. All data comes from existing
 *  contexts — no new HTTP calls. Tiles route to the relevant page on
 *  click. No trends/sparklines in this iteration (no historical data
 *  wired through yet). */
export default function KpiStrip() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { trucks, drivers } = useFleetRoster();
  const { total: fuelAlertCount } = useFuelCounts();
  const { trucksWithWarnings, driversWithWarnings } = useDocumentAttention();
  const docAlertCount = trucksWithWarnings + driversWithWarnings;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <KpiTile
        label={t('dashboard.kpi.activeFleet')}
        value={trucks.length}
        icon={Truck}
        tone="neutral"
        onClick={() => navigate('/manager/trucks')}
      />
      <KpiTile
        label={t('dashboard.kpi.expiringDocs')}
        value={docAlertCount}
        icon={FileWarning}
        tone={docAlertCount > 0 ? 'attention' : 'neutral'}
        onClick={() => navigate('/manager/trucks')}
      />
      <KpiTile
        label={t('dashboard.kpi.fuelAlerts')}
        value={fuelAlertCount}
        icon={Fuel}
        tone={fuelAlertCount > 0 ? 'urgent' : 'neutral'}
        onClick={() => navigate('/manager/fuel-alerts')}
      />
      <KpiTile
        label={t('dashboard.kpi.drivers')}
        value={drivers.length}
        icon={Users}
        tone="neutral"
        onClick={() => navigate('/manager/drivers')}
      />
    </div>
  );
}
