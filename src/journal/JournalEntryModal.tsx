import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  View,
} from 'react-native';
import { dateLabel } from '../dates';
import { loadEntryPhotos, saveEntry, type Entry } from '../store';
import { Button, Page, styles, Text } from '../ui';
import { EntryEditor } from './EntryEditor';
import type { EntryPhoto } from './entryPhotos';
import { JournalPhotoGrid, JournalPhotoViewer } from './JournalPhotos';

type Props = {
  entry: Entry;
  onClose: () => void;
  onSaved: (entry: Entry) => void;
};

export function JournalEntryModal({ entry, onClose, onSaved }: Props) {
  const [photos, setPhotos] = useState<EntryPhoto[]>();
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [viewing, setViewing] = useState<EntryPhoto>();
  const [draft, setDraft] = useState<{ body: string; photos: EntryPhoto[] }>();
  const [saving, setSaving] = useState(false);
  const writing = useRef(false);

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
    if (writing.current) return;
    if (draft) {
      Keyboard.dismiss();
      setDraft(undefined);
    } else if (viewing) setViewing(undefined);
    else onClose();
  }

  async function save() {
    if (!draft || writing.current) return;
    const body = draft.body.trim();
    if (!body) {
      Alert.alert('일기 내용을 입력해 주세요.');
      return;
    }
    writing.current = true;
    setSaving(true);
    try {
      await saveEntry(entry.date, body, { photos: draft.photos });
      setPhotos(draft.photos);
      setDraft(undefined);
      onSaved({ ...entry, body });
      Keyboard.dismiss();
    } catch {
      Alert.alert('일기를 저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      writing.current = false;
      setSaving(false);
    }
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
        <KeyboardAvoidingView
          style={styles.safe}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Page modal>
            {!draft && (
              <View style={styles.row}>
                <Button label="닫기" onPress={close} />
                <Button
                  label="수정"
                  disabled={!photos}
                  onPress={() => {
                    if (photos) setDraft({ body: entry.body, photos });
                  }}
                />
              </View>
            )}
            <Text accessibilityRole="header" style={styles.heading}>
              {dateLabel(entry.date)}
            </Text>
            {draft ? (
              <EntryEditor
                body={draft.body}
                photos={draft.photos}
                busy={saving}
                onChange={(body) =>
                  setDraft((current) => current && { ...current, body })
                }
                onChangePhotos={(photos) =>
                  setDraft((current) => current && { ...current, photos })
                }
                onCancel={close}
                onSave={save}
              />
            ) : (
              <>
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
              </>
            )}
          </Page>
        </KeyboardAvoidingView>
      )}
    </Modal>
  );
}
