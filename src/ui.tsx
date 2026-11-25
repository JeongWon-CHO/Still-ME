import { BottomTabBarHeightContext } from 'expo-router/js-tabs';
import { isLoaded } from 'expo-font';
import { ReactNode, useContext } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
  TextInputProps,
  TextProps,
  TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const fonts = {
  '300': 'Pretendard-Light',
  '400': 'Pretendard-Regular',
  '500': 'Pretendard-Medium',
  '600': 'Pretendard-SemiBold',
  '700': 'Pretendard-Bold',
};

function fontStyle(weight: TextStyle['fontWeight']): TextStyle | undefined {
  const family = fonts[String(weight) as keyof typeof fonts] ?? fonts['400'];
  return isLoaded(family)
    ? { fontFamily: family, fontWeight: 'normal' }
    : undefined;
}

export function Text({ style, ...props }: TextProps) {
  return (
    <NativeText
      {...props}
      style={[style, fontStyle(StyleSheet.flatten(style)?.fontWeight)]}
    />
  );
}

export function TextInput({ style, ...props }: TextInputProps) {
  return (
    <NativeTextInput
      {...props}
      style={[style, fontStyle(StyleSheet.flatten(style)?.fontWeight)]}
    />
  );
}

export const color = {
  ink: '#292524',
  canvas: '#f5f5f5',
  white: '#fff',
  line: '#e7e5e4',
  muted: '#69635d',
  pale: '#f0efed',
};

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.canvas },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 18,
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
  },
  tabContent: { paddingTop: 6 },
  heading: {
    color: color.ink,
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: -0.6,
  },
  body: { color: color.ink, fontSize: 16, lineHeight: 25 },
  muted: { color: color.muted, fontSize: 14, lineHeight: 21 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  card: {
    padding: 18,
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: color.line,
    backgroundColor: color.white,
  },
  input: {
    minHeight: 110,
    fontSize: 16,
    lineHeight: 25,
    color: color.ink,
    padding: 0,
    textAlignVertical: 'top',
  },
});

export function useTabContentBottomPadding() {
  const tabBarHeight = useContext(BottomTabBarHeightContext) ?? 0;
  return Math.max(144, tabBarHeight + 72);
}

export function Page({
  children,
  modal = false,
}: {
  children: ReactNode;
  modal?: boolean;
}) {
  const paddingBottom = useTabContentBottomPadding();
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          !modal && styles.tabContent,
          !modal && { paddingBottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Button({
  label,
  onPress,
  primary = false,
  disabled = false,
  selected,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
  selected?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        alignSelf: 'flex-start',
        borderRadius: 30,
        minHeight: 44,
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: primary ? color.ink : '#d6d3d1',
        backgroundColor: primary ? color.ink : 'transparent',
        opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{ color: primary ? color.white : color.ink, fontWeight: '500' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
