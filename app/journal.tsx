import { useRouter } from 'expo-router';
import { BottomTabBarHeightContext } from 'expo-router/js-tabs';
import { useContext, useMemo } from 'react';
import { FlatList, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../src/AppHeader';
import { dateLabel } from '../src/dates';
import { Dialog } from '../src/Dialog';
import { JournalCalendar } from '../src/journal/JournalCalendar';
import { JournalCardHeader } from '../src/journal/JournalCardHeader';
import { useJournal } from '../src/journal/useJournal';
import { Button, styles, Text, TextInput } from '../src/ui';

export default function Journal() {
  const router = useRouter();
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  const contentStyle = useMemo(
    () => [styles.content, { paddingBottom: 36 + tabBarHeight }],
    [tabBarHeight],
  );
  const {
    year,
    index,
    entries,
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
    pendingDelete,
    deleteError,
    requestDelete,
    cancelDelete,
    confirmDelete,
  } = useJournal();

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
              onSelect={selectEntry}
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
              <Text style={styles.muted}>이달의 일기가 아직 없어요.</Text>
              <Button
                label="오늘 일기 쓰기"
                onPress={() => router.navigate('/')}
              />
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
              <>
                <TextInput
                  multiline
                  value={draft}
                  onChangeText={setDraft}
                  accessibilityLabel="일기 수정"
                  editable={!busy}
                  style={[styles.input, journalStyles.entryInput]}
                />
                <View style={[styles.row, journalStyles.actions]}>
                  <Button
                    label="취소"
                    disabled={busy}
                    onPress={() => setEditing(undefined)}
                  />
                  <Button
                    label="저장"
                    primary
                    disabled={busy}
                    onPress={() => void update(entry)}
                  />
                </View>
              </>
            ) : (
              <Text style={styles.body}>{entry.body}</Text>
            )}
          </View>
        )}
      />
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
  // iOS places the first line of a multiline input below a matching Text line.
  entryInput: { marginTop: Platform.OS === 'ios' ? -3 : 0 },
  actions: { flexWrap: 'wrap', justifyContent: 'flex-end' },
});
