import { ImagePlus, X } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { color, Text } from '../ui';
import { MAX_ENTRY_PHOTOS, photoSource, type EntryPhoto } from './entryPhotos';
import { pickEntryPhotos } from './pickEntryPhotos';

type Props = {
  photos: EntryPhoto[];
  busy: boolean;
  picking: boolean;
  onPickingChange: (picking: boolean) => void;
  onChange: (photos: EntryPhoto[]) => void;
};

export function JournalPhotoPicker({
  photos,
  busy,
  picking,
  onPickingChange,
  onChange,
}: Props) {
  const active = useRef(false);
  const opening = useRef(false);
  const remaining = MAX_ENTRY_PHOTOS - photos.length;
  const disabled = busy || picking;

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  async function addPhotos() {
    if (busy || opening.current || remaining < 1) return;
    opening.current = true;
    onPickingChange(true);
    Keyboard.dismiss();
    try {
      const picked = await pickEntryPhotos(remaining);
      if (active.current && picked.length) onChange([...photos, ...picked]);
    } catch {
      if (active.current) {
        Alert.alert('사진을 추가하지 못했어요. 다시 시도해 주세요.');
      }
    } finally {
      opening.current = false;
      if (active.current) onPickingChange(false);
    }
  }

  return (
    <View style={photoStyles.thumbnails}>
      {photos.map((photo, index) => (
        <View key={photo.id} style={photoStyles.tile}>
          <Image source={photoSource(photo)} style={photoStyles.image} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`사진 ${index + 1} 빼기`}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={() =>
              onChange(photos.filter((item) => item.id !== photo.id))
            }
            style={photoStyles.remove}
          >
            <View style={photoStyles.removeIcon}>
              <X color={color.ink} size={14} />
            </View>
          </Pressable>
        </View>
      ))}
      {remaining > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={picking ? '사진 불러오는 중' : '사진 추가'}
          accessibilityState={{ busy: picking, disabled }}
          accessibilityValue={{
            text: `${photos.length}장 첨부됨, 최대 ${MAX_ENTRY_PHOTOS}장`,
          }}
          disabled={disabled}
          onPress={addPhotos}
          style={tileStyle}
        >
          {picking ? (
            <ActivityIndicator color={color.muted} />
          ) : (
            <ImagePlus color={color.muted} size={23} strokeWidth={1.65} />
          )}
          <Text style={photoStyles.count}>
            {photos.length}/{MAX_ENTRY_PHOTOS}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const photoStyles = StyleSheet.create({
  thumbnails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  tile: {
    alignSelf: 'flex-start',
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: color.pale,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    overflow: 'hidden',
  },
  count: { color: color.muted, fontSize: 11, lineHeight: 14 },
  pressed: { opacity: 0.7 },
  image: { width: '100%', height: '100%' },
  remove: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 44,
    height: 44,
    padding: 4,
    alignItems: 'flex-end',
  },
  removeIcon: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: color.white,
  },
});

function tileStyle({ pressed }: { pressed: boolean }) {
  return [photoStyles.tile, pressed && photoStyles.pressed];
}
