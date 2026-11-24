import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { dayKey } from '../dates';
import {
  getDatabase,
  loadEntriesInRange,
  saveEntry,
  type Entry,
} from '../store';

export function useJournal() {
  const [month, setMonth] = useState(() => new Date());
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>();
  const [editing, setEditing] = useState<string>();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Entry>();
  const [deleteError, setDeleteError] = useState(false);
  const year = month.getFullYear();
  const index = month.getMonth();
  const start = dayKey(new Date(year, index, 1));
  const end = dayKey(new Date(year, index + 1, 1));

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      loadEntriesInRange(start, end)
        .then(
          (rows) => {
            if (active) {
              setEntries(rows);
              setError(false);
            }
          },
          () => {
            if (active) setError(true);
          },
        )
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [start, end]),
  );

  const selectEntry = useCallback((entry: Entry) => {
    setSelected(entry.date);
  }, []);

  function edit(entry: Entry) {
    setSelected(entry.date);
    setEditing(entry.date);
    setDraft(entry.body);
  }
  const move = useCallback((delta: number) => {
    setSelected(undefined);
    setEditing(undefined);
    setMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + delta, 1),
    );
  }, []);

  async function update(entry: Entry) {
    if (busy) return;
    const text = draft.trim();
    if (!text) {
      Alert.alert('일기 내용을 입력해 주세요.');
      return;
    }
    setBusy(true);
    try {
      await saveEntry(entry.date, text);
      setEntries((rows) =>
        rows.map((row) =>
          row.date === entry.date ? { ...row, body: text } : row,
        ),
      );
      setEditing(undefined);
    } catch {
      Alert.alert('일기를 저장하지 못했어요.');
    } finally {
      setBusy(false);
    }
  }

  function requestDelete(entry: Entry) {
    setDeleteError(false);
    setPendingDelete(entry);
  }

  function cancelDelete() {
    if (!busy) setPendingDelete(undefined);
  }

  async function confirmDelete() {
    if (!pendingDelete || busy) return;
    setBusy(true);
    try {
      const db = await getDatabase();
      await db.runAsync(
        'DELETE FROM entries WHERE date = ?',
        pendingDelete.date,
      );
      setEntries((rows) =>
        rows.filter((row) => row.date !== pendingDelete.date),
      );
      if (selected === pendingDelete.date) setSelected(undefined);
      setPendingDelete(undefined);
    } catch {
      setDeleteError(true);
    } finally {
      setBusy(false);
    }
  }

  return {
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
  };
}
