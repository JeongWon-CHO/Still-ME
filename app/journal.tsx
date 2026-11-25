import { BottomTabBarHeightContext } from 'expo-router/js-tabs';
import { useCallback, useContext, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../src/AppHeader';
import { dateLabel, dayKey } from '../src/dates';
import { Dialog } from '../src/Dialog';
import { EntryEditor } from '../src/journal/EntryEditor';
import { JournalCalendar } from '../src/journal/JournalCalendar';
import { JournalCardHeader } from '../src/journal/JournalCardHeader';
import { JournalEntryModal } from '../src/journal/JournalEntryModal';
import { JournalWriteSheet } from '../src/journal/JournalWriteSheet';
import { useJournal } from '../src/journal/useJournal';
import { Button, styles, Text } from '../src/ui';

export default function Journal() {
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const contentStyle = useMemo(
    () => [styles.content, { paddingBottom: Math.max(144, tabBarHeight + 72) }],
    [tabBarHeight],
  );
  const {
    year,
    index,
    entries,
    canCreate,
    loading,
    error,
    selected,
    editing,
    setEditing,
    draft,
    setDraft,
    busy,
    selectEntry,
    edit,
    move,
    update,
    create,
    pendingDelete,
    deleteError,
    requestDelete,
    cancelDelete,
    confirmDelete,
  } = useJournal();
  const [newEntryDate, setNewEntryDate] = useState<string>();
  const [openEntryDate, setOpenEntryDate] = useState<string>();
  const openEntry = entries.find((entry) => entry.date === openEntryDate);
  const hasPastDates = dayKey(new Date(year, index, 1)) < dayKey(new Date());

  const selectDate = useCallback(
    (date: string) => {
      if (entries.some((entry) => entry.date === date)) {
        selectEntry(date);
        setOpenEntryDate(date);
      } else if (canCreate) {
        setNewEntryDate(date);
      }
    },
    [canCreate, entries, selectEntry],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <FlatList
        data={entries}
        keyExtractor={(entry) => entry.date}
        initialNumToRender={4}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={contentStyle}
        ListHeaderComponent={
          <View style={journalStyles.header}>
            <AppHeader />
            <JournalCalendar
              year={year}
              index={index}
              entries={entries}
              selected={selected}
              busy={busy}
              canCreate={canCreate}
              onSelect={selectDate}
              move={move}
            />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <Text style={styles.muted}>일기를 불러오는 중이에요.</Text>
          ) : error ? (
            <Text style={styles.muted}>일기를 불러오지 못했어요.</Text>
          ) : (
            <View style={styles.card}>
              <Text style={styles.muted}>
                이달의 일기가 아직 없어요.
                {hasPastDates &&
                  ' 달력에서 지난 날짜를 눌러 일기를 쓸 수 있어요.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item: entry }) => (
          <View style={styles.card}>
            <JournalCardHeader
              label={dateLabel(entry.date)}
              busy={busy}
              onEdit={editing === entry.date ? undefined : () => edit(entry)}
              onDelete={
                editing === entry.date ? undefined : () => requestDelete(entry)
              }
            />
            {editing === entry.date ? (
              <EntryEditor
                body={draft}
                busy={busy}
                onChange={setDraft}
                onCancel={() => setEditing(undefined)}
                onSave={() => void update(entry)}
              />
            ) : (
              <Text style={styles.body}>{entry.body}</Text>
            )}
          </View>
        )}
      />
      {openEntry && (
        <JournalEntryModal
          entry={openEntry}
          onClose={() => setOpenEntryDate(undefined)}
        />
      )}
      {newEntryDate && (
        <JournalWriteSheet
          date={newEntryDate}
          busy={busy}
          onClose={() => setNewEntryDate(undefined)}
          onSave={(body) => create(newEntryDate, body)}
        />
      )}
      {pendingDelete && (
        <Dialog
          title="일기를 삭제할까요?"
          message={
            deleteError
              ? '일기를 삭제하지 못했어요. 다시 시도해 주세요.'
              : '삭제한 일기는 복구할 수 없어요.'
          }
          onClose={cancelDelete}
        >
          <Button label="취소" disabled={busy} onPress={cancelDelete} />
          <Button
            label={busy ? '삭제 중…' : '삭제'}
            primary
            disabled={busy}
            onPress={() => void confirmDelete()}
          />
        </Dialog>
      )}
    </SafeAreaView>
  );
}

const journalStyles = StyleSheet.create({
  header: { gap: 18 },
});
