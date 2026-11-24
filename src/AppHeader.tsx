import Constants from 'expo-constants';
import { Image, StyleSheet, View } from 'react-native';
import { color, Text } from './ui';

export function AppHeader() {
  return (
    <View style={styles.brand}>
      <Image
        source={require('../assets/still-me-logo.png')}
        style={styles.logo}
        resizeMode="contain"
        accessible={false}
      />
      <Text accessibilityRole="header" style={styles.appName}>
        {Constants.expoConfig?.name ?? '겹날'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logo: { width: 44, height: 44 },
  appName: {
    flexShrink: 1,
    color: color.ink,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
});
