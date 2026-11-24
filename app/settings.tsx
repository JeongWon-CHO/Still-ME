import { useEffect, useState } from 'react';
import { Alert, Linking, Switch, View } from 'react-native';
import { AppHeader } from '../src/AppHeader';
import { ensurePermission, scheduleReminders } from '../src/reminders';
import { getDatabase, setSetting } from '../src/store';
import { color, Page, styles, Text } from '../src/ui';

export default function Settings() {
  const [diary, setDiary] = useState(false);
  const [review, setReview] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    getDatabase()
      .then((db) =>
        db.getAllAsync<{ key: string; value: string }>(
          "SELECT * FROM settings WHERE key IN ('diary-reminder', 'review-reminder')",
        ),
      )
      .then((rows) => {
        if (!active) return;
        setDiary(
          rows.some((row) => row.key === 'diary-reminder' && row.value === '1'),
        );
        setReview(
          rows.some(
            (row) => row.key === 'review-reminder' && row.value === '1',
          ),
        );
        setReady(true);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  async function change(type: 'diary' | 'review', enabled: boolean) {
    if (busy) return;
    setBusy(true);
    try {
      const permission = enabled ? await ensurePermission() : 'granted';
      if (permission === 'exact') {
        Alert.alert(
          '정확한 알림 시간 설정이 필요해요',
          '밤 10시에 알림을 받으려면 알람 및 리마인더 권한을 허용해 주세요.',
        );
        return;
      }
      if (permission === 'notifications') {
        Alert.alert(
          '알림 권한이 필요해요',
          '기기 설정에서 알림을 허용해 주세요.',
          [
            { text: '닫기', style: 'cancel' },
            {
              text: '기기 설정 열기',
              onPress: () => void Linking.openSettings(),
            },
          ],
        );
        return;
      }
      await scheduleReminders(
        type === 'diary' ? enabled : diary,
        type === 'review' ? enabled : review,
      );
      await setSetting(type + '-reminder', enabled ? '1' : '0');
      if (type === 'diary') setDiary(enabled);
      else setReview(enabled);
    } catch {
      Alert.alert('알림 설정을 변경하지 못했어요.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Page>
      <AppHeader />
      <Text style={styles.heading} accessibilityRole="header">
        알림
      </Text>
      <View style={styles.card}>
        {(
          [
            {
              id: 'diary',
              title: '일기 작성 알림',
              time: '매일 밤 10시',
              enabled: diary,
            },
            {
              id: 'review',
              title: '주간 회고 알림',
              time: '일요일 밤 10시',
              enabled: review,
            },
          ] as const
        ).map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.body}>{item.title}</Text>
              <Text style={styles.muted}>{item.time}</Text>
            </View>
            <Switch
              accessibilityLabel={item.title}
              value={item.enabled}
              disabled={!ready || busy}
              onValueChange={(value) => void change(item.id, value)}
              trackColor={{ true: color.ink }}
            />
          </View>
        ))}
        {error && (
          <Text style={styles.muted}>알림 설정을 불러오지 못했어요.</Text>
        )}
      </View>
      <Text style={styles.heading} accessibilityRole="header">
        기록 보관
      </Text>
      <View style={styles.card}>
        <Text style={styles.body}>이 기기에 보관 중</Text>
        <Text style={styles.muted}>
          앱을 삭제하면 이 기기에 저장한 일기와 회고를 잃을 수 있어요.
        </Text>
      </View>
    </Page>
  );
}
