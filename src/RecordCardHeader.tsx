import { Pencil, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { color, styles, Text } from './ui';

type Props = {
  label: string;
  record?: '일기' | '회고';
  heading?: boolean;
  compact?: boolean;
  busy: boolean;
  hideActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function RecordCardHeader({
  label,
  record = '일기',
  heading = false,
  compact = false,
  busy,
  hideActions = false,
  onEdit,
  onDelete,
}: Props) {
  const disabled = busy || hideActions;
  const title = (
    <Text
      accessibilityRole={heading ? 'header' : undefined}
      style={[
        heading ? styles.heading : styles.muted,
        headerStyles.label,
        compact && headerStyles.compactLabel,
      ]}
    >
      {label}
    </Text>
  );
  const actions = onEdit && onDelete && (
    <View
      accessibilityElementsHidden={hideActions}
      importantForAccessibility={hideActions ? 'no-hide-descendants' : 'auto'}
      style={[
        headerStyles.actions,
        compact && headerStyles.compactActions,
        hideActions && headerStyles.hidden,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={record + ' 수정'}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onEdit}
        style={iconActionStyle}
      >
        <Pencil color={color.muted} size={18} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={record + ' 삭제'}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onDelete}
        style={iconActionStyle}
      >
        <Trash2 color={color.muted} size={18} />
      </Pressable>
    </View>
  );
  return compact ? (
    <>
      {title}
      {actions}
    </>
  ) : (
    <View style={[styles.row, headerStyles.row]}>
      {title}
      {actions}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  row: { minHeight: 44 },
  label: { flexShrink: 1 },
  actions: { flexDirection: 'row' },
  compactLabel: { paddingRight: 96 },
  compactActions: { position: 'absolute', right: 18, top: 6 },
  hidden: { opacity: 0 },
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
