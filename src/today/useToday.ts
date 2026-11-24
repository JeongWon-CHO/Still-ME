import { useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { dayKey, type Cycle } from '../dates';
import {
  getDatabase,
  loadPastEntries,
  saveEntry,
  setSetting,
  type Entry,
} from '../store';

export const cycles = { week: '주', month: '월', year: '연' };
export type LoadStatus = 'loading' | 'ready' | 'error';
const PAGE_SIZE = 20;

export function useToday() {
  const isFocused = useIsFocused();
  const [date, setDate] = useState(() => dayKey(new Date()));
  const [past, setPast] = useState<Entry[]>([]);
  const [pastStatus, setPastStatus] = useState<LoadStatus>('loading');
  const [historyVersion, setHistoryVersion] = useState(0);
  const [body, setBody] = useState('');
  const [cycle, setCycle] = useState<Cycle>('week');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!isFocused) return;
    let active = true;
    async function load() {
      const key = dayKey(new Date());
      try {
        const db = await getDatabase();
        const [entry, preference] = await Promise.all([
          db.getFirstAsync<Entry>(
            'SELECT date, body FROM entries WHERE date = ?',
            key,
          ),
          db.getFirstAsync<{ value: Cycle }>(
            "SELECT value FROM settings WHERE key = 'cycle'",
          ),
        ]);
        if (!active) return;
        setDate(key);
        setBody(entry?.body ?? '');
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
    if (saving) return;
    const text = body.trim();
    if (!text) {
      setMessage('일기 내용을 입력해 주세요.');
      return;
    }
    setSaving(true);
    try {
      await saveEntry(date, text);
      setMessage('일기를 저장했어요.');
    } catch {
      setMessage('저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
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

  function changeBody(value: string) {
    setBody(value);
    setMessage('');
  }

  return {
    date,
    cycle,
    selectCycle,
    status,
    retryToday,
    body,
    changeBody,
    saving,
    message,
    save,
    pastStatus,
    retryPast,
    past,
    limit,
    loadMore,
  };
}
