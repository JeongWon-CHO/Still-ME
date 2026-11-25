import { Pencil, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { color, styles, Text } from '../ui';

type Props = {
  label: string;
  heading?: boolean;
  busy: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function JournalCardHeader({
  label,
  heading = false,
  busy,
  onEdit,
  onDelete,
}: Props) {
  return (
    <View style={[styles.row, headerStyles.row]}>
      <Text
        accessibilityRole={heading ? 'header' : undefined}
        style={[heading ? styles.heading : styles.muted, headerStyles.label]}
      >
        {label}
      </Text>
      {onEdit && onDelete && (
        <View style={headerStyles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="일기 수정"
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={onEdit}
            style={iconActionStyle}
          >
            <Pencil color={color.muted} size={18} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="일기 삭제"
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={onDelete}
            style={iconActionStyle}
          >
            <Trash2 color={color.muted} size={18} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  row: { minHeight: 44 },
  label: { flexShrink: 1 },
  actions: { flexDirection: 'row' },
  action: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  pressed: { backgroundColor: color.pale },
});

function iconActionStyle({ pressed }: { pressed: boolean }) {
  return [headerStyles.action, pressed && headerStyles.pressed];
}
