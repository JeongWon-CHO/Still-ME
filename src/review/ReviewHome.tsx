import { useIsFocused } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../AppHeader';
import { Cycle, reviewEnd, reviewPeriod } from '../dates';
import { loadCompletedReviews } from '../store';
import { Button, color, styles, Text, useTabContentBottomPadding } from '../ui';
import { reviewTitle, reviewTitles } from './labels';

const reviewArt = {
  week: `⠀⢀⣀⣀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀
⠀⢘⣦⣀⣀⡉⠉⠙⠒⠦⠤⣀⡀⠀⠀⠀⠀⠀⠀⠀⠐⢺⠒
⠀⢘⣦⣈⣓⡯⣍⡙⠒⠦⠤⣀⡉⠙⠒⠤⣄⡀
⠀⠘⢦⡈⠓⠯⣍⡙⠓⠶⠤⣄⡉⠙⠒⠤⣄⡉⠓⠦⣀
⠀⠀⠀⠈⠓⠦⣄⡉⠑⠲⠤⣄⡉⠙⠓⠶⣤⡭⣗⣦⣈⣳
⠀⠀⢀⠀⠀⠀⠀⠉⠑⠲⠤⣄⡈⠉⠓⠲⠤⠭⣗⣦⣈⣳
⠀⠐⢺⠒⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠓⠲⠤⠤⣄⣀⣈⣳`,
  month: `⠀⠀⠀⠀⢀⢀⢔⢔⠕⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡄
⠀⠀⠀⢔⢕⢕⢕⠅⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠏⠁
⠀⠀⢐⢕⢕⢕⢕⠅
⠀⠀⢑⢕⢕⢕⢕⢕⢄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀
⠀⠀⠀⢕⢕⢕⢕⢕⢕⢕⢄⢀⠀⠀⠀⠀⠀⠀⠀⠀⠒⡗⠂
⠀⠀⠀⠀⠑⠑⢕⢕⢕⢕⢕⢕⢕⢕⢕⢕⠕⠑⠁
⠀⠀⠀⠀⠀⠀⠀⠀⠁⠁⠁⠁⠁⠁⠁`,
  year: `⠀⠀⠀⠀⠀⠀⢸⢩⠭⢵⣦⣄⢀⣤⣶⠭⢭⢹
⠀⠀⠀⠀⠀⠀⠈⢾⣼⠉⠛⢿⣻⠟⠋⢹⣼⠎
⠀⠀⣠⠤⣶⢶⣶⠿⠿⠗⠀⠀⡄⠀⠐⠿⠿⢷⣶⢶⡦⢤⡀
⠀⠀⠳⠤⣷⣼⣶⣤⣤⣄⠀⠉⠏⠁⢀⣤⣤⣴⣾⣴⡧⠴⠃
⠀⠀⠀⠀⠀⠀⠀⣽⢿⠁⣀⣴⣲⣄⡀⢹⢿⡅
⠀⠀⠀⠀⠀⠀⢸⠸⠬⢽⡿⠟⠙⠿⣿⠭⠼⢸
⠀⠀⠀⠀⠀⠀⠈⠉⠉⠁⠀⠀⠀⠀⠀⠉⠉⠉`,
};
type ArchiveItem = {
  cycle: Cycle;
  period: string;
  end: string;
  preview?: string;
};

type Props = {
  today: Date;
  visible: boolean;
  onOpen: (cycle: Cycle, period?: string) => void;
};

export function ReviewHome({ today, visible, onOpen }: Props) {
  const [archive, setArchive] = useState<ArchiveItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [attempt, setAttempt] = useState(0);
  const paddingBottom = useTabContentBottomPadding();

  const focused = useIsFocused();
  useEffect(() => {
    if (!focused || !visible) return;
    let active = true;
    void loadCompletedReviews()
      .then((reviews) => {
        if (!active) return;
        const items = reviews.map(({ cycle, period, answers }) => ({
          cycle,
          period,
          end: reviewEnd(period, cycle),
          preview: (JSON.parse(answers) as (string | null)[])
            .find((answer) => answer?.trim())
            ?.trim(),
        }));
        items.sort(
          (a, b) =>
            b.end.localeCompare(a.end) || b.period.localeCompare(a.period),
        );
        setArchive(items);
        setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [focused, visible, attempt]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <FlatList
        data={archive}
        keyExtractor={({ cycle, period }) => cycle + ':' + period}
        contentContainerStyle={[
          styles.content,
          styles.tabContent,
          { paddingBottom },
        ]}
        ListHeaderComponent={
          <View style={homeStyles.header}>
            <AppHeader />
            <View style={homeStyles.shortcuts}>
              {(Object.keys(reviewTitles) as Cycle[])
                .filter((cycle) => reviewPeriod(today, cycle).available)
                .map((cycle) => (
                  <Pressable
                    key={cycle}
                    accessibilityRole="button"
                    accessibilityLabel={reviewTitles[cycle] + ' 열기'}
                    onPress={() => onOpen(cycle)}
                    style={({ pressed }) => [
                      styles.card,
                      homeStyles.shortcut,
                      pressed && homeStyles.pressed,
                    ]}
                  >
                    <View
                      pointerEvents="none"
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                      style={homeStyles.art}
                    >
                      <Text allowFontScaling={false} style={homeStyles.artText}>
                        {reviewArt[cycle]}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={[styles.heading, homeStyles.label]}>
                        {reviewTitles[cycle]}
                      </Text>
                      <ChevronRight color={color.muted} size={18} />
                    </View>
                  </Pressable>
                ))}
            </View>
            <Text style={styles.heading} accessibilityRole="header">
              지난 회고
            </Text>
          </View>
        }
        ListEmptyComponent={
          status === 'loading' ? (
            <Text style={styles.muted}>지난 회고를 불러오는 중이에요.</Text>
          ) : status === 'ready' ? (
            <Text style={styles.muted}>아직 완료한 회고가 없어요.</Text>
          ) : undefined
        }
        ListFooterComponent={
          status === 'error' ? (
            <Button
              label="지난 회고 다시 불러오기"
              onPress={() => {
                setStatus('loading');
                setAttempt((value) => value + 1);
              }}
            />
          ) : undefined
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpen(item.cycle, item.period)}
            style={({ pressed }) => [
              styles.card,
              pressed && homeStyles.pressed,
            ]}
          >
            <View style={styles.row}>
              <Text style={[styles.muted, homeStyles.label]}>
                {reviewTitles[item.cycle]} ·{' '}
                {reviewTitle(item.cycle, item.period, item.end)}
              </Text>
              <ChevronRight color={color.muted} size={16} />
            </View>
            {item.preview && (
              <Text numberOfLines={2} style={styles.body}>
                {item.preview}
              </Text>
            )}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const homeStyles = StyleSheet.create({
  header: { gap: 18 },
  shortcuts: { gap: 8 },
  shortcut: { minHeight: 152, overflow: 'hidden' },
  art: {
    position: 'absolute',
    top: 0,
    right: 22,
    bottom: 0,
    justifyContent: 'center',
  },
  artText: {
    color: color.ink,
    opacity: 0.36,
    fontSize: 16,
    lineHeight: 21,
    includeFontPadding: false,
    transformOrigin: 'right center',
    transform: [{ scaleX: 0.89 }, { scaleY: 1.17 }],
  },
  label: { flexShrink: 1 },
  pressed: { opacity: 0.65 },
});
