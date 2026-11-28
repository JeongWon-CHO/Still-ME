import { Cycle, fromKey, offsetDay } from '../dates';

export const reviewTitles = {
  week: '주간 회고',
  month: '월간 회고',
  year: '연간 회고',
};

export function reviewTitle(cycle: Cycle, start: string, end: string) {
  const year = start.slice(0, 4);
  const first = fromKey(start);
  if (cycle === 'year') return year + '년';
  const month = first.getMonth() + 1;
  if (cycle === 'month') return year + '년 ' + month + '월';

  const last = offsetDay(fromKey(end), -1);
  const lastYear = last.getFullYear();
  const lastMonth = last.getMonth() + 1;
  const lastYearLabel =
    first.getFullYear() === lastYear ? '' : lastYear + '년 ';
  const lastMonthLabel = month === lastMonth ? '' : lastMonth + '월 ';
  return `${year}년 ${month}월 ${first.getDate()}일–${lastYearLabel}${lastMonthLabel}${last.getDate()}일`;
}
