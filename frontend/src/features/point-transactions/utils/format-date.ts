type DateResult =
  | { key: 'today'; time: string }
  | { key: 'yesterday'; time: string }
  | { key: 'date'; time: string; date: string };

export function formatTransactionDate(iso: string): DateResult {
  const date = new Date(iso);
  const now = new Date();

  const timeStr = date.toLocaleTimeString('en', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return { key: 'today', time: timeStr };

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isYesterday) return { key: 'yesterday', time: timeStr };

  const dateStr = date.toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return { key: 'date', time: timeStr, date: dateStr };
}
