import { useFocusEffect } from 'expo-router';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { type ComponentRef, useCallback, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Pressable,
  type ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Cycle,
  dateLabel,
  offsetDay,
  reviewEnd,
  reviewPeriod,
} from '../src/dates';
import { Dialog } from '../src/Dialog';
import { RecordCardHeader } from '../src/RecordCardHeader';
import { reviewTitle, reviewTitles } from '../src/review/labels';
import { ReviewHome } from '../src/review/ReviewHome';
import { Entry, getDatabase, loadEntriesInRange, Review } from '../src/store';
import { Button, color, Page, styles, Text, TextInput } from '../src/ui';

const monthly = [
  '이번 달을 한 문장으로 표현한다면?',
  '이번 달 나를 가장 행복하게 했던 것은 무엇인가요?',
  '이번 달 가장 힘들었던 일은 무엇인가요?',
  '지난달의 나와 비교했을 때 달라진 점이 있나요?',
  '요즘 가장 많은 생각을 차지하는 것은 무엇인가요?',
  '다음 달에도 가져가고 싶은 것과 내려놓고 싶은 것은 무엇인가요?',
];
const yearly = [
  '올해를 한 문장으로 표현한다면?',
  '올해 가장 기억에 남는 순간은 무엇인가요?',
  '올해 가장 잘했다고 생각하는 선택은 무엇인가요?',
  '1년 전의 나와 비교했을 때 무엇이 달라졌나요?',
  '올해를 함께해 준 소중한 사람은 누구인가요?',
  '지금 나에게 가장 중요한 것은 무엇인가요?',
  '올해의 나에게 해주고 싶은 말은 무엇인가요?',
  '내년에는 어떤 사람이 되고 싶나요?',
  '1년 뒤의 나에게 편지를 남겨 주세요.',
];
const groups: Record<number, string> = {
  0: '한 해를 기억하며',
  3: '지금의 나를 기록하며',
  7: '다가올 한 해를 바라보며',
};

export default function Reviews() {
  const [today, setToday] = useState(() => new Date());
  const [selection, setSelection] = useState<{
    cycle: Cycle;
    period?: string;
  }>();
  const close = useCallback(() => setSelection(undefined), []);

  useFocusEffect(
    useCallback(() => {
      setToday(new Date());
    }, []),
  );

  return (
    <View style={styles.safe}>
      <View
        style={styles.safe}
        pointerEvents={selection ? 'none' : 'auto'}
        accessibilityElementsHidden={Boolean(selection)}
        importantForAccessibility={selection ? 'no-hide-descendants' : 'auto'}
      >
        <ReviewHome
          today={today}
          visible={!selection}
          onOpen={(cycle, period) => setSelection({ cycle, period })}
        />
      </View>
      {selection && (
        <View style={StyleSheet.absoluteFill}>
          <ReviewDetail
            cycle={selection.cycle}
            archivedPeriod={selection.period}
            today={today}
            onClose={close}
          />
        </View>
      )}
    </View>
  );
}

function ReviewDetail({
  cycle,
  archivedPeriod,
  today,
  onClose,
}: {
  cycle: Cycle;
  archivedPeriod?: string;
  today: Date;
  onClose: () => void;
}) {
  const [week, setWeek] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [editAnswers, setEditAnswers] = useState<string[] | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [weekly, setWeekly] = useState<
    { period: string; answer: string | undefined }[]
  >([]);
  const [done, setDone] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [busy, setBusy] = useState(false);
  const pendingWrite = useRef<Promise<void> | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<'confirm' | 'error'>();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const diaryListY = useRef<number | null>(null);

  const reading = done && editAnswers === null;
  const contextBelow = Boolean(archivedPeriod) || cycle === 'month';

  const { start, end } = archivedPeriod
    ? { start: archivedPeriod, end: reviewEnd(archivedPeriod, cycle) }
    : reviewPeriod(
        cycle === 'week' ? offsetDay(today, -7 * week) : today,
        cycle,
      );

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          if (!pendingWrite.current) onClose();
          return true;
        },
      );
      return () => subscription.remove();
    }, [onClose]),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setStatus('loading');
      async function load() {
        await pendingWrite.current;
        if (!active) return;
        const db = await getDatabase();
        const [diary, review, weeks] = await Promise.all([
          cycle === 'year' ? [] : loadEntriesInRange(start, end),
          db.getFirstAsync<Review>(
            'SELECT * FROM reviews WHERE cycle = ? AND period = ?',
            cycle,
            start,
          ),
          cycle === 'month'
            ? db.getAllAsync<Review>(
                "SELECT * FROM reviews WHERE cycle = 'week' AND period >= ? AND period < ? ORDER BY period DESC",
                start,
                end,
              )
            : [],
        ]);
        if (!active) return;
        const loadedAnswers = review ? JSON.parse(review.answers) : [];
        const weeklySummaries = weeks.map(({ period, answers }) => ({
          period,
          answer: (JSON.parse(answers) as string[])[0],
        }));
        setEntries(diary);
        setWeekly(weeklySummaries);
        setAnswers(loadedAnswers);
        setEditAnswers(null);
        setDeleteStatus(undefined);
        setDone(Boolean(review?.done));
        setStatus(archivedPeriod && !review?.done ? 'error' : 'ready');
      }
      void load().catch(() => {
        if (active) setStatus('error');
      });
      return () => {
        active = false;
      };
    }, [archivedPeriod, cycle, start, end]),
  );

  async function write(operation: () => Promise<void>) {
    if (pendingWrite.current) return;
    setBusy(true);
    pendingWrite.current = operation();
    try {
      await pendingWrite.current;
    } finally {
      pendingWrite.current = null;
      setBusy(false);
    }
  }

  function save(complete: boolean) {
    if (pendingWrite.current) return;
    const draft = editAnswers ?? answers;
    if (complete && !draft.some((answer) => answer?.trim())) {
      Alert.alert('회고를 한 줄 이상 적어 주세요.');
      return;
    }
    void write(async () => {
      try {
        const db = await getDatabase();
        await db.runAsync(
          'INSERT OR REPLACE INTO reviews VALUES (?, ?, ?, ?)',
          cycle,
          start,
          JSON.stringify(draft),
          complete ? 1 : 0,
        );
        setAnswers(draft);
        setDone(complete);
        setEditAnswers(null);
        if (editAnswers === null) {
          Alert.alert(
            complete
              ? '회고를 완료했어요.'
              : cycle === 'month'
                ? '임시 저장했어요.'
                : '답변을 저장했어요.',
          );
        }
      } catch {
        Alert.alert('회고를 저장하지 못했어요. 다시 시도해 주세요.');
      }
    });
  }

  function remove() {
    if (!deleteStatus) return;
    void write(async () => {
      try {
        const db = await getDatabase();
        await db.runAsync(
          'DELETE FROM reviews WHERE cycle = ? AND period = ?',
          cycle,
          start,
        );
        setAnswers([]);
        setDone(false);
        setDeleteStatus(undefined);
        if (archivedPeriod) onClose();
      } catch {
        setDeleteStatus('error');
      }
    });
  }

  function changeAnswer(index: number, value: string) {
    if (pendingWrite.current) return;
    const update = editAnswers === null ? setAnswers : setEditAnswers;
    update((current: string[] | null) => {
      const next = [...(current ?? [])];
      next[index] = value;
      return next;
    });
  }

  const title = reviewTitle(cycle, start, end);
  const prompts =
    cycle === 'week'
      ? ['한 주를 돌아보며']
      : cycle === 'month'
        ? monthly.map((prompt, index) => `Q${index + 1}. ${prompt}`)
        : yearly;
  const hints =
    cycle === 'month'
      ? [
          '나의 ' + Number(start.slice(5, 7)) + '월은…',
          '사람, 장소, 경험, 사소한 일상 등',
          '그때 어떤 감정을 느꼈나요?',
          '생각, 습관, 관계, 일상의 변화',
          '현재 관심사나 고민을 남겨 보세요.',
          '새로운 한 달을 준비해 보세요.',
        ]
      : cycle === 'year'
        ? [
            '나의 ' + start.slice(0, 4) + '년은…',
            '오래도록 기억하고 싶은 순간',
            '크고 작은 선택을 돌아보세요.',
            '올해의 변화와 성장',
            '고마운 사람과 그 이유',
            '현재의 가치관과 삶의 우선순위',
            '수고한 자신에게 전하는 이야기',
            '이루고 싶은 것, 닮고 싶은 모습',
            '안녕, ' + (Number(start.slice(0, 4)) + 1) + '년의 나야.',
          ]
        : [];
  const draft = editAnswers ?? answers;
  const fields = prompts.map((prompt, index) => ({
    prompt,
    index,
    answered: Boolean(answers[index]?.trim()),
  }));
  const visibleFields = fields.filter((field) => field.answered);
  if (!reading) {
    visibleFields.push(...fields.filter((field) => !field.answered));
  }
  const context = cycle !== 'year' && (
    <View
      style={reviewStyles.context}
      onLayout={(event) => {
        diaryListY.current = event.nativeEvent.layout.y;
      }}
    >
      {contextBelow && (
        <Text style={styles.heading} accessibilityRole="header">
          관련 일기
        </Text>
      )}
      {entries.length === 0 && (
        <Text style={[styles.muted, reviewStyles.emptyEntries]}>
          이 기간의 일기가 없어요.
        </Text>
      )}
      {entries.map((entry) => (
        <View key={entry.date} style={styles.card}>
          <Text style={styles.muted}>{dateLabel(entry.date)}</Text>
          <Text style={styles.body}>{entry.body}</Text>
        </View>
      ))}
      {weekly.map((review) => (
        <View key={review.period} style={styles.card}>
          <Text style={styles.muted}>{dateLabel(review.period)} 주간 회고</Text>
          <Text style={styles.body}>{review.answer}</Text>
        </View>
      ))}
    </View>
  );
  return (
    <Page scrollRef={scroll}>
      <View style={reviewStyles.detailHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="회고 목록으로 돌아가기"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={onClose}
          style={({ pressed }) => [
            reviewStyles.back,
            (busy || pressed) && reviewStyles.pressed,
          ]}
        >
          <ChevronLeft color={color.ink} size={22} />
        </Pressable>
        <Text style={styles.heading} accessibilityRole="header">
          {reviewTitles[cycle]}
        </Text>
      </View>
      {cycle === 'week' && !archivedPeriod ? (
        <View style={reviewStyles.weekPeriod}>
          <View style={styles.row}>
            <Text style={[styles.muted, reviewStyles.period]}>{title}</Text>
            <View style={reviewStyles.weekControls}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="이전 주"
                accessibilityState={{ disabled: busy }}
                disabled={busy}
                onPress={() => {
                  setStatus('loading');
                  setWeek((value) => value + 1);
                }}
                style={({ pressed }) => [
                  reviewStyles.arrow,
                  (busy || pressed) && reviewStyles.pressed,
                ]}
              >
                <ChevronLeft color={color.ink} size={18} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="다음 주"
                accessibilityState={{ disabled: busy || week === 0 }}
                disabled={busy || week === 0}
                onPress={() => {
                  setStatus('loading');
                  setWeek((value) => value - 1);
                }}
                style={({ pressed }) => [
                  reviewStyles.arrow,
                  (busy || week === 0) && reviewStyles.disabled,
                  pressed && reviewStyles.pressed,
                ]}
              >
                <ChevronRight color={color.ink} size={18} />
              </Pressable>
            </View>
          </View>
          <Text style={styles.muted}>
            회고는 일기 목록 맨 아래에서 쓸 수 있어요.{'\n'}
            이번 주 회고는 다음 주 월요일부터 쓸 수 있어요.
          </Text>
          <View style={reviewStyles.divider} />
        </View>
      ) : cycle === 'month' ? (
        <View style={styles.row}>
          <Text style={[styles.muted, reviewStyles.period]}>{title}</Text>
          {status === 'ready' && entries.length > 0 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (diaryListY.current !== null) {
                  scroll.current?.scrollTo({
                    y: Math.max(0, diaryListY.current - 12),
                    animated: true,
                  });
                }
              }}
              style={({ pressed }) => [
                reviewStyles.diaryLink,
                pressed && reviewStyles.pressed,
              ]}
            >
              <Text style={styles.muted}>관련 일기 보기</Text>
              <ChevronDown color={color.muted} size={14} />
            </Pressable>
          )}
        </View>
      ) : (
        <Text style={styles.muted}>{title}</Text>
      )}
      {status === 'loading' && (
        <Text style={styles.muted}>회고를 불러오는 중이에요.</Text>
      )}
      {status === 'error' && (
        <Text style={styles.muted}>회고를 불러오지 못했어요.</Text>
      )}
      {status === 'ready' && (
        <>
          {!contextBelow && context}
          {done ? (
            <View style={styles.card}>
              <RecordCardHeader
                label={cycle === 'week' ? prompts[0] : title}
                record="회고"
                compact
                busy={busy}
                hideActions={!reading}
                onEdit={() => setEditAnswers(answers)}
                onDelete={() => setDeleteStatus('confirm')}
              />
              {visibleFields.map(({ prompt, index }) => (
                <View key={prompt} style={reviewStyles.answer}>
                  {cycle !== 'week' && (
                    <Text style={styles.muted}>{prompt}</Text>
                  )}
                  <TextInput
                    multiline
                    scrollEnabled={false}
                    accessibilityLabel={reading ? undefined : prompt}
                    value={draft[index] ?? ''}
                    editable={!reading && !busy}
                    placeholder={
                      hints[index] ?? '한 주를 돌아본 생각을 적어 보세요.'
                    }
                    placeholderTextColor={color.muted}
                    underlineColorAndroid="transparent"
                    style={reviewStyles.completedInput}
                    onChangeText={(value) => changeAnswer(index, value)}
                  />
                </View>
              ))}
            </View>
          ) : (
            prompts.map((prompt, index) => (
              <View key={prompt} style={{ gap: 10 }}>
                {cycle === 'year' && groups[index] && (
                  <Text style={styles.heading}>{groups[index]}</Text>
                )}
                <View style={styles.card}>
                  <Text style={styles.body}>{prompt}</Text>
                  <TextInput
                    multiline
                    accessibilityLabel={prompt}
                    value={draft[index] ?? ''}
                    editable={!busy}
                    placeholder={
                      hints[index] ?? '한 주를 돌아본 생각을 적어 보세요.'
                    }
                    placeholderTextColor={color.muted}
                    style={styles.input}
                    onChangeText={(value) => changeAnswer(index, value)}
                  />
                </View>
              </View>
            ))
          )}
          {!reading && (
            <View
              style={
                cycle === 'month' && !done
                  ? reviewStyles.monthActions
                  : [
                      reviewStyles.actions,
                      (cycle === 'week' || done) && reviewStyles.centerActions,
                    ]
              }
            >
              {done ? (
                <>
                  <Button
                    label="취소"
                    disabled={busy}
                    onPress={() => setEditAnswers(null)}
                  />
                  <Button
                    label="수정 저장"
                    primary
                    disabled={busy}
                    onPress={() => save(true)}
                  />
                </>
              ) : (
                <>
                  <Button
                    label={
                      cycle === 'week'
                        ? '회고 저장'
                        : cycle === 'month'
                          ? '임시 저장'
                          : '답변 저장'
                    }
                    primary={cycle === 'week'}
                    fullWidth={cycle === 'month'}
                    disabled={busy}
                    onPress={() => save(cycle === 'week')}
                  />
                  {cycle !== 'week' && (
                    <Button
                      label="회고 완료"
                      primary
                      fullWidth={cycle === 'month'}
                      disabled={busy}
                      onPress={() => save(true)}
                    />
                  )}
                </>
              )}
            </View>
          )}
          {cycle === 'month' && <View style={reviewStyles.contextDivider} />}
          {contextBelow && context}
          {reading && deleteStatus && (
            <Dialog
              title="회고를 삭제할까요?"
              message={
                deleteStatus === 'error'
                  ? '회고를 삭제하지 못했어요. 다시 시도해 주세요.'
                  : '삭제한 회고는 복구할 수 없어요.'
              }
              onClose={() => {
                if (!busy) setDeleteStatus(undefined);
              }}
            >
              <Button
                label="취소"
                disabled={busy}
                onPress={() => setDeleteStatus(undefined)}
              />
              <Button
                label={busy ? '삭제 중…' : '삭제'}
                primary
                disabled={busy}
                onPress={remove}
              />
            </Dialog>
          )}
        </>
      )}
    </Page>
  );
}

const reviewStyles = StyleSheet.create({
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: {
    marginLeft: -18,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekPeriod: { gap: 8 },
  divider: {
    alignSelf: 'center',
    width: 96,
    height: 1,
    marginVertical: 16,
    backgroundColor: color.muted,
    opacity: 0.3,
  },
  emptyEntries: { textAlign: 'center' },
  context: { gap: styles.content.gap },
  contextDivider: {
    height: 1,
    backgroundColor: color.line,
    marginTop: 12,
    marginBottom: 8,
  },
  diaryLink: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  period: { flexShrink: 1 },
  weekControls: { flexDirection: 'row' },
  arrow: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  monthActions: { gap: 10 },
  centerActions: { justifyContent: 'center' },
  answer: { gap: 4 },
  completedInput: {
    ...styles.body,
    padding: 0,
    textAlignVertical: 'top',
    // Align the native input's text with the diary card's Text baseline.
    top: -3,
  },
  disabled: { opacity: 0.3 },
  pressed: { opacity: 0.65 },
});
