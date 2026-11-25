import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Dialog } from '../src/Dialog';
import { JournalCardHeader } from '../src/journal/JournalCardHeader';
import type { Entry } from '../src/store';
import { JournalComposer } from '../src/today/JournalComposer';
import { JournalEntryModal } from '../src/today/JournalEntryModal';
import { JournalHistory } from '../src/today/JournalHistory';
import { TodayHeader } from '../src/today/TodayHeader';
import { useToday } from '../src/today/useToday';
import { Button, Page, styles, Text } from '../src/ui';

export default function Today() {
  const today = useToday();
  const [selectedEntry, setSelectedEntry] = useState<Entry>();
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
            <JournalCardHeader
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
              <Text style={styles.body}>{savedEntry.body}</Text>
            ) : (
              <JournalComposer
                body={today.body}
                saving={today.busy}
                message={today.message}
                onChangeBody={today.changeBody}
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
          onClose={() => setSelectedEntry(undefined)}
        />
      )}
    </Page>
  );
}

const todayStyles = StyleSheet.create({
  journalCard: { gap: 14 },
});
