interface Props {
  plate: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  /** When true, renders on a slate-100 chip with border. */
  chip?: boolean;
  className?: string;
}

const sizeClass: Record<NonNullable<Props['size']>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

/** Renders a plate in JetBrains Mono, bold, tracking-[0.04em]. When plate
 *  is nullish renders a muted em-dash fallback. `chip` wraps in a rounded
 *  slate-100 box with a border — used in the detail modal header. */
export default function Plate({ plate, size = 'md', chip = false, className = '' }: Props) {
  if (!plate) {
    return (
      <span className={`font-mono tracking-[0.04em] text-slate-400 ${sizeClass[size]} ${className}`}>
        —
      </span>
    );
  }

  const base = `font-mono tracking-[0.04em] font-bold text-slate-900 ${sizeClass[size]}`;
  if (chip) {
    return (
      <span className={`${base} px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200 ${className}`}>
        {plate}
      </span>
    );
  }
  return <span className={`${base} ${className}`}>{plate}</span>;
}
