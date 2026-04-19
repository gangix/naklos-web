import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, ClipboardCheck } from 'lucide-react';
import { useFleetRoster } from '../contexts/FleetRosterContext';
import { useFleet } from '../contexts/FleetContext';
import type { Truck, Driver } from '../types';
import { computeCellStatus, CELL_STATUS_RANK } from '../utils/docCellStatus';
import type { CellStatus } from '../utils/docCellStatus';
import MatrixCell from '../components/compliance/MatrixCell';

type EntityTab = 'trucks' | 'drivers';
type ChipFilter = 'ALL' | 'CRITICAL' | 'WARNING' | 'INFO' | 'MISSING' | 'VALID';

interface TruckColumn {
  id: 'compulsory' | 'comprehensive' | 'inspection';
  label: string;
  pick: (truck: Truck) => string | null;
}

interface DriverColumn {
  id: 'license' | 'src' | 'cpc';
  label: string;
  pick: (driver: Driver) => string | null;
}

export default function CompliancePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { plan } = useFleet();
  const { trucks, drivers, loading } = useFleetRoster();
  const [activeTab, setActiveTab] = useState<EntityTab>('trucks');
  const [filter, setFilter] = useState<ChipFilter>('ALL');
  const [search, setSearch] = useState('');

  const truckColumns: TruckColumn[] = [
    { id: 'compulsory', label: t('compliance.column.compulsory'), pick: (t) => t.compulsoryInsuranceExpiry },
    { id: 'comprehensive', label: t('compliance.column.comprehensive'), pick: (t) => t.comprehensiveInsuranceExpiry },
    { id: 'inspection', label: t('compliance.column.inspection'), pick: (t) => t.inspectionExpiry },
  ];

  const driverColumns: DriverColumn[] = [
    { id: 'license', label: t('compliance.column.license'), pick: (d) => d.licenseExpiryDate ?? null },
    { id: 'src', label: t('compliance.column.src'), pick: (d) => d.certificates?.find((c) => c.type === 'SRC')?.expiryDate ?? null },
    { id: 'cpc', label: t('compliance.column.cpc'), pick: (d) => d.certificates?.find((c) => c.type === 'CPC')?.expiryDate ?? null },
  ];

  // Build matrix rows. React 19's compiler auto-memoizes, so no useMemo needed
  // here — manual useMemo with label-dependent deps (t, truckColumns) doesn't
  // match the compiler's inferred deps and blocks auto-memoization.
  const truckRows = trucks.map((truck) => {
    const cells = truckColumns.map((col) => ({
      colId: col.id,
      ...computeCellStatus(col.pick(truck)),
    }));
    const worstStatus: CellStatus = cells.reduce<CellStatus>((worst, c) => {
      return CELL_STATUS_RANK[c.status] > CELL_STATUS_RANK[worst] ? c.status : worst;
    }, 'VALID');
    return {
      id: truck.id,
      label: truck.plateNumber,
      sublabel: truck.assignedDriverName ?? '',
      cells,
      worstStatus,
    };
  });

  const driverRows = drivers.map((driver) => {
    const cells = driverColumns.map((col) => ({
      colId: col.id,
      ...computeCellStatus(col.pick(driver)),
    }));
    // CPC is optional — if the driver has no CPC cert and the column is CPC,
    // treat that cell as VALID (not MISSING) so it doesn't skew the filter.
    const normalized = cells.map((c) => {
      if (c.colId === 'cpc' && c.status === 'MISSING') {
        const hasCpc = !!driver.certificates?.find((cert) => cert.type === 'CPC');
        if (!hasCpc) return { ...c, status: 'VALID' as CellStatus };
      }
      return c;
    });
    const worstStatus: CellStatus = normalized.reduce<CellStatus>((worst, c) => {
      return CELL_STATUS_RANK[c.status] > CELL_STATUS_RANK[worst] ? c.status : worst;
    }, 'VALID');
    return {
      id: driver.id,
      label: `${driver.firstName} ${driver.lastName}`,
      sublabel: driver.assignedTruckPlate ?? '',
      cells: normalized,
      worstStatus,
    };
  });

  const activeRows = activeTab === 'trucks' ? truckRows : driverRows;
  const activeColumns = activeTab === 'trucks' ? truckColumns : driverColumns;

  // Chip counts are computed across the ACTIVE tab only — the tote reflects
  // what's visible in the matrix, not the aggregate of both tabs.
  const chipCounts: Record<ChipFilter, number> = {
    ALL: activeRows.length, CRITICAL: 0, WARNING: 0, INFO: 0, MISSING: 0, VALID: 0,
  };
  for (const row of activeRows) {
    // Row-level stats based on worst-cell.
    if (row.worstStatus === 'VALID') chipCounts.VALID++;
    if (row.worstStatus === 'CRITICAL') chipCounts.CRITICAL++;
    if (row.worstStatus === 'WARNING') chipCounts.WARNING++;
    if (row.worstStatus === 'INFO') chipCounts.INFO++;
    // MISSING = any cell in the row is MISSING (subset of Kritik conceptually).
    if (row.cells.some((c) => c.status === 'MISSING')) chipCounts.MISSING++;
  }

  // Apply search + chip filter.
  const q = search.trim().toLocaleLowerCase('tr-TR');
  const filteredRows = activeRows.filter((row) => {
    if (q && !row.label.toLocaleLowerCase('tr-TR').includes(q) && !row.sublabel.toLocaleLowerCase('tr-TR').includes(q)) {
      return false;
    }
    if (filter === 'ALL') return true;
    if (filter === 'MISSING') return row.cells.some((c) => c.status === 'MISSING');
    return row.worstStatus === filter;
  });

  // Compliance score = % of cells at VALID status across the active tab.
  const totalCells = activeRows.reduce((acc, r) => acc + r.cells.length, 0);
  const validCells = activeRows.reduce((acc, r) => acc + r.cells.filter((c) => c.status === 'VALID').length, 0);
  const complianceScore = totalCells === 0 ? null : Math.round((validCells / totalCells) * 100);

  const goToEntity = (id: string) => {
    const path = activeTab === 'trucks' ? `/manager/trucks/${id}` : `/manager/drivers/${id}`;
    navigate(path);
  };

  return (
    <div className="pb-16">
      {/* Header: title + compliance score pill */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            {t('compliance.title')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t('compliance.subtitle')}</p>
        </div>
        {complianceScore !== null && (
          <ComplianceScorePill score={complianceScore} plan={plan} />
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
        {(['trucks', 'drivers'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setFilter('ALL'); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'trucks' ? t('compliance.tabs.trucks') : t('compliance.tabs.drivers')}
            <span className="ml-1.5 text-xs text-gray-400 tabular-nums">
              ({tab === 'trucks' ? truckRows.length : driverRows.length})
            </span>
          </button>
        ))}
      </div>

      {/* Search + chips */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('compliance.searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(['ALL', 'CRITICAL', 'WARNING', 'INFO', 'MISSING', 'VALID'] as const).map((c) => (
            <ChipButton
              key={c}
              kind={c}
              label={t(`compliance.chips.${c.toLowerCase()}`)}
              count={chipCounts[c]}
              active={filter === c}
              onClick={() => setFilter(filter === c ? 'ALL' : c)}
            />
          ))}
        </div>
      </div>

      {/* Matrix */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {activeRows.length === 0 ? t('compliance.empty.noEntities') : t('compliance.empty.noMatches')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="sticky left-0 z-10 bg-gray-50 text-left px-4 py-3 text-[11px] font-bold tracking-wider uppercase text-gray-500">
                    {activeTab === 'trucks' ? t('compliance.column.plate') : t('compliance.column.driver')}
                  </th>
                  {activeColumns.map((col) => (
                    <th key={col.id} className="text-center px-3 py-3 text-[11px] font-bold tracking-wider uppercase text-gray-500 whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="group hover:bg-slate-50/70 transition-colors">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/70 transition-colors px-4 py-3">
                      <button
                        type="button"
                        onClick={() => goToEntity(row.id)}
                        className="text-left hover:text-primary-600 transition-colors"
                      >
                        <div className="text-sm font-bold tracking-tight text-gray-900 group-hover:text-primary-700 transition-colors">
                          {row.label}
                        </div>
                        {row.sublabel && (
                          <div className="text-[11px] text-gray-500 mt-0.5">{row.sublabel}</div>
                        )}
                      </button>
                    </td>
                    {row.cells.map((cell, idx) => (
                      <td key={cell.colId} className="px-2 py-2 align-middle">
                        <MatrixCell
                          status={cell.status}
                          days={cell.days}
                          onClick={() => goToEntity(row.id)}
                          docLabel={activeColumns[idx].label}
                          entityLabel={row.label}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/** Compact pill showing the % of fully valid document cells across the fleet.
 *  Tone flips from emerald to attention/urgent as the score drops, so the
 *  manager gets a glanceable health signal without reading the table. */
function ComplianceScorePill({ score, plan }: { score: number; plan?: string }) {
  const { t } = useTranslation();
  const tone =
    score >= 95 ? { bg: 'bg-emerald-50',   text: 'text-emerald-700',   ring: 'ring-emerald-100' }
    : score >= 80 ? { bg: 'bg-info-50',    text: 'text-info-700',      ring: 'ring-info-100' }
    : score >= 60 ? { bg: 'bg-attention-50', text: 'text-attention-700', ring: 'ring-attention-100' }
    : { bg: 'bg-urgent-50', text: 'text-urgent-700', ring: 'ring-urgent-100' };
  return (
    <div className={`shrink-0 rounded-xl px-4 py-2.5 ring-1 ${tone.bg} ${tone.text} ${tone.ring}`}>
      <div className="text-[10px] font-semibold tracking-wider uppercase opacity-75">
        {t('compliance.score.label')}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-extrabold tabular-nums">%{score}</span>
        {plan && (
          <span className="text-[10px] font-medium opacity-60">· {plan}</span>
        )}
      </div>
    </div>
  );
}

/** One pill in the filter row. Color cue matches the matrix cells for the
 *  tier chips; MISSING borrows slate, ALL is neutral, VALID is emerald. */
function ChipButton({
  kind, label, count, active, onClick,
}: {
  kind: ChipFilter;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const palette: Record<ChipFilter, { active: string; idle: string; dot: string }> = {
    ALL:      { active: 'bg-gray-900 text-white border-gray-900',                 idle: 'bg-white text-gray-700 border-gray-200 hover:border-gray-400',       dot: 'bg-gray-400' },
    CRITICAL: { active: 'bg-urgent-500 text-white border-urgent-500',             idle: 'bg-white text-urgent-700 border-gray-200 hover:border-urgent-300',   dot: 'bg-urgent-500' },
    WARNING:  { active: 'bg-attention-500 text-white border-attention-500',       idle: 'bg-white text-attention-700 border-gray-200 hover:border-attention-300', dot: 'bg-attention-500' },
    INFO:     { active: 'bg-info-500 text-white border-info-500',                 idle: 'bg-white text-info-700 border-gray-200 hover:border-info-300',       dot: 'bg-info-500' },
    MISSING:  { active: 'bg-slate-600 text-white border-slate-600',               idle: 'bg-white text-slate-700 border-gray-200 hover:border-slate-400',     dot: 'bg-slate-400' },
    VALID:    { active: 'bg-emerald-500 text-white border-emerald-500',           idle: 'bg-white text-emerald-700 border-gray-200 hover:border-emerald-300', dot: 'bg-emerald-500' },
  };
  const p = palette[kind];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
        active ? p.active : p.idle
      }`}
    >
      {kind !== 'ALL' && (
        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white/80' : p.dot}`} />
      )}
      <span>{label}</span>
      <span className={`tabular-nums ${active ? 'opacity-90' : 'opacity-60'}`}>{count}</span>
    </button>
  );
}
