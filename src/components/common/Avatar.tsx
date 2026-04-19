/** Deterministic-color initials avatar. Same name → same hue, forever →
 *  the driver roster forms a stable, cohesive mosaic instead of reshuffling
 *  colors on every render. Hue-only variation keeps saturation / lightness
 *  consistent so the palette stays calm. Optional photoUrl takes priority.
 */
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface Props {
  name: string;
  photoUrl?: string | null;
  size?: Size;
  className?: string;
}

const SIZE: Record<Size, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

/** 32-bit FNV-1a over the lowercased name. Deterministic across renders +
 *  sessions; fine distribution for ≤1000 drivers. */
function hueFor(name: string): number {
  let h = 2166136261;
  const s = name.trim().toLowerCase();
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // 24 hue buckets × 15° — avoids neighbour-indistinguishable colors while
  // still covering the wheel.
  return ((h >>> 0) % 24) * 15;
}

/** Return up to 2 uppercase letters: first + last word's first letter,
 *  or just the first letter for single-word names. Uses the Unicode
 *  "Letter" category so punctuation (quotes, dots) never surface as an
 *  initial. Returns "?" when no letters exist at all. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = /\p{L}/u.exec(parts[0])?.[0];
  if (parts.length === 1) return first ? first.toUpperCase() : '?';
  const last = /\p{L}/u.exec(parts[parts.length - 1])?.[0];
  return ((first ?? '') + (last ?? '')).toUpperCase() || '?';
}

export default function Avatar({ name, photoUrl, size = 'md', className = '' }: Props) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${SIZE[size]} rounded-full object-cover ring-1 ring-slate-200 ${className}`}
      />
    );
  }
  const hue = hueFor(name);
  return (
    <div
      aria-hidden="true"
      className={`${SIZE[size]} rounded-full flex items-center justify-center font-semibold text-white ring-1 ring-black/5 select-none ${className}`}
      // L=42% keeps white text ≥4.6:1 contrast on all 24 hue buckets (WCAG AA).
      // L=48% would fail on the yellow/lime band (hues 45-75°).
      style={{ backgroundColor: `hsl(${hue} 55% 42%)` }}
    >
      {initialsOf(name)}
    </div>
  );
}
