import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Truck as TruckIcon, User, Clock, X, CornerDownLeft, ArrowUp, ArrowDown } from 'lucide-react';
import { useFleetRoster } from '../../contexts/FleetRosterContext';
import { readRecent } from '../../utils/recentEntities';
import type { Truck, Driver } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

type ResultItem =
  | { kind: 'truck'; id: string; label: string; sublabel: string }
  | { kind: 'driver'; id: string; label: string; sublabel: string };

/** Lowercase + strip TR-specific diacritics for case/accent-insensitive
 *  substring matching. "İSTANBUL 34 ABC" should match "istanbul", "Çağrı"
 *  should match "cagri". Naive but sufficient for plates + names. */
function normalize(s: string): string {
  return s
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ç/g, 'c');
}

/** Rank match strength: prefix > word-prefix > substring. Keeps "ali" bumping
 *  "Ali Yılmaz" above "Kemal İleri" even though both contain the substring. */
function score(haystack: string, needle: string): number {
  const h = normalize(haystack);
  const n = normalize(needle);
  if (!n) return 0;
  if (h === n) return 1000;
  if (h.startsWith(n)) return 500;
  if (h.includes(' ' + n)) return 250;
  if (h.includes(n)) return 100;
  return 0;
}

function truckLabel(t: Truck): { label: string; sublabel: string } {
  return { label: t.plateNumber, sublabel: t.type || '' };
}
function driverLabel(d: Driver): { label: string; sublabel: string } {
  return {
    label: `${d.firstName} ${d.lastName}`,
    sublabel: d.assignedTruckPlate ?? '',
  };
}

/** ⌘K / Ctrl+K palette — modal overlay opening on keyboard shortcut (desktop)
 *  or via a button in ManagerTopNav (mobile). Searches trucks + drivers
 *  locally from FleetRosterContext; no network, no latency. Empty state
 *  surfaces the user's last 5 visited entities (see utils/recentEntities). */
export default function CommandPalette({ open, onClose }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { trucks, drivers } = useFleetRoster();
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Focus the input + reset query every time the palette opens.
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      // Defer focus to the next frame so the <input> is actually mounted.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Close on Escape anywhere; allow typing inside the input freely.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Compute results: up to 5 per entity type, ranked by match score.
  const results = useMemo<ResultItem[]>(() => {
    const q = query.trim();
    if (!q) return [];
    const truckMatches: Array<ResultItem & { s: number }> = [];
    for (const truck of trucks) {
      const { label, sublabel } = truckLabel(truck);
      const s = Math.max(score(label, q), score(sublabel, q));
      if (s > 0) truckMatches.push({ kind: 'truck', id: truck.id, label, sublabel, s });
    }
    const driverMatches: Array<ResultItem & { s: number }> = [];
    for (const driver of drivers) {
      const { label, sublabel } = driverLabel(driver);
      const s = Math.max(score(label, q), score(sublabel, q));
      if (s > 0) driverMatches.push({ kind: 'driver', id: driver.id, label, sublabel, s });
    }
    truckMatches.sort((a, b) => b.s - a.s);
    driverMatches.sort((a, b) => b.s - a.s);
    return [...truckMatches.slice(0, 5), ...driverMatches.slice(0, 5)].map(({ s: _s, ...rest }) => {
      void _s;
      return rest;
    });
  }, [query, trucks, drivers]);

  // When query is empty, the empty-state list is the recent entities.
  const recent = useMemo(() => (open && !query ? readRecent() : []), [open, query]);
  const emptyStateItems: ResultItem[] = recent.map((r) => ({
    kind: r.type,
    id: r.id,
    label: r.label,
    sublabel: r.sublabel ?? '',
  }));

  const itemsForNavigation = query ? results : emptyStateItems;

  // Keep the selected row within range when the list length changes.
  useEffect(() => {
    if (selectedIdx >= itemsForNavigation.length) setSelectedIdx(0);
  }, [itemsForNavigation.length, selectedIdx]);

  // Arrow keys + Enter — listen only while the palette is open.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, Math.max(0, itemsForNavigation.length - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        const item = itemsForNavigation[selectedIdx];
        if (!item) return;
        e.preventDefault();
        activate(item);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, itemsForNavigation, selectedIdx]);

  const activate = (item: ResultItem) => {
    const path = item.kind === 'truck' ? `/manager/trucks/${item.id}` : `/manager/drivers/${item.id}`;
    onClose();
    navigate(path);
  };

  if (!open) return null;

  const grouped = query
    ? {
        trucks: results.filter((r) => r.kind === 'truck'),
        drivers: results.filter((r) => r.kind === 'driver'),
      }
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh] md:pt-[14vh] bg-slate-950/40 backdrop-blur-sm animate-[fadeIn_120ms_ease-out]"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-[0_24px_60px_rgba(15,23,42,0.25)] border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="flex-1 bg-transparent text-[15px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={t('search.close')}
            className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto">
          {query && results.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500">
              {t('search.noResults')}
            </div>
          )}
          {!query && emptyStateItems.length === 0 && (
            <div className="py-12 px-6 text-center">
              <p className="text-sm text-slate-500">{t('search.emptyHint')}</p>
            </div>
          )}
          {!query && emptyStateItems.length > 0 && (
            <GroupHeader icon={<Clock className="w-3.5 h-3.5" />} label={t('search.group.recent')} />
          )}
          {!query && emptyStateItems.map((item, idx) => (
            <Row
              key={`${item.kind}-${item.id}`}
              item={item}
              selected={idx === selectedIdx}
              onClick={() => activate(item)}
              onHover={() => setSelectedIdx(idx)}
            />
          ))}

          {query && grouped && grouped.trucks.length > 0 && (
            <>
              <GroupHeader icon={<TruckIcon className="w-3.5 h-3.5" />} label={t('search.group.trucks')} />
              {grouped.trucks.map((item, idx) => {
                const globalIdx = idx;
                return (
                  <Row
                    key={`truck-${item.id}`}
                    item={item}
                    selected={globalIdx === selectedIdx}
                    onClick={() => activate(item)}
                    onHover={() => setSelectedIdx(globalIdx)}
                  />
                );
              })}
            </>
          )}
          {query && grouped && grouped.drivers.length > 0 && (
            <>
              <GroupHeader icon={<User className="w-3.5 h-3.5" />} label={t('search.group.drivers')} />
              {grouped.drivers.map((item, idx) => {
                const globalIdx = (grouped.trucks.length) + idx;
                return (
                  <Row
                    key={`driver-${item.id}`}
                    item={item}
                    selected={globalIdx === selectedIdx}
                    onClick={() => activate(item)}
                    onHover={() => setSelectedIdx(globalIdx)}
                  />
                );
              })}
            </>
          )}
        </div>

        {/* Footer: keyboard hints */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <kbd className="inline-flex items-center justify-center w-5 h-5 rounded border border-slate-200 bg-white text-slate-600"><ArrowUp className="w-3 h-3" /></kbd>
            <kbd className="inline-flex items-center justify-center w-5 h-5 rounded border border-slate-200 bg-white text-slate-600"><ArrowDown className="w-3 h-3" /></kbd>
            <span>{t('search.hint.move')}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="inline-flex items-center justify-center w-5 h-5 rounded border border-slate-200 bg-white text-slate-600"><CornerDownLeft className="w-3 h-3" /></kbd>
            <span>{t('search.hint.open')}</span>
          </span>
          <span className="inline-flex items-center gap-1 ml-auto">
            <kbd className="inline-flex items-center justify-center h-5 px-1.5 rounded border border-slate-200 bg-white text-slate-600 text-[10px] font-semibold">esc</kbd>
            <span>{t('search.hint.close')}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function GroupHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-wider uppercase text-slate-400 bg-slate-50/60">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function Row({
  item, selected, onClick, onHover,
}: {
  item: ResultItem;
  selected: boolean;
  onClick: () => void;
  onHover: () => void;
}) {
  const Icon = item.kind === 'truck' ? TruckIcon : User;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onHover}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
        selected ? 'bg-primary-50' : 'hover:bg-slate-50'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        item.kind === 'truck'
          ? selected ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'
          : selected ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'
      }`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-slate-900 truncate">{item.label}</div>
        {item.sublabel && (
          <div className="text-[11px] text-slate-500 truncate">{item.sublabel}</div>
        )}
      </div>
      {selected && (
        <CornerDownLeft className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
      )}
    </button>
  );
}
