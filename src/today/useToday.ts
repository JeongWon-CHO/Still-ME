import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { dayKey, type Cycle } from '../dates';
import { emptyPhotos, type EntryPhoto } from '../journal/entryPhotos';
import {
  deleteEntry,
  getDatabase,
  loadEntry,
  loadPastEntries,
  saveEntry,
  setSetting,
  type Entry,
  type EntryWithPhotos,
} from '../store';

export const cycles = { week: '주', month: '월', year: '연' };
export type LoadStatus = 'loading' | 'ready' | 'error';
const PAGE_SIZE = 20;

type TodayJournal = {
  date: string;
  entry: EntryWithPhotos | null;
  draft?: string;
  draftPhotos?: EntryPhoto[];
  message?: string;
};

export function useToday() {
  const isFocused = useIsFocused();
  const [journal, setJournal] = useState<TodayJournal>(() => ({
    date: dayKey(new Date()),
    entry: null,
  }));
  const {
    date,
    entry,
    draft,
    draftPhotos = emptyPhotos,
    message = '',
  } = journal;
  const body = draft ?? entry?.body ?? '';
  const [past, setPast] = useState<Entry[]>([]);
  const [pastStatus, setPastStatus] = useState<LoadStatus>('loading');
  const [historyVersion, setHistoryVersion] = useState(0);
  const [cycle, setCycle] = useState<Cycle>('week');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [busy, setBusy] = useState(false);
  const writing = useRef(false);
  const writeVersion = useRef(0);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!isFocused) return;
    let active = true;
    async function load() {
      const key = dayKey(new Date());
      const version = writeVersion.current;
      try {
        const db = await getDatabase();
        const [entry, preference] = await Promise.all([
          loadEntry(key),
          db.getFirstAsync<{ value: Cycle }>(
            "SELECT value FROM settings WHERE key = 'cycle'",
          ),
        ]);
        if (!active) return;
        const stale = version !== writeVersion.current;
        setJournal((current) => {
          const currentPhotos = current.entry?.photos ?? emptyPhotos;
          const photos = entry?.photos ?? emptyPhotos;
          if (
            current.date === key &&
            (stale ||
              (current.entry?.body === entry?.body &&
                currentPhotos.length === photos.length &&
                currentPhotos.every(
                  (photo, index) => photo.id === photos[index].id,
                )))
          ) {
            return current;
          }
          return { date: key, entry };
        });
        setPastStatus('loading');
        setHistoryVersion((version) => version + 1);
        if (preference && preference.value in cycles)
          setCycle(preference.value);
        setStatus('ready');
      } catch {
        if (active) setStatus('error');
      }
    }
    void load();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && dayKey(new Date()) !== date) void load();
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [date, isFocused, retry]);

  useEffect(() => {
    if (historyVersion === 0) return;
    let active = true;
    loadPastEntries(date, cycle, limit + 1).then(
      (rows) => {
        if (active) {
          setPast(rows);
          setPastStatus('ready');
        }
      },
      () => {
        if (active) setPastStatus('error');
      },
    );
    return () => {
      active = false;
    };
  }, [date, cycle, limit, historyVersion]);

  async function save() {
    if (writing.current) return;
    const text = body.trim();
    if (!text) {
      setJournal((current) => ({
        ...current,
        message: '일기 내용을 입력해 주세요.',
      }));
      return;
    }
    await writeEntry({ date, body: text, photos: draftPhotos });
  }

  function edit() {
    if (!entry || writing.current) return;
    setJournal((current) =>
      current.entry === entry
        ? { ...current, draft: entry.body, draftPhotos: entry.photos }
        : current,
    );
  }

  async function writeEntry(next: EntryWithPhotos | null) {
    if (writing.current) return false;
    writing.current = true;
    setBusy(true);
    try {
      if (next) {
        await saveEntry(date, next.body, { photos: next.photos });
      } else {
        await deleteEntry(date);
      }
      writeVersion.current += 1;
      setJournal((current) =>
        current.date === date ? { date, entry: next } : current,
      );
      return true;
    } catch {
      if (next) {
        setJournal((current) =>
          current.date === date
            ? {
                ...current,
                message: '저장하지 못했어요. 다시 시도해 주세요.',
              }
            : current,
        );
      }
      return false;
    } finally {
      writing.current = false;
      setBusy(false);
    }
  }

  async function selectCycle(value: Cycle) {
    if (value === cycle && limit === PAGE_SIZE) return;
    setPastStatus('loading');
    setLimit(PAGE_SIZE);
    if (value === cycle) return;
    setCycle(value);
    try {
      await setSetting('cycle', value);
    } catch {
      Alert.alert('보기 설정을 저장하지 못했어요.');
    }
  }

  function retryToday() {
    setStatus('loading');
    setRetry((count) => count + 1);
  }

  function retryPast() {
    setPastStatus('loading');
    setHistoryVersion((version) => version + 1);
  }

  function loadMore() {
    setPastStatus('loading');
    setLimit((count) => count + PAGE_SIZE);
  }

  function changeBody(draft: string) {
    setJournal((current) => ({ ...current, draft, message: undefined }));
  }

  function changePhotos(photos: EntryPhoto[]) {
    setJournal((current) =>
      current.date === date ? { ...current, draftPhotos: photos } : current,
    );
  }

  function cancelEdit() {
    setJournal((current) => ({ date: current.date, entry: current.entry }));
  }

  return {
    date,
    cycle,
    selectCycle,
    status,
    retryToday,
    entry,
    body,
    changeBody,
    draftPhotos,
    changePhotos,
    editing: entry !== null && draft !== undefined,
    edit,
    cancelEdit,
    busy,
    message,
    save,
    remove: () => writeEntry(null),
    pastStatus,
    retryPast,
    past,
    limit,
    loadMore,
  };
}
