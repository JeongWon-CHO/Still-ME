import { useIsFocused, useNavigation } from 'expo-router';
import { Check, ChevronDown } from 'lucide-react-native';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { AppHeader } from '../AppHeader';
import { dateLabel, type Cycle } from '../dates';
import { color, styles, Text } from '../ui';
import { cycles } from './useToday';

type Props = {
  date: string;
  cycle: Cycle;
  disabled: boolean;
  onSelectCycle: (cycle: Cycle) => void;
};

export function TodayHeader({ date, cycle, disabled, onSelectCycle }: Props) {
  const selectorRef = useRef<ComponentRef<typeof View>>(null);
  const [menu, setMenu] = useState<{
    left: number;
    top: number;
    width: number;
  }>();
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  useEffect(
    () => navigation.addListener('blur', () => setMenu(undefined)),
    [navigation],
  );

  function openMenu() {
    selectorRef.current?.measureInWindow((left, top, width, height) => {
      if (width > 0 && height > 0) setMenu({ left, top: top + height, width });
    });
  }

  return (
    <>
      <View style={todayStyles.header}>
        <AppHeader />
        <View style={[styles.row, todayStyles.dateRow]}>
          <Text style={todayStyles.date}>{dateLabel(date)}</Text>
          <Pressable
            ref={selectorRef}
            accessibilityRole="button"
            accessibilityLabel={cycles[cycle] + ' 보기'}
            accessibilityState={{
              expanded: !!menu,
              disabled: disabled,
            }}
            disabled={disabled}
            onPress={openMenu}
            style={[todayStyles.selector, menu && todayStyles.openSelector]}
          >
            <Text style={todayStyles.selectorLabel}>{cycles[cycle]}</Text>
            <ChevronDown color={color.ink} size={14} />
          </Pressable>
        </View>
      </View>
      {menu && isFocused && (
        <Modal
          transparent
          visible
          statusBarTranslucent
          navigationBarTranslucent
          onRequestClose={() => setMenu(undefined)}
        >
          <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
            <Pressable
              accessible={false}
              style={StyleSheet.absoluteFill}
              onPress={() => setMenu(undefined)}
            />
            <View
              style={[todayStyles.options, menu]}
              onAccessibilityEscape={() => setMenu(undefined)}
            >
              {(Object.keys(cycles) as Cycle[]).map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected: item === cycle }}
                  onPress={() => {
                    setMenu(undefined);
                    onSelectCycle(item);
                  }}
                  style={({ pressed }) => [
                    todayStyles.option,
                    (pressed || item === cycle) && todayStyles.selectedOption,
                  ]}
                >
                  <Text style={todayStyles.selectorLabel}>{cycles[item]}</Text>
                  {item === cycle && <Check color={color.ink} size={14} />}
                </Pressable>
              ))}
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const todayStyles = StyleSheet.create({
  header: { gap: 8 },
  dateRow: { alignItems: 'flex-start' },
  date: {
    flex: 1,
    color: color.ink,
    fontSize: 16,
    lineHeight: 23,
    paddingVertical: 10,
    fontWeight: '600',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    minWidth: 66,
    paddingHorizontal: 13,
    borderColor: color.line,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: color.white,
  },
  selectorLabel: { color: color.ink, fontSize: 14, fontWeight: '500' },
  openSelector: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  options: {
    position: 'absolute',
    borderColor: color.line,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: color.white,
    overflow: 'hidden',
  },
  option: {
    minHeight: 44,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedOption: { backgroundColor: color.pale },
});
