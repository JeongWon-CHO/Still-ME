export type Cycle = 'week' | 'month' | 'year';

export function dayKey(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) =>
      index ? String(part).padStart(2, '0') : String(part).padStart(4, '0'),
    )
    .join('-');
}

export function fromKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function offsetDay(date: Date, days: number) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
    12,
  );
}

export function reviewEnd(start: string, cycle: Cycle) {
  const date = fromKey(start);
  if (cycle === 'week') return dayKey(offsetDay(date, 7));
  const year = date.getFullYear();
  return cycle === 'month'
    ? dayKey(new Date(year, date.getMonth() + 1, 1, 12))
    : dayKey(new Date(year + 1, 0, 1, 12));
}

export function reviewPeriod(today: Date, cycle: Cycle) {
  const monday = offsetDay(today, -((today.getDay() + 6) % 7));
  const sunday = offsetDay(monday, 6);
  const year = today.getFullYear();
  const month = today.getMonth();
  if (cycle === 'week')
    return {
      start: dayKey(offsetDay(monday, -7)),
      end: dayKey(monday),
      available: true,
    };
  if (cycle === 'month') {
    const first = new Date(year, month, 1, 12);
    const last = new Date(year, month + 1, 0, 12);
    const previousLast = offsetDay(first, -1);
    const target = previousLast >= monday ? month - 1 : month;
    return {
      start: dayKey(new Date(year, target, 1, 12)),
      end: dayKey(new Date(year, target + 1, 1, 12)),
      available: previousLast >= monday || last <= sunday,
    };
  }
  const target = month === 0 ? year - 1 : year;
  return {
    start: dayKey(new Date(target, 0, 1, 12)),
    end: dayKey(new Date(target + 1, 0, 1, 12)),
    available: month === 0 || month === 11,
  };
}

export function dateLabel(key: string) {
  return fromKey(key).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}
