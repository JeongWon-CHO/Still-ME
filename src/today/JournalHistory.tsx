import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { dateLabel } from '../dates';
import type { Entry } from '../store';
import { Button, color, styles, Text } from '../ui';
import type { LoadStatus } from './useToday';

type Props = {
  past: Entry[];
  pastStatus: LoadStatus;
  limit: number;
  onRetry: () => void;
  onLoadMore: () => void;
  onOpenEntry: (entry: Entry) => void;
};

export function JournalHistory({
  past,
  pastStatus,
  limit,
  onRetry,
  onLoadMore,
  onOpenEntry,
}: Props) {
  return (
    <>
      <Text
        accessibilityRole="header"
        style={[styles.heading, todayStyles.historyHeading]}
      >
        같은 날의 기록
      </Text>
      {pastStatus === 'loading' && (
        <Text style={styles.muted}>지난 일기를 불러오는 중이에요.</Text>
      )}
      {pastStatus === 'error' && (
        <Button label="지난 일기 다시 불러오기" onPress={onRetry} />
      )}
      {pastStatus === 'ready' && past.length === 0 && (
        <Text style={styles.muted}>아직 이 날짜의 지난 일기가 없어요.</Text>
      )}
      {pastStatus === 'ready' &&
        past.slice(0, limit).map((entry) => (
          <Pressable
            key={entry.date}
            accessibilityRole="button"
            accessibilityLabel={dateLabel(entry.date) + ' 일기 열기'}
            onPress={() => onOpenEntry(entry)}
            style={({ pressed }) => [
              styles.card,
              todayStyles.historyCard,
              pressed && todayStyles.pressed,
            ]}
          >
            <View style={styles.row}>
              <Text style={todayStyles.historyDate}>
                {dateLabel(entry.date)}
              </Text>
              <ChevronRight color={color.muted} size={15} />
            </View>
            <Text numberOfLines={3} style={styles.body}>
              {entry.body}
            </Text>
          </Pressable>
        ))}
      {pastStatus === 'ready' && past.length > limit && (
        <Button label="지난 일기 더 보기" onPress={onLoadMore} />
      )}
    </>
  );
}

const todayStyles = StyleSheet.create({
  historyHeading: { marginTop: 6 },
  historyCard: { borderRadius: 16 },
  historyDate: {
    color: color.ink,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: { opacity: 0.65 },
});
