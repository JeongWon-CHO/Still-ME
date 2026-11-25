import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
} from 'react-native-gesture-handler';
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Button, color, styles } from '../ui';
import { photoSource, type EntryPhoto } from './entryPhotos';

const MAX_ZOOM = 4;
const VIEWER_PADDING = 16;

export function JournalPhotoGrid({
  photos,
  onOpen,
}: {
  photos: EntryPhoto[];
  onOpen: (photo: EntryPhoto) => void;
}) {
  if (!photos.length) return null;

  return (
    <View style={photoStyles.grid}>
      {photos.map((photo, index) => (
        <Pressable
          key={photo.id}
          accessibilityRole="button"
          accessibilityLabel={`사진 ${index + 1} 크게 보기`}
          onPress={() => onOpen(photo)}
          style={[
            photoStyles.tile,
            photos.length === 1 && {
              aspectRatio: Math.max(1, photo.width / photo.height),
            },
          ]}
        >
          <Image source={photoSource(photo)} style={photoStyles.image} />
        </Pressable>
      ))}
    </View>
  );
}

export function JournalPhotoViewer({
  photo,
  onClose,
}: {
  photo: EntryPhoto;
  onClose: () => void;
}) {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const insets = useSafeAreaInsets();
  const transform = useSharedValue({ scale: 1, x: 0, y: 0 });
  const pinchStart = useSharedValue({ scale: 1, x: 0, y: 0 });
  const pinching = useSharedValue(false);
  const { width, height } = viewport;
  const verticalInset = Math.min(insets.top + 60, height * 0.2);
  const fit = Math.max(
    0,
    Math.min(
      (width - VIEWER_PADDING * 2) / photo.width,
      (height - verticalInset * 2) / photo.height,
    ),
  );
  const imageWidth = photo.width * fit;
  const imageHeight = photo.height * fit;

  function positionImage(scale: number, x: number, y: number) {
    'worklet';
    const limitX = Math.max(0, (imageWidth * scale - width) / 2);
    const limitY = Math.max(0, (imageHeight * scale - height) / 2);
    transform.set({
      scale,
      x: clamp(x, -limitX, limitX),
      y: clamp(y, -limitY, limitY),
    });
  }

  const pinch = usePinchGesture({
    onActivate: ({ focalX, focalY }) => {
      const current = transform.get();
      pinching.set(true);
      pinchStart.set({
        scale: current.scale,
        x: (focalX - width / 2 - current.x) / current.scale,
        y: (focalY - height / 2 - current.y) / current.scale,
      });
    },
    onUpdate: ({ scale, focalX, focalY }) => {
      const start = pinchStart.get();
      const zoom = clamp(start.scale * scale, 1, MAX_ZOOM);
      positionImage(
        zoom,
        focalX - width / 2 - start.x * zoom,
        focalY - height / 2 - start.y * zoom,
      );
    },
    onFinalize: () => pinching.set(false),
  });
  const pan = usePanGesture({
    maxPointers: 1,
    onUpdate: ({ changeX, changeY, numberOfPointers }) => {
      if (pinching.get() || numberOfPointers !== 1) return;
      const current = transform.get();
      positionImage(current.scale, current.x + changeX, current.y + changeY);
    },
  });
  const gestures = useSimultaneousGestures(pinch, pan);
  const animatedStyle = useAnimatedStyle(() => {
    const { scale, x, y } = transform.get();
    return { transform: [{ translateX: x }, { translateY: y }, { scale }] };
  });

  return (
    <GestureHandlerRootView style={styles.safe}>
      <GestureDetector gesture={gestures}>
        <View
          style={photoStyles.viewer}
          onLayout={({ nativeEvent }) => setViewport(nativeEvent.layout)}
        >
          {fit > 0 && (
            <Animated.Image
              accessible
              accessibilityLabel="첨부 사진"
              accessibilityRole="adjustable"
              accessibilityActions={[
                { name: 'increment', label: '확대' },
                { name: 'decrement', label: '축소' },
              ]}
              onAccessibilityAction={({ nativeEvent }) => {
                const step =
                  nativeEvent.actionName === 'increment' ? 0.5 : -0.5;
                const scale = clamp(transform.get().scale + step, 1, MAX_ZOOM);
                positionImage(scale, 0, 0);
              }}
              source={photoSource(photo)}
              style={[
                { width: imageWidth, height: imageHeight },
                animatedStyle,
              ]}
              resizeMode="contain"
            />
          )}
        </View>
      </GestureDetector>
      <SafeAreaView
        edges={['top', 'left', 'right']}
        pointerEvents="box-none"
        style={photoStyles.viewerControls}
      >
        <View style={photoStyles.close}>
          <Button label="사진 닫기" onPress={onClose} />
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const photoStyles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 8 },
  tile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: color.pale,
  },
  image: { width: '100%', height: '100%' },
  viewer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  viewerControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: VIEWER_PADDING,
  },
  close: {
    alignSelf: 'flex-start',
    borderRadius: 30,
    backgroundColor: color.canvas,
  },
});
