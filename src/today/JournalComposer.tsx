import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import type { EntryPhoto } from '../journal/entryPhotos';
import { JournalPhotoPicker } from '../journal/JournalPhotoPicker';
import { Button, color, styles, Text, TextInput } from '../ui';

type Props = {
  body: string;
  photos: EntryPhoto[];
  saving: boolean;
  message: string;
  onChangeBody: (body: string) => void;
  onChangePhotos: (photos: EntryPhoto[]) => void;
  onSave: () => void;
  onCancel?: () => void;
};

export function JournalComposer({
  body,
  photos,
  saving,
  message,
  onChangeBody,
  onChangePhotos,
  onSave,
  onCancel,
}: Props) {
  const [picking, setPicking] = useState(false);
  const busy = saving || picking;

  return (
    <>
      <JournalPhotoPicker
        photos={photos}
        busy={saving}
        picking={picking}
        onPickingChange={setPicking}
        onChange={onChangePhotos}
      />
      <TextInput
        multiline
        accessibilityLabel="오늘 일기 본문"
        placeholder="오늘 하루를 기록해 보세요"
        placeholderTextColor={color.muted}
        value={body}
        style={[styles.input, todayStyles.input]}
        editable={!busy}
        onChangeText={onChangeBody}
      />
      <View style={[styles.row, { flexWrap: 'wrap' }]}>
        <Text
          style={[styles.muted, { flexShrink: 1 }]}
          accessibilityLiveRegion="polite"
        >
          {message}
        </Text>
        <View style={todayStyles.actions}>
          {onCancel && (
            <Button label="취소" disabled={busy} onPress={onCancel} />
          )}
          <Button
            label={saving ? '저장 중' : onCancel ? '변경 사항 저장' : '저장'}
            primary
            disabled={busy}
            onPress={onSave}
          />
        </View>
      </View>
    </>
  );
}

const todayStyles = StyleSheet.create({
  // iOS places the first line of a multiline input below a matching Text line.
  input: { minHeight: 136, marginTop: Platform.OS === 'ios' ? -3 : 0 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flexShrink: 1,
    justifyContent: 'flex-end',
    gap: 8,
  },
});
