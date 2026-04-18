import { useTranslation } from 'react-i18next';
import type { FieldDef, FieldValues } from '../../utils/anomalyRuleSchema';

interface Props {
  fields: FieldDef[];
  values: FieldValues;
  onChange: (next: FieldValues) => void;
  disabled?: boolean;
}

/** Typed inputs for rule threshold configuration. Picks the right control per
 *  field kind — integers and percents get a number stepper, time fields get
 *  an HH:MM picker, booleans get a checkbox. Labels + hints are i18n keys so
 *  the same component renders the right copy in tr/en/de. */
const INPUT_CHROME =
  'border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed';

export default function RuleThresholdFields({ fields, values, onChange, disabled }: Props) {
  const { t } = useTranslation();

  if (fields.length === 0) return null;

  const patch = (key: string, value: number | string | boolean) =>
    onChange({ ...values, [key]: value });

  return (
    <div className="space-y-3">
      {fields.map((field) => {
        const raw = values[field.key];
        const unit = field.unit
          ? field.unit.includes('.')
            ? t(field.unit)
            : field.unit
          : null;

        return (
          <div key={field.key} className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <label
                htmlFor={`threshold-${field.key}`}
                className="text-xs font-semibold text-slate-700"
              >
                {t(field.labelKey)}
              </label>
              {field.hintKey && (
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {t(field.hintKey)}
                </p>
              )}
            </div>
            <div className="flex-shrink-0">
              {(field.kind === 'percent' || field.kind === 'int') && (
                <div className="inline-flex items-center gap-1.5">
                  <input
                    id={`threshold-${field.key}`}
                    type="number"
                    value={typeof raw === 'number' ? raw : Number(field.default)}
                    min={field.min}
                    max={field.max}
                    step={field.step ?? 1}
                    disabled={disabled}
                    onChange={(e) => {
                      const n = e.target.value === '' ? 0 : Number(e.target.value);
                      if (Number.isFinite(n)) patch(field.key, n);
                    }}
                    className={`w-20 px-2 py-1 text-right text-sm font-semibold text-slate-800 ${INPUT_CHROME}`}
                  />
                  {unit && <span className="text-xs font-medium text-slate-500">{unit}</span>}
                </div>
              )}
              {field.kind === 'time' && (
                <input
                  id={`threshold-${field.key}`}
                  type="time"
                  value={typeof raw === 'string' ? raw : String(field.default)}
                  disabled={disabled}
                  onChange={(e) => patch(field.key, e.target.value)}
                  className={`px-2 py-1 text-sm font-semibold text-slate-800 ${INPUT_CHROME}`}
                />
              )}
              {field.kind === 'boolean' && (
                <input
                  id={`threshold-${field.key}`}
                  type="checkbox"
                  checked={typeof raw === 'boolean' ? raw : Boolean(field.default)}
                  disabled={disabled}
                  onChange={(e) => patch(field.key, e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
