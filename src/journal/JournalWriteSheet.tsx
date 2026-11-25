import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { dateLabel } from '../dates';
import { Button, color, Page, styles, Text } from '../ui';
import { EntryEditor } from './EntryEditor';
import { emptyPhotos, type EntryPhoto } from './entryPhotos';

type Props = {
  date: string;
  busy: boolean;
  onClose: () => void;
  onSave: (body: string, photos: EntryPhoto[]) => Promise<boolean>;
};

export function JournalWriteSheet({ date, busy, onClose, onSave }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState(emptyPhotos);
  const [height, setHeight] = useState(0);
  const [progress] = useState(() => new Animated.Value(0));
  const reduceMotion = useRef(false);
  const closing = useRef(false);
  const insets = useSafeAreaInsets();
  const bottomInset = initialWindowMetrics?.insets.bottom ?? insets.bottom;
  const { height: windowHeight, fontScale } = useWindowDimensions();
  const screenHeight = height || windowHeight;
  const previewHeight = Math.min(
    screenHeight,
    162 + bottomInset + Math.max(0, fontScale - 1) * 100,
  );
  const cornerRadius = progress.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [24, 24, 0],
  });

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduceMotion.current = enabled;
    });
    return () => progress.stopAnimation();
  }, [progress]);

  function animate(
    toValue: number,
    onFinish?: (result: { finished: boolean }) => void,
  ) {
    Animated.timing(progress, {
      toValue,
      duration: reduceMotion.current ? 0 : 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(onFinish);
  }

  function dismiss() {
    if (closing.current) return;
    closing.current = true;
    Keyboard.dismiss();
    animate(0, ({ finished }) => {
      if (finished) onClose();
    });
  }

  function cancel() {
    if (!busy) dismiss();
  }

  function expand() {
    if (closing.current) return;
    setExpanded(true);
    animate(2);
  }

  return (
    <Modal
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onShow={() => animate(1)}
      onRequestClose={cancel}
    >
      <View
        style={sheetStyles.viewport}
        onLayout={({ nativeEvent }) => setHeight(nativeEvent.layout.height)}
      >
        <Animated.View
          pointerEvents={expanded ? 'none' : 'auto'}
          style={[
            sheetStyles.backdrop,
            {
              opacity: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.38],
                extrapolate: 'clamp',
              }),
            },
          ]}
        >
          <Pressable
            accessible={false}
            style={StyleSheet.absoluteFill}
            onPress={cancel}
          />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          onAccessibilityEscape={cancel}
          style={[
            sheetStyles.panel,
            {
              borderTopLeftRadius: cornerRadius,
              borderTopRightRadius: cornerRadius,
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: [
                      screenHeight,
                      screenHeight - previewHeight,
                      0,
                    ],
                  }),
                },
              ],
            },
          ]}
        >
          {expanded ? (
            <KeyboardAvoidingView
              style={styles.safe}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <Page modal>
                <View style={styles.card}>
                  <Text style={styles.heading} accessibilityRole="header">
                    일기 쓰기
                  </Text>
                  <Text style={styles.muted}>{dateLabel(date)}</Text>
                  <EntryEditor
                    body={body}
                    photos={photos}
                    busy={busy}
                    placeholder="그날의 하루를 기록해 보세요"
                    onChange={setBody}
                    onChangePhotos={setPhotos}
                    onCancel={cancel}
                    onSave={async () => {
                      if (!closing.current && (await onSave(body, photos))) {
                        dismiss();
                      }
                    }}
                  />
                </View>
              </Page>
            </KeyboardAvoidingView>
          ) : (
            <ScrollView
              bounces={false}
              style={{ maxHeight: previewHeight }}
              contentContainerStyle={[
                styles.content,
                sheetStyles.preview,
                { paddingBottom: Math.max(16, bottomInset) },
              ]}
            >
              <Text style={styles.heading} accessibilityRole="header">
                아직 일기가 없어요.
              </Text>
              <Text style={styles.muted}>{dateLabel(date)}</Text>
              <View style={[styles.row, sheetStyles.actions]}>
                <Button label="닫기" onPress={cancel} />
                <Button label="일기 쓰기" primary onPress={expand} />
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  viewport: { flex: 1, overflow: 'hidden' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: color.ink },
  panel: {
    ...StyleSheet.absoluteFill,
    backgroundColor: color.canvas,
    overflow: 'hidden',
  },
  preview: { paddingTop: 24, gap: 12 },
  actions: { flexWrap: 'wrap' },
});
