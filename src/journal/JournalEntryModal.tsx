import { useEffect, useState } from 'react';
import { Modal } from 'react-native';
import { dateLabel } from '../dates';
import { loadEntryPhotos, type Entry } from '../store';
import { Button, Page, styles, Text } from '../ui';
import type { EntryPhoto } from './entryPhotos';
import { JournalPhotoGrid, JournalPhotoViewer } from './JournalPhotos';

type Props = {
  entry: Entry;
  onClose: () => void;
};

export function JournalEntryModal({ entry, onClose }: Props) {
  const [photos, setPhotos] = useState<EntryPhoto[]>();
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [viewing, setViewing] = useState<EntryPhoto>();

  useEffect(() => {
    let active = true;
    loadEntryPhotos(entry.date).then(
      (result) => {
        if (active) setPhotos(result);
      },
      () => {
        if (active) setError(true);
      },
    );
    return () => {
      active = false;
    };
  }, [entry.date, retry]);

  function close() {
    if (viewing) setViewing(undefined);
    else onClose();
  }

  return (
    <Modal
      visible
      presentationStyle="fullScreen"
      animationType="slide"
      onRequestClose={close}
    >
      {viewing ? (
        <JournalPhotoViewer photo={viewing} onClose={close} />
      ) : (
        <Page modal>
          <Button label="닫기" onPress={close} />
          <Text accessibilityRole="header" style={styles.heading}>
            {dateLabel(entry.date)}
          </Text>
          {error ? (
            <Button
              label="사진 다시 불러오기"
              onPress={() => {
                setError(false);
                setRetry((count) => count + 1);
              }}
            />
          ) : !photos ? (
            <Text style={styles.muted}>사진을 불러오는 중이에요.</Text>
          ) : (
            <JournalPhotoGrid photos={photos} onOpen={setViewing} />
          )}
          <Text style={styles.body}>{entry.body}</Text>
        </Page>
      )}
    </Modal>
  );
}
