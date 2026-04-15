import { useState } from 'react';
import UnmatchedPlateList from './UnmatchedPlateList';
import PossibleDuplicatesList from './PossibleDuplicatesList';

type Tab = 'unmatched' | 'duplicates';

interface Props {
  fleetId: string;
  batchId: string | null;
  initialTab: Tab;
}

export default function FuelReviewTabs({ fleetId, batchId, initialTab }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  return (
    <div>
      <div className="flex gap-2 border-b mb-4">
        <button
          className={`px-4 py-2 ${tab === 'unmatched' ? 'border-b-2 border-primary-600 font-semibold' : ''}`}
          onClick={() => setTab('unmatched')}>
          Eşleşmeyen plakalar
        </button>
        <button
          className={`px-4 py-2 ${tab === 'duplicates' ? 'border-b-2 border-primary-600 font-semibold' : ''}`}
          onClick={() => setTab('duplicates')}>
          Olası yineleme
        </button>
      </div>
      {tab === 'unmatched'
        ? <UnmatchedPlateList fleetId={fleetId} batchId={batchId} />
        : <PossibleDuplicatesList fleetId={fleetId} batchId={batchId} />}
    </div>
  );
}
