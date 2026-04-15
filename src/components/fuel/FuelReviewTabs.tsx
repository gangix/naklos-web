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
  const tabClass = (active: boolean) =>
    `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
      active
        ? 'border-primary-600 text-primary-700'
        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
    }`;

  return (
    <div>
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        <button className={tabClass(tab === 'unmatched')} onClick={() => setTab('unmatched')}>
          Eşleşmeyen plakalar
        </button>
        <button className={tabClass(tab === 'duplicates')} onClick={() => setTab('duplicates')}>
          Olası yineleme
        </button>
      </div>
      {tab === 'unmatched'
        ? <UnmatchedPlateList fleetId={fleetId} batchId={batchId} />
        : <PossibleDuplicatesList fleetId={fleetId} batchId={batchId} />}
    </div>
  );
}
