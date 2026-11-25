import { Modal } from 'react-native';
import { dateLabel } from '../dates';
import type { Entry } from '../store';
import { Button, Page, styles, Text } from '../ui';

type Props = {
  entry: Entry;
  onClose: () => void;
};

export function JournalEntryModal({ entry, onClose }: Props) {
  return (
    <Modal
      visible
      presentationStyle="fullScreen"
      animationType="slide"
      onRequestClose={onClose}
    >
      <Page modal>
        <Button label="닫기" onPress={onClose} />
        <Text accessibilityRole="header" style={styles.heading}>
          {dateLabel(entry.date)}
        </Text>
        <Text style={styles.body}>{entry.body}</Text>
      </Page>
    </Modal>
  );
}
