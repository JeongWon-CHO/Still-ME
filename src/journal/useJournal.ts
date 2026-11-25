import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { dayKey } from '../dates';
import {
  deleteEntry,
  loadEntryPhotos,
  loadEntriesInRange,
  saveEntry,
  type Entry,
} from '../store';
import { emptyPhotos, type EntryPhoto } from './entryPhotos';

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
  const [draftPhotos, setDraftPhotos] = useState(emptyPhotos);
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
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

  async function edit(entry: Entry) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    try {
      const photos = await loadEntryPhotos(entry.date);
      setSelected(entry.date);
      setEditing(entry.date);
      setDraft(entry.body);
      setDraftPhotos(photos);
    } catch {
      Alert.alert('첨부 사진을 불러오지 못했어요. 다시 시도해 주세요.');
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  function cancelEdit() {
    setEditing(undefined);
    setDraftPhotos(emptyPhotos);
  }

  const move = useCallback((delta: number) => {
    if (working.current) return;
    setSelected(undefined);
    setEditing(undefined);
    setDraftPhotos(emptyPhotos);
    setLoading(true);
    setError(false);
    setMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + delta, 1),
    );
  }, []);

  async function update(entry: Entry) {
    if (working.current) return;
    const text = draft.trim();
    if (!text) {
      Alert.alert('일기 내용을 입력해 주세요.');
      return;
    }
    working.current = true;
    setBusy(true);
    try {
      await saveEntry(entry.date, text, { photos: draftPhotos });
      writeVersion.current += 1;
      setEntries((rows) =>
        rows.map((row) =>
          row.date === entry.date ? { ...row, body: text } : row,
        ),
      );
      cancelEdit();
    } catch {
      Alert.alert('일기를 저장하지 못했어요.');
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  async function create(date: string, body: string, photos: EntryPhoto[]) {
    if (
      working.current ||
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
    working.current = true;
    setBusy(true);
    try {
      const saved = await saveEntry(date, text, {
        onlyIfMissing: true,
        photos,
      });
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
      working.current = false;
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
    if (!pendingDelete || working.current) return;
    working.current = true;
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
      working.current = false;
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
    cancelEdit,
    draft,
    setDraft,
    draftPhotos,
    setDraftPhotos,
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
