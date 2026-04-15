import { useSearchParams } from 'react-router-dom';
import { useFleet } from '../contexts/FleetContext';
import FuelReviewTabs from '../components/fuel/FuelReviewTabs';

export default function FuelReviewPage() {
  const { fleetId } = useFleet();
  const [params] = useSearchParams();
  const batchId = params.get('batchId');
  const tab = (params.get('tab') ?? 'unmatched') as 'unmatched' | 'duplicates';
  if (!fleetId) return null;
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Yakıt İncelemesi</h1>
      <FuelReviewTabs fleetId={fleetId} batchId={batchId} initialTab={tab} />
    </div>
  );
}
