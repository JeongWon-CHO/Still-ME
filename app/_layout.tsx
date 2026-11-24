import { BlurTargetView, BlurView } from 'expo-blur';
import { useFonts } from 'expo-font';
import { BookOpen, CalendarDays, History, Settings } from 'lucide-react-native';
import {
  addNotificationResponseReceivedListener,
  clearLastNotificationResponse,
  getLastNotificationResponse,
} from 'expo-notifications';
import { Tabs, useRouter } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { StatusBar } from 'expo-status-bar';
import { createRef, useEffect, useMemo, type ComponentRef } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import { refreshReminderTimeZone } from '../src/reminders';
import { color, fonts } from '../src/ui';

const tabs = [
  { name: 'index', title: '오늘', icon: CalendarDays, symbol: 'calendar' },
  { name: 'journal', title: '일기', icon: BookOpen, symbol: 'book' },
  {
    name: 'review',
    title: '회고',
    icon: History,
    symbol: 'clock.arrow.circlepath',
  },
  { name: 'settings', title: '설정', icon: Settings, symbol: 'gearshape' },
] as const;

const fontAssets = {
  'Pretendard-Light': require('pretendard/dist/public/static/alternative/Pretendard-Light.ttf'),
  'Pretendard-Regular': require('pretendard/dist/public/static/alternative/Pretendard-Regular.ttf'),
  'Pretendard-Medium': require('pretendard/dist/public/static/alternative/Pretendard-Medium.ttf'),
  'Pretendard-SemiBold': require('pretendard/dist/public/static/alternative/Pretendard-SemiBold.ttf'),
  'Pretendard-Bold': require('pretendard/dist/public/static/alternative/Pretendard-Bold.ttf'),
};

export default function Layout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  if (!fontsLoaded && !fontError) return null;
  return <DiaryTabs fontsLoaded={fontsLoaded} />;
}

function DiaryTabs({ fontsLoaded }: { fontsLoaded: boolean }) {
  const router = useRouter();
  const blurTargets = useMemo(
    () =>
      new Map<string, ReturnType<typeof createRef<ComponentRef<typeof View>>>>(
        tabs.map(({ name }) => [name, createRef<ComponentRef<typeof View>>()]),
      ),
    [],
  );
  const androidBlur =
    Platform.OS === 'android' && Number(Platform.Version) >= 31;
  useEffect(() => {
    const refresh = () => void refreshReminderTimeZone().catch(() => {});
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    function navigate(screen: unknown) {
      if (screen !== '/' && screen !== '/review') return;
      clearLastNotificationResponse();
      router.navigate(screen);
    }
    const notifications = addNotificationResponseReceivedListener((response) =>
      navigate(response.notification.request.content.data?.screen),
    );
    const initial = getLastNotificationResponse();
    const frame = requestAnimationFrame(() =>
      navigate(initial?.notification.request.content.data?.screen),
    );
    return () => {
      subscription.remove();
      notifications.remove();
      cancelAnimationFrame(frame);
    };
  }, [router]);

  if (Platform.OS === 'ios') {
    return (
      <>
        <StatusBar style="dark" />
        <NativeTabs tintColor={color.ink}>
          {tabs.map(({ name, title, symbol }) => (
            <NativeTabs.Trigger key={name} name={name}>
              <NativeTabs.Trigger.Icon sf={symbol} />
              <NativeTabs.Trigger.Label>{title}</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
          ))}
        </NativeTabs>
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        screenLayout={({ children, route }) =>
          androidBlur ? (
            <BlurTargetView
              ref={blurTargets.get(route.name)}
              style={layoutStyles.scene}
            >
              {children}
            </BlurTargetView>
          ) : (
            <>{children}</>
          )
        }
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: color.ink,
          tabBarInactiveTintColor: color.muted,
          tabBarStyle: layoutStyles.tabBar,
          tabBarLabelPosition: 'below-icon',
          tabBarIconStyle: { marginBottom: 4 },
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: fontsLoaded ? fonts['500'] : undefined,
            fontWeight: 'normal',
          },
          tabBarBackground: () =>
            androidBlur ? (
              <BlurView
                key={route.key}
                intensity={45}
                tint="light"
                blurTarget={blurTargets.get(route.name)}
                blurMethod="dimezisBlurViewSdk31Plus"
                style={[StyleSheet.absoluteFill, layoutStyles.glass]}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, layoutStyles.glass]} />
            ),
          tabBarHideOnKeyboard: true,
        })}
      >
        {tabs.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ color, size }) => (
                <tab.icon
                  color={typeof color === 'string' ? color : undefined}
                  size={size}
                />
              ),
            }}
          />
        ))}
      </Tabs>
    </>
  );
}

const layoutStyles = StyleSheet.create({
  scene: { flex: 1 },
  tabBar: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderTopColor: 'rgba(120, 113, 108, 0.2)',
    elevation: 0,
  },
  glass: { backgroundColor: 'rgba(255, 255, 255, 0.74)' },
});
