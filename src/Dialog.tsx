import type { ReactNode } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, Text } from './ui';

type Props = {
  title: string;
  message?: string;
  onClose: () => void;
  children: ReactNode;
};

export function Dialog({ title, message, onClose, children }: Props) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={dialogStyles.overlay}>
        <View
          accessibilityViewIsModal
          style={[styles.card, dialogStyles.panel]}
        >
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={dialogStyles.content}
          >
            <Text style={styles.heading} accessibilityRole="header">
              {title}
            </Text>
            {message && <Text style={styles.body}>{message}</Text>}
            <View style={dialogStyles.actions}>{children}</View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const dialogStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(41, 37, 36, 0.45)',
  },
  panel: { width: '100%', maxWidth: 420, maxHeight: '100%' },
  content: { gap: 12 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
