import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Dialog } from '../src/Dialog';
import type { EntryPhoto } from '../src/journal/entryPhotos';
import { JournalEntryModal } from '../src/journal/JournalEntryModal';
import {
  JournalPhotoGrid,
  JournalPhotoViewer,
} from '../src/journal/JournalPhotos';
import { RecordCardHeader } from '../src/RecordCardHeader';
import type { Entry } from '../src/store';
import { JournalComposer } from '../src/today/JournalComposer';
import { JournalHistory } from '../src/today/JournalHistory';
import { TodayHeader } from '../src/today/TodayHeader';
import { useToday } from '../src/today/useToday';
import { Button, Page, styles, Text } from '../src/ui';

export default function Today() {
  const today = useToday();
  const [selectedEntry, setSelectedEntry] = useState<Entry>();
  const [viewingPhoto, setViewingPhoto] = useState<EntryPhoto>();
  const [deleteDate, setDeleteDate] = useState<string>();
  const [deleteError, setDeleteError] = useState(false);
  const savedEntry = today.editing ? null : today.entry;

  async function confirmDelete() {
    if (await today.remove()) {
      setDeleteDate(undefined);
    } else {
      setDeleteError(true);
    }
  }

  return (
    <Page>
      <TodayHeader
        date={today.date}
        cycle={today.cycle}
        disabled={today.status !== 'ready'}
        onSelectCycle={today.selectCycle}
      />
      {today.status === 'loading' && (
        <Text style={styles.muted}>일기를 불러오는 중이에요.</Text>
      )}
      {today.status === 'error' && (
        <View style={styles.card}>
          <Text style={styles.body}>일기 저장소를 열지 못했어요.</Text>
          <Button label="다시 시도" onPress={today.retryToday} />
        </View>
      )}
      {today.status === 'ready' && (
        <>
          <View style={[styles.card, todayStyles.journalCard]}>
            <RecordCardHeader
              label={today.editing ? '일기 수정' : '오늘의 일기'}
              heading
              busy={today.busy}
              onEdit={savedEntry ? today.edit : undefined}
              onDelete={
                savedEntry
                  ? () => {
                      setDeleteError(false);
                      setDeleteDate(today.date);
                    }
                  : undefined
              }
            />
            {savedEntry ? (
              <>
                <JournalPhotoGrid
                  photos={savedEntry.photos}
                  onOpen={setViewingPhoto}
                />
                <Text style={styles.body}>{savedEntry.body}</Text>
              </>
            ) : (
              <JournalComposer
                key={today.date}
                body={today.body}
                photos={today.draftPhotos}
                saving={today.busy}
                message={today.message}
                onChangeBody={today.changeBody}
                onChangePhotos={today.changePhotos}
                onSave={today.save}
                onCancel={today.editing ? today.cancelEdit : undefined}
              />
            )}
          </View>
          <JournalHistory
            past={today.past}
            pastStatus={today.pastStatus}
            limit={today.limit}
            onRetry={today.retryPast}
            onLoadMore={today.loadMore}
            onOpenEntry={setSelectedEntry}
          />
        </>
      )}
      {today.entry && deleteDate === today.date && (
        <Dialog
          title="일기를 삭제할까요?"
          message={
            deleteError
              ? '일기를 삭제하지 못했어요. 다시 시도해 주세요.'
              : '삭제한 일기는 복구할 수 없어요.'
          }
          onClose={() => {
            if (!today.busy) setDeleteDate(undefined);
          }}
        >
          <Button
            label="취소"
            disabled={today.busy}
            onPress={() => setDeleteDate(undefined)}
          />
          <Button
            label={today.busy ? '삭제 중…' : '삭제'}
            primary
            disabled={today.busy}
            onPress={confirmDelete}
          />
        </Dialog>
      )}
      {selectedEntry && (
        <JournalEntryModal
          entry={selectedEntry}
          onSaved={(entry) => {
            setSelectedEntry(entry);
            today.applySavedPastEntry(entry);
          }}
          onClose={() => setSelectedEntry(undefined)}
        />
      )}
      {viewingPhoto && (
        <Modal
          presentationStyle="fullScreen"
          animationType="slide"
          onRequestClose={() => setViewingPhoto(undefined)}
        >
          <JournalPhotoViewer
            photo={viewingPhoto}
            onClose={() => setViewingPhoto(undefined)}
          />
        </Modal>
      )}
    </Page>
  );
}

const todayStyles = StyleSheet.create({
  journalCard: { gap: 14 },
});
