import React, { memo } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Platform,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useAppContext } from '../../context/AppContext';
import { useUnreadCount } from '../../hooks/useMessages';

const ACCENT = '#E50914';
const TAB_HEIGHT = 60;

const ICON_MAP: Record<string, { default: string; focused: string }> = {
  Home:     { default: 'home-outline',       focused: 'home' },
  Maps:     { default: 'map-outline',        focused: 'map' },
  Search:   { default: 'search-outline',     focused: 'search' },
  Messages: { default: 'chatbubble-outline', focused: 'chatbubble' },
  Profile:  { default: 'person-outline',     focused: 'person' },
};

const LABEL_MAP: Record<string, string> = {
  Home: 'Home', Maps: 'Maps', Search: 'Search', Messages: 'Messages', Profile: 'Profile',
};

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAppContext();
  const unreadCount = useUnreadCount(user?.id ?? '');

  const bgColor       = '#140102';
  const borderColor   = 'rgba(255,255,255,0.08)';
  const inactiveColor = 'rgba(255,255,255,0.45)';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          borderTopColor: borderColor,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          height: TAB_HEIGHT + (Platform.OS === 'ios' ? insets.bottom : 0),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const icons     = ICON_MAP[route.name] ?? { default: 'ellipse-outline', focused: 'ellipse' };
        const label     = LABEL_MAP[route.name] ?? route.name;
        const iconName  = (isFocused ? icons.focused : icons.default) as keyof typeof Ionicons.glyphMap;
        const iconColor = isFocused ? ACCENT : inactiveColor;
        const isMessages = route.name === 'Messages';
        const badgeCount = isMessages ? unreadCount : 0;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable
            key={route.key}
            style={styles.tab}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
          >
            <View style={styles.iconWrapper}>
              <Ionicons name={iconName} size={22} color={iconColor} />
              {badgeCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, { color: iconColor }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default memo(CustomTabBar);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
