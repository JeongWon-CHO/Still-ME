import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AppState } from 'react-native';
import { dayKey } from './dates';

export function useTodayDate() {
  const [today, setToday] = useState(() => dayKey(new Date()));

  useFocusEffect(
    useCallback(() => {
      let timer: ReturnType<typeof setTimeout>;

      function refresh() {
        clearTimeout(timer);
        const now = new Date();
        setToday(dayKey(now));
        const midnight = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1,
        );
        timer = setTimeout(refresh, midnight.getTime() - now.getTime());
      }

      refresh();
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') refresh();
        else clearTimeout(timer);
      });
      return () => {
        clearTimeout(timer);
        subscription.remove();
      };
    }, []),
  );

  return today;
}
