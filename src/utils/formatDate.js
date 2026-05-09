import { format, formatDistanceToNow, isYesterday, isToday } from 'date-fns';

export function formatDate(iso) {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'd MMM yyyy');
  } catch {
    return iso;
  }
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'd MMM yyyy, hh:mm aa');
  } catch {
    return iso;
  }
}

export function timeAgo(iso) {
  if (!iso) return '—';
  try {
    const date = new Date(iso);
    if (isToday(date)) return formatDistanceToNow(date, { addSuffix: true });
    if (isYesterday(date)) return 'Yesterday';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return iso;
  }
}
