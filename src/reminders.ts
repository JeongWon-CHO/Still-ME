import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import { getDatabase } from './store';

const channelId = 'journal-reminders';
const prefix = 'still-me-reminder-';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensurePermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(channelId, {
      name: '일기와 회고',
      importance: AndroidImportance.DEFAULT,
    });
  }
  if (
    !(await Notifications.getPermissionsAsync()).granted &&
    !(await Notifications.requestPermissionsAsync()).granted
  )
    return 'notifications';
  if (
    Platform.OS === 'android' &&
    !(await Notifications.requestExactAlarmPermissionsAsync()).granted
  )
    return 'exact';
  return 'granted';
}

export async function scheduleReminders(diary: boolean, review: boolean) {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const granted = (await Notifications.getPermissionsAsync()).granted;
  const weekdays = granted
    ? Array.from({ length: 7 }, (_, index) => index + 1).filter(
        (weekday) => diary || (weekday === 1 && review),
      )
    : [];
  for (const weekday of weekdays) {
    const isReview = weekday === 1 && review;
    await Notifications.scheduleNotificationAsync({
      identifier: prefix + weekday,
      content: {
        title: isReview
          ? '한 주를 돌아볼 시간이에요'
          : '오늘을 기록할 시간이에요',
        body: isReview
          ? '이번 주의 일기를 읽고 회고를 남겨 보세요.'
          : '기억하고 싶은 순간을 일기에 남겨 보세요.',
        data: { screen: isReview ? '/review' : '/' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour: 22,
        minute: 0,
        channelId,
      },
    });
  }
  await Promise.all(
    pending
      .filter(
        (item) =>
          item.identifier.startsWith(prefix) &&
          !weekdays.some((weekday) => item.identifier === prefix + weekday),
      )
      .map((item) =>
        Notifications.cancelScheduledNotificationAsync(item.identifier),
      ),
  );
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO settings VALUES (?, ?)',
    'reminder-time-zone',
    timeZone(),
  );
}

function timeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export async function refreshReminderTimeZone() {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    "SELECT * FROM settings WHERE key IN ('diary-reminder', 'review-reminder', 'reminder-time-zone')",
  );
  const values = new Map(rows.map((row) => [row.key, row.value]));
  const diary = values.get('diary-reminder') === '1';
  const review = values.get('review-reminder') === '1';
  if ((diary || review) && values.get('reminder-time-zone') !== timeZone()) {
    await scheduleReminders(diary, review);
  }
}
