import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../src/AppHeader';
import { dateLabel, dayKey, fromKey } from '../src/dates';
import { Dialog } from '../src/Dialog';
import { EntryEditor } from '../src/journal/EntryEditor';
import { JournalCalendar } from '../src/journal/JournalCalendar';
import { JournalCardHeader } from '../src/journal/JournalCardHeader';
import { JournalEntryModal } from '../src/journal/JournalEntryModal';
import { JournalWriteSheet } from '../src/journal/JournalWriteSheet';
import { useJournal } from '../src/journal/useJournal';
import { Button, styles, Text, useTabContentBottomPadding } from '../src/ui';

export default function Journal() {
  const paddingBottom = useTabContentBottomPadding();
  const contentStyle = useMemo(
    () => [styles.content, styles.tabContent, { paddingBottom }],
    [paddingBottom],
  );
  const [newEntryDate, setNewEntryDate] = useState<string>();
  const [openEntryDate, setOpenEntryDate] = useState<string>();
  const {
    year,
    index,
    today,
    entries,
    canCreate,
    loading,
    error,
    editing,
    cancelEdit,
    draft,
    setDraft,
    draftPhotos,
    setDraftPhotos,
    busy,
    edit,
    move,
    goToMonth,
    update,
    applySavedEntry,
    create,
    pendingDelete,
    deleteError,
    requestDelete,
    cancelDelete,
    confirmDelete,
  } = useJournal(newEntryDate ?? openEntryDate);
  const openEntry = entries.find((entry) => entry.date === openEntryDate);
  const hasWritableDates = dayKey(new Date(year, index, 1)) <= today;
  const todayDate = fromKey(today);
  const isCurrentMonth =
    year === todayDate.getFullYear() && index === todayDate.getMonth();

  const selectDate = useCallback(
    (date: string) => {
      if (entries.some((entry) => entry.date === date)) {
        setOpenEntryDate(date);
      } else if (canCreate && date <= today) {
        setNewEntryDate(date);
      }
    },
    [canCreate, entries, today],
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
            <View style={styles.row}>
              <AppHeader />
              {!isCurrentMonth && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: busy }}
                  disabled={busy}
                  onPress={() =>
                    goToMonth(todayDate.getFullYear(), todayDate.getMonth())
                  }
                  style={({ pressed }) => [
                    journalStyles.todayButton,
                    (pressed || busy) && journalStyles.dimmed,
                  ]}
                >
                  <Text style={styles.muted}>오늘로 돌아가기</Text>
                </Pressable>
              )}
            </View>
            <JournalCalendar
              year={year}
              index={index}
              today={today}
              entries={entries}
              busy={busy}
              canCreate={canCreate}
              onSelect={selectDate}
              move={move}
              goToMonth={goToMonth}
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
                {hasWritableDates &&
                  ' 달력에서 날짜를 눌러 일기를 쓸 수 있어요.'}
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
                photos={draftPhotos}
                busy={busy}
                onChange={setDraft}
                onChangePhotos={setDraftPhotos}
                onCancel={cancelEdit}
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
          onSaved={applySavedEntry}
          onClose={() => setOpenEntryDate(undefined)}
        />
      )}
      {newEntryDate && (
        <JournalWriteSheet
          date={newEntryDate}
          busy={busy}
          onClose={() => setNewEntryDate(undefined)}
          onSave={(body, photos) => create(newEntryDate, body, photos)}
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
  todayButton: {
    minWidth: 44,
    minHeight: 44,
    flexShrink: 1,
    justifyContent: 'center',
  },
  dimmed: { opacity: 0.65 },
});
