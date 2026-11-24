import { useFocusEffect } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { AppHeader } from '../src/AppHeader';
import {
  Cycle,
  dateLabel,
  dayKey,
  fromKey,
  offsetDay,
  reviewPeriod,
} from '../src/dates';
import { Entry, getDatabase, loadEntriesInRange, Review } from '../src/store';
import { Button, color, Page, styles, Text, TextInput } from '../src/ui';

const titles = { week: '주간 회고', month: '월간 회고', year: '연간 회고' };
const reviewArt = {
  week: `⠀⢀⣀⣀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀
⠀⢘⣦⣀⣀⡉⠉⠙⠒⠦⠤⣀⡀⠀⠀⠀⠀⠀⠀⠀⠐⢺⠒
⠀⢘⣦⣈⣓⡯⣍⡙⠒⠦⠤⣀⡉⠙⠒⠤⣄⡀
⠀⠘⢦⡈⠓⠯⣍⡙⠓⠶⠤⣄⡉⠙⠒⠤⣄⡉⠓⠦⣀
⠀⠀⠀⠈⠓⠦⣄⡉⠑⠲⠤⣄⡉⠙⠓⠶⣤⡭⣗⣦⣈⣳
⠀⠀⢀⠀⠀⠀⠀⠉⠑⠲⠤⣄⡈⠉⠓⠲⠤⠭⣗⣦⣈⣳
⠀⠐⢺⠒⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠓⠲⠤⠤⣄⣀⣈⣳
`,
  month: `
⠀⠀⠀⠀⢀⢀⢔⢔⠕⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡄
⠀⠀⠀⢔⢕⢕⢕⠅⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠏⠁
⠀⠀⢐⢕⢕⢕⢕⠅
⠀⠀⢑⢕⢕⢕⢕⢕⢄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀
⠀⠀⠀⢕⢕⢕⢕⢕⢕⢕⢄⢀⠀⠀⠀⠀⠀⠀⠀⠀⠒⡗⠂
⠀⠀⠀⠀⠑⠑⢕⢕⢕⢕⢕⢕⢕⢕⢕⢕⠕⠑⠁
⠀⠀⠀⠀⠀⠀⠀⠀⠁⠁⠁⠁⠁⠁⠁`,
  year: `
⠀⠀⠀⠀⠀⠀⢸⢩⠭⢵⣦⣄⢀⣤⣶⠭⢭⢹
⠀⠀⠀⠀⠀⠀⠈⢾⣼⠉⠛⢿⣻⠟⠋⢹⣼⠎
⠀⠀⣠⠤⣶⢶⣶⠿⠿⠗⠀⠀⡄⠀⠐⠿⠿⢷⣶⢶⡦⢤⡀
⠀⠀⠳⠤⣷⣼⣶⣤⣤⣄⠀⠉⠏⠁⢀⣤⣤⣴⣾⣴⡧⠴⠃
⠀⠀⠀⠀⠀⠀⠀⣽⢿⠁⣀⣴⣲⣄⡀⢹⢿⡅
⠀⠀⠀⠀⠀⠀⢸⠸⠬⢽⡿⠟⠙⠿⣿⠭⠼⢸
⠀⠀⠀⠀⠀⠀⠈⠉⠉⠁⠀⠀⠀⠀⠀⠉⠉⠉`,
};
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
  const [cycle, setCycle] = useState<Cycle>();
  const [week, setWeek] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [weekly, setWeekly] = useState<
    { period: string; answer: string | undefined }[]
  >([]);
  const [done, setDone] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [busy, setBusy] = useState(false);

  const period = reviewPeriod(
    cycle === 'week' ? offsetDay(today, -7 * week) : today,
    cycle ?? 'week',
  );
  const { start, end } = period;
  useFocusEffect(
    useCallback(() => {
      setToday(new Date());
    }, []),
  );
  useFocusEffect(
    useCallback(() => {
      if (!cycle) return;
      let active = true;
      setStatus('loading');
      async function load() {
        const db = await getDatabase();
        const [diary, review, weeks] = await Promise.all([
          cycle === 'year' ? [] : loadEntriesInRange(start, end),
          db.getFirstAsync<Review>(
            'SELECT * FROM reviews WHERE cycle = ? AND period = ?',
            cycle!,
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
        setDone(Boolean(review?.done));
        setStatus('ready');
      }
      void load().catch(() => {
        if (active) setStatus('error');
      });
      return () => {
        active = false;
      };
    }, [cycle, start, end]),
  );

  async function save(complete: boolean) {
    if (!cycle || busy) return;
    if (complete && !answers.some((answer) => answer?.trim())) {
      Alert.alert('회고를 한 줄 이상 적어 주세요.');
      return;
    }
    setBusy(true);
    try {
      const db = await getDatabase();
      await db.runAsync(
        'INSERT OR REPLACE INTO reviews VALUES (?, ?, ?, ?)',
        cycle,
        start,
        JSON.stringify(answers),
        complete || done ? 1 : 0,
      );
      setDone(complete || done);
      Alert.alert(complete ? '회고를 완료했어요.' : '답변을 저장했어요.');
    } catch {
      Alert.alert('회고를 저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  function select(value: Cycle) {
    setStatus('loading');
    setWeek(0);
    setCycle(value);
  }
  if (!cycle)
    return (
      <Page>
        <AppHeader />
        {(Object.keys(titles) as Cycle[])
          .filter((item) => reviewPeriod(today, item).available)
          .map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={titles[item] + ' 열기'}
              onPress={() => select(item)}
              style={({ pressed }) => [
                styles.card,
                reviewStyles.listCard,
                pressed && reviewStyles.pressed,
              ]}
            >
              <View
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={reviewStyles.art}
              >
                <Text allowFontScaling={false} style={reviewStyles.artText}>
                  {reviewArt[item]}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.heading}>{titles[item]}</Text>
                <ChevronRight color={color.muted} size={20} />
              </View>
            </Pressable>
          ))}
      </Page>
    );

  const title =
    cycle === 'week'
      ? `${start.replaceAll('-', '.')}(월)~${dayKey(offsetDay(fromKey(end), -1)).replaceAll('-', '.')}(일)`
      : cycle === 'month'
        ? start.slice(0, 4) + '년 ' + Number(start.slice(5, 7)) + '월'
        : start.slice(0, 4) + '년';
  const prompts =
    cycle === 'week'
      ? ['한 주를 돌아보며']
      : cycle === 'month'
        ? monthly
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
  return (
    <Page>
      <View style={reviewStyles.detailHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="회고 목록으로 돌아가기"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={() => setCycle(undefined)}
          style={({ pressed }) => [
            reviewStyles.back,
            (busy || pressed) && reviewStyles.pressed,
          ]}
        >
          <ChevronLeft color={color.ink} size={22} />
        </Pressable>
        <Text style={styles.heading} accessibilityRole="header">
          {titles[cycle]}
        </Text>
      </View>
      {cycle === 'week' ? (
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
            지난 한 주를 돌아보는 공간이에요.{'\n'}
            이번 주 회고는 다음 주 월요일부터 쓸 수 있어요.
          </Text>
          <View style={reviewStyles.divider} />
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
          {cycle !== 'year' && entries.length === 0 && (
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
              <Text style={styles.muted}>
                {dateLabel(review.period)} 주간 회고
              </Text>
              <Text style={styles.body}>{review.answer}</Text>
            </View>
          ))}
          {prompts.map((prompt, index) => (
            <View key={prompt} style={{ gap: 10 }}>
              {cycle === 'year' && groups[index] && (
                <Text style={styles.heading}>{groups[index]}</Text>
              )}
              <View style={styles.card}>
                <Text style={styles.body}>{prompt}</Text>
                <TextInput
                  multiline
                  accessibilityLabel={prompt}
                  value={answers[index] ?? ''}
                  editable={!busy}
                  placeholder={
                    hints[index] ?? '한 주를 돌아본 생각을 적어 보세요.'
                  }
                  placeholderTextColor={color.muted}
                  style={styles.input}
                  onChangeText={(value) =>
                    setAnswers((current) => {
                      const next = [...current];
                      next[index] = value;
                      return next;
                    })
                  }
                />
              </View>
            </View>
          ))}
          {done && <Text style={styles.muted}>완료한 회고</Text>}
          <View
            style={[
              reviewStyles.actions,
              cycle === 'week' && reviewStyles.centerActions,
            ]}
          >
            <Button
              label={cycle === 'week' ? '회고 저장' : '답변 저장'}
              primary={cycle === 'week'}
              disabled={busy}
              onPress={() => void save(cycle === 'week')}
            />
            {cycle !== 'week' && (
              <Button
                label="회고 완료"
                primary
                disabled={busy}
                onPress={() => void save(true)}
              />
            )}
          </View>
        </>
      )}
    </Page>
  );
}

const reviewStyles = StyleSheet.create({
  listCard: { minHeight: 152, overflow: 'hidden' },
  art: {
    position: 'absolute',
    top: 0,
    right: 16,
    bottom: 0,
    justifyContent: 'center',
  },
  artText: {
    color: color.ink,
    opacity: 0.36,
    fontSize: 16,
    lineHeight: 17,
    transformOrigin: 'right center',
    transform: [{ scaleX: 0.89 }],
  },
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
  period: { flexShrink: 1 },
  weekControls: { flexDirection: 'row' },
  arrow: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  centerActions: { justifyContent: 'center' },
  disabled: { opacity: 0.3 },
  pressed: { opacity: 0.65 },
});
