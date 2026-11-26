import { ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { color, styles, Text } from '../ui';

const YEARS_PER_PAGE = 12;
const monthNumbers = Array.from({ length: 12 }, (_, index) => index);

type Props = {
  year: number;
  index: number;
  onClose: () => void;
  onSelect: (year: number, index: number) => void;
};

export function JournalMonthPicker({ year, index, onClose, onSelect }: Props) {
  const [selectedYear, setSelectedYear] = useState(year);
  const [firstYear, setFirstYear] = useState<number>();
  const [height, setHeight] = useState(0);
  const [presented, setPresented] = useState(false);
  const [progress] = useState(() => new Animated.Value(0));
  const opened = useRef(false);
  const closing = useRef(false);
  const reduceMotion = useRef(false);
  const insets = useSafeAreaInsets();
  const bottom = initialWindowMetrics?.insets.bottom ?? insets.bottom;

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduceMotion.current = enabled;
    });
    return () => progress.stopAnimation();
  }, [progress]);

  useEffect(() => {
    if (!presented || !height || opened.current || closing.current) return;
    opened.current = true;
    Animated.timing(progress, {
      toValue: 1,
      duration: reduceMotion.current ? 0 : 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [height, presented, progress]);

  function dismiss(onFinish = onClose) {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(progress, {
      toValue: 0,
      duration: reduceMotion.current ? 0 : 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onFinish();
    });
  }

  return (
    <Modal
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onShow={() => setPresented(true)}
      onRequestClose={() => dismiss()}
    >
      <View style={pickerStyles.overlay}>
        <Animated.View
          pointerEvents="none"
          style={[pickerStyles.backdrop, { opacity: progress }]}
        />
        <Pressable
          accessible={false}
          style={StyleSheet.absoluteFill}
          onPress={() => dismiss()}
        />
        <Animated.View
          style={[
            pickerStyles.sheet,
            {
              opacity: height ? 1 : 0,
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height, 0],
                  }),
                },
              ],
            },
          ]}
          onLayout={({ nativeEvent }) => setHeight(nativeEvent.layout.height)}
          accessibilityViewIsModal
          onAccessibilityEscape={() => dismiss()}
        >
          <ScrollView
            bounces={false}
            contentContainerStyle={[
              pickerStyles.content,
              { paddingBottom: Math.max(bottom, 18) },
            ]}
          >
            {firstYear === undefined ? (
              <>
                <View style={[styles.row, pickerStyles.toolbar]}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${selectedYear}년, 연도 선택`}
                    onPress={() =>
                      setFirstYear(
                        Math.floor(selectedYear / YEARS_PER_PAGE) *
                          YEARS_PER_PAGE,
                      )
                    }
                    style={[pickerStyles.control, pickerStyles.yearButton]}
                  >
                    <Text style={styles.heading}>{selectedYear}년</Text>
                    <ChevronDown size={16} color={color.muted} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="닫기"
                    onPress={() => dismiss()}
                    style={pickerStyles.control}
                  >
                    <X size={20} color={color.ink} />
                  </Pressable>
                </View>
                <View style={pickerStyles.grid}>
                  {monthNumbers.map((month) => (
                    <PickerTile
                      key={month}
                      label={`${month + 1}월`}
                      selected={selectedYear === year && month === index}
                      onPress={() =>
                        dismiss(() => onSelect(selectedYear, month))
                      }
                    />
                  ))}
                </View>
              </>
            ) : (
              <>
                <View style={styles.row}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="이전 연도 범위"
                    style={pickerStyles.control}
                    onPress={() => setFirstYear(firstYear - YEARS_PER_PAGE)}
                  >
                    <ChevronLeft size={20} color={color.ink} />
                  </Pressable>
                  <Text accessibilityRole="header" style={styles.body}>
                    {firstYear}–{firstYear + YEARS_PER_PAGE - 1}년
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="다음 연도 범위"
                    style={pickerStyles.control}
                    onPress={() => setFirstYear(firstYear + YEARS_PER_PAGE)}
                  >
                    <ChevronRight size={20} color={color.ink} />
                  </Pressable>
                </View>
                <View style={pickerStyles.grid}>
                  {monthNumbers.map((offset) => {
                    const option = firstYear + offset;
                    return (
                      <PickerTile
                        key={option}
                        label={`${option}년`}
                        selected={option === selectedYear}
                        onPress={() => {
                          setSelectedYear(option);
                          setFirstYear(undefined);
                        }}
                      />
                    );
                  })}
                </View>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function PickerTile({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <View style={pickerStyles.cell}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onPress}
        style={({ pressed }) => [
          pickerStyles.control,
          pickerStyles.tile,
          (selected || pressed) && pickerStyles.selected,
        ]}
      >
        <Text style={styles.body}>{label}</Text>
      </Pressable>
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(41, 37, 36, 0.38)',
  },
  sheet: {
    maxWidth: 620,
    maxHeight: '90%',
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: color.white,
    overflow: 'hidden',
  },
  content: { paddingTop: 16, paddingHorizontal: 18, gap: 12 },
  toolbar: { flexWrap: 'wrap' },
  control: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  yearButton: { flexDirection: 'row', gap: 6, paddingHorizontal: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '25%', padding: 3 },
  tile: { backgroundColor: color.canvas },
  selected: { backgroundColor: color.line },
});
