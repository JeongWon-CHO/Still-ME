import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { dateLabel, dayKey } from '../dates';
import type { Entry } from '../store';
import { color, styles, Text } from '../ui';

type Props = {
  year: number;
  index: number;
  today: string;
  entries: Entry[];
  selected: string | undefined;
  busy: boolean;
  canCreate: boolean;
  onSelect: (date: string) => void;
  move: (delta: number) => void;
};

export const JournalCalendar = memo(function JournalCalendar({
  year,
  index,
  today,
  entries,
  selected,
  busy,
  canCreate,
  onSelect,
  move,
}: Props) {
  const blank = new Date(year, index, 1).getDay();
  const length = new Date(year, index + 1, 0).getDate();
  const recordedDates = useMemo(
    () => new Set(entries.map((entry) => entry.date)),
    [entries],
  );

  function monthButtonStyle({ pressed }: { pressed: boolean }) {
    return [
      calendarStyles.monthButton,
      busy && calendarStyles.monthButtonDisabled,
      pressed && calendarStyles.monthButtonPressed,
    ];
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이전 달"
          accessibilityState={{ disabled: busy }}
          onPress={() => move(-1)}
          disabled={busy}
          style={monthButtonStyle}
        >
          <ChevronLeft color={color.ink} size={20} />
        </Pressable>
        <Text style={[styles.heading, calendarStyles.month]}>
          {year}년 {index + 1}월
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="다음 달"
          accessibilityState={{ disabled: busy }}
          onPress={() => move(1)}
          disabled={busy}
          style={monthButtonStyle}
        >
          <ChevronRight color={color.ink} size={20} />
        </Pressable>
      </View>
      <View style={calendarStyles.row}>
        {Array.from('일월화수목금토').map((day, column) => (
          <Text
            key={day}
            style={[styles.muted, calendarStyles.weekday, weekendStyle(column)]}
          >
            {day}
          </Text>
        ))}
      </View>
      {Array.from({ length: Math.ceil((blank + length) / 7) }, (_, week) => (
        <View key={week} style={calendarStyles.row}>
          {Array.from({ length: 7 }, (_, column) => {
            const day = week * 7 + column - blank + 1;
            if (day < 1 || day > length)
              return <View key={column} style={calendarStyles.blank} />;
            const key = dayKey(new Date(year, index, day));
            const recorded = recordedDates.has(key);
            return (
              <CalendarDay
                key={column}
                date={key}
                day={day}
                column={column}
                recorded={recorded}
                disabled={busy || (!recorded && (!canCreate || key > today))}
                isToday={key === today}
                selected={selected === key}
                onSelect={onSelect}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
});

const CalendarDay = memo(function CalendarDay({
  date,
  day,
  column,
  recorded,
  disabled,
  isToday,
  selected,
  onSelect,
}: {
  date: string;
  day: number;
  column: number;
  recorded: boolean;
  disabled: boolean;
  isToday: boolean;
  selected: boolean;
  onSelect: Props['onSelect'];
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => onSelect(date)}
      accessibilityRole="button"
      accessibilityLabel={
        disabled && !recorded
          ? dateLabel(date)
          : dateLabel(date) + (recorded ? ' 일기 선택' : ' 일기 쓰기')
      }
      accessibilityState={{ selected, disabled }}
      accessibilityHint={isToday ? '오늘' : undefined}
      style={[
        calendarStyles.day,
        isToday && calendarStyles.today,
        selected && calendarStyles.selected,
      ]}
    >
      <Text
        style={[
          recorded ? calendarStyles.recordedDay : calendarStyles.emptyDay,
          weekendStyle(column),
        ]}
      >
        {day}
      </Text>
      {recorded && <View style={calendarStyles.dot} />}
    </Pressable>
  );
});

const calendarStyles = StyleSheet.create({
  monthButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  monthButtonDisabled: { opacity: 0.45 },
  monthButtonPressed: { backgroundColor: color.pale },
  sunday: { color: '#b42318' },
  saturday: { color: '#1756a9' },
  month: { textAlign: 'center', flexShrink: 1 },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center' },
  blank: { flex: 1 },
  day: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  selected: { backgroundColor: color.pale },
  today: { borderWidth: 1, borderColor: color.line },
  recordedDay: { color: color.ink, fontWeight: '700' },
  emptyDay: { color: color.muted, fontWeight: '400' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: color.ink },
});

function weekendStyle(column: number) {
  if (column === 0) return calendarStyles.sunday;
  if (column === 6) return calendarStyles.saturday;
}
