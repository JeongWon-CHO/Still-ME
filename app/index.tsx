import { useState } from 'react';
import { View } from 'react-native';
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
          <JournalComposer
            body={today.body}
            saving={today.saving}
            message={today.message}
            onChangeBody={today.changeBody}
            onSave={today.save}
          />
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
      {selectedEntry && (
        <JournalEntryModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(undefined)}
        />
      )}
    </Page>
  );
}
