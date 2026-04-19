import { formatDateTime, formatRelativeTime } from '../../utils/format';

interface Props {
  date: string | Date;
  className?: string;
}

/** Renders relative time ("2 saat önce") with a native `title` showing the
 *  absolute timestamp on hover. Semantic `<time>` element for screen
 *  readers and search engines. */
export default function RelativeTime({ date, className }: Props) {
  const iso = typeof date === 'string' ? date : date.toISOString();
  return (
    <time dateTime={iso} title={formatDateTime(iso)} className={className}>
      {formatRelativeTime(iso)}
    </time>
  );
}
