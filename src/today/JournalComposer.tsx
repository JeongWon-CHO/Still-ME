import { StyleSheet, View } from 'react-native';
import { Button, color, styles, Text, TextInput } from '../ui';

type Props = {
  body: string;
  saving: boolean;
  message: string;
  onChangeBody: (body: string) => void;
  onSave: () => void;
};

export function JournalComposer({
  body,
  saving,
  message,
  onChangeBody,
  onSave,
}: Props) {
  return (
    <View style={[styles.card, todayStyles.composer]}>
      <Text accessibilityRole="header" style={styles.heading}>
        오늘의 일기
      </Text>
      <TextInput
        multiline
        accessibilityLabel="오늘 일기 본문"
        placeholder="오늘 하루를 기록해 보세요"
        placeholderTextColor={color.muted}
        value={body}
        style={[styles.input, todayStyles.input]}
        editable={!saving}
        onChangeText={onChangeBody}
      />
      <View style={[styles.row, { flexWrap: 'wrap' }]}>
        <Text
          style={[styles.muted, { flexShrink: 1 }]}
          accessibilityLiveRegion="polite"
        >
          {message}
        </Text>
        <Button
          label={saving ? '저장 중' : '저장'}
          primary
          disabled={saving}
          onPress={onSave}
        />
      </View>
    </View>
  );
}

const todayStyles = StyleSheet.create({
  composer: { borderRadius: 16, gap: 14 },
  input: { minHeight: 136 },
});
