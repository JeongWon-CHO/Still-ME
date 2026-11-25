import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Button, color, styles, TextInput } from '../ui';
import type { EntryPhoto } from './entryPhotos';
import { JournalPhotoPicker } from './JournalPhotoPicker';

type Props = {
  body: string;
  photos: EntryPhoto[];
  busy: boolean;
  placeholder?: string;
  onChange: (body: string) => void;
  onChangePhotos: (photos: EntryPhoto[]) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function EntryEditor({
  body,
  photos,
  busy,
  placeholder,
  onChange,
  onChangePhotos,
  onCancel,
  onSave,
}: Props) {
  const [picking, setPicking] = useState(false);
  const disabled = busy || picking;

  return (
    <>
      <JournalPhotoPicker
        photos={photos}
        busy={busy}
        picking={picking}
        onPickingChange={setPicking}
        onChange={onChangePhotos}
      />
      <TextInput
        multiline
        value={body}
        onChangeText={onChange}
        accessibilityLabel={placeholder ? '일기 본문' : '일기 수정'}
        placeholder={placeholder}
        placeholderTextColor={color.muted}
        editable={!disabled}
        style={[styles.input, editorStyles.input]}
      />
      <View style={[styles.row, editorStyles.actions]}>
        <Button label="취소" disabled={disabled} onPress={onCancel} />
        <Button
          label={busy ? '저장 중…' : '저장'}
          primary
          disabled={disabled}
          onPress={onSave}
        />
      </View>
    </>
  );
}

const editorStyles = StyleSheet.create({
  // iOS places the first line of a multiline input below a matching Text line.
  input: { marginTop: Platform.OS === 'ios' ? -3 : 0 },
  actions: { flexWrap: 'wrap', justifyContent: 'flex-end' },
});
