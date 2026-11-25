import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { dayKey } from '../dates';
import {
  deleteEntry,
  loadEntriesInRange,
  saveEntry,
  type Entry,
} from '../store';

const emptyEntries: Entry[] = [];

export function useJournal() {
  const [month, setMonth] = useState(() => new Date());
  const [entries, setEntries] = useState(emptyEntries);
  const [loadedMonth, setLoadedMonth] = useState<string>();
  const writeVersion = useRef(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>();
  const [editing, setEditing] = useState<string>();
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const creating = useRef(false);
  const [pendingDelete, setPendingDelete] = useState<Entry>();
  const [deleteError, setDeleteError] = useState(false);
  const year = month.getFullYear();
  const index = month.getMonth();
  const start = dayKey(new Date(year, index, 1));
  const end = dayKey(new Date(year, index + 1, 1));

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const version = writeVersion.current;
      setLoading(true);
      loadEntriesInRange(start, end)
        .then(
          (rows) => {
            if (active) {
              if (version === writeVersion.current) {
                setEntries((current) =>
                  current.length === rows.length &&
                  current.every(
                    (entry, index) =>
                      entry.date === rows[index].date &&
                      entry.body === rows[index].body,
                  )
                    ? current
                    : rows,
                );
                setLoadedMonth(start);
              }
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

  const selectEntry = useCallback((date: string) => {
    setSelected(date);
  }, []);

  function edit(entry: Entry) {
    setSelected(entry.date);
    setEditing(entry.date);
    setDraft(entry.body);
  }
  const move = useCallback((delta: number) => {
    setSelected(undefined);
    setEditing(undefined);
    setLoading(true);
    setError(false);
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
      writeVersion.current += 1;
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

  async function create(date: string, body: string) {
    if (
      creating.current ||
      busy ||
      loadedMonth !== start ||
      date < start ||
      date >= end ||
      date >= dayKey(new Date())
    ) {
      return false;
    }
    const text = body.trim();
    if (!text) {
      Alert.alert('일기 내용을 입력해 주세요.');
      return false;
    }
    creating.current = true;
    setBusy(true);
    try {
      const saved = await saveEntry(date, text, { onlyIfMissing: true });
      if (!saved) {
        Alert.alert('이미 이 날짜에 쓴 일기가 있어요.');
        return false;
      }
      writeVersion.current += 1;
      setEntries((rows) => {
        const next = rows.filter((row) => row.date !== date);
        const index = next.findIndex((row) => row.date < date);
        next.splice(index === -1 ? next.length : index, 0, {
          date,
          body: text,
        });
        return next;
      });
      setSelected(date);
      return true;
    } catch {
      Alert.alert('일기를 저장하지 못했어요. 다시 시도해 주세요.');
      return false;
    } finally {
      creating.current = false;
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
      await deleteEntry(pendingDelete.date);
      writeVersion.current += 1;
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
    entries: loadedMonth === start ? entries : emptyEntries,
    canCreate: loadedMonth === start && !loading && !error,
    loading: loadedMonth !== start && loading,
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
  };
}
