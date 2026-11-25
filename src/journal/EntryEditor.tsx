import { Platform, StyleSheet, View } from 'react-native';
import { Button, color, styles, TextInput } from '../ui';

type Props = {
  body: string;
  busy: boolean;
  placeholder?: string;
  onChange: (body: string) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function EntryEditor({
  body,
  busy,
  placeholder,
  onChange,
  onCancel,
  onSave,
}: Props) {
  return (
    <>
      <TextInput
        multiline
        value={body}
        onChangeText={onChange}
        accessibilityLabel={placeholder ? '일기 본문' : '일기 수정'}
        placeholder={placeholder}
        placeholderTextColor={color.muted}
        editable={!busy}
        style={[styles.input, editorStyles.input]}
      />
      <View style={[styles.row, editorStyles.actions]}>
        <Button label="취소" disabled={busy} onPress={onCancel} />
        <Button
          label={busy ? '저장 중…' : '저장'}
          primary
          disabled={busy}
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
