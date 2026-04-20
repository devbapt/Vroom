import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// --- Colors ---
const VROOM_COLORS = {
  bg: '#FFFFFF',
  dark: '#140102',
  accent: '#E50914',
  muted: '#8E8E93',
  fieldBg: 'rgba(20, 1, 2, 0.05)',
  border: '#EEEEEE',
};

const CONTAINER_PADDING = 16;

// Mock activity data
const ACTIVITY_DATA = [
  {
    id: '1',
    type: 'like',
    user: '@CarEnthusiast',
    action: 'liked your post',
    time: '2 hours ago',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
  },
  {
    id: '2',
    type: 'follow',
    user: '@SpeedDemon',
    action: 'started following you',
    time: '5 hours ago',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
  },
  {
    id: '3',
    type: 'comment',
    user: '@MotorHead',
    action: 'commented on your post',
    time: '1 day ago',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
  },
  {
    id: '4',
    type: 'repost',
    user: '@GearGuru',
    action: 'reposted your vehicle',
    time: '2 days ago',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
  },
  {
    id: '5',
    type: 'like',
    user: '@AutoLover',
    action: 'liked your story',
    time: '3 days ago',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
  },
];

type ActivityScreenProps = {
  navigation: any;
};

export default function ActivityScreen({ navigation }: ActivityScreenProps) {
  const renderActivityItem = ({ item }: { item: typeof ACTIVITY_DATA[0] }) => {
    const getActivityIcon = () => {
      switch (item.type) {
        case 'like':
          return <Ionicons name="heart" size={20} color={VROOM_COLORS.accent} />;
        case 'follow':
          return <Ionicons name="person-add" size={20} color={VROOM_COLORS.accent} />;
        case 'comment':
          return <Ionicons name="chatbubble" size={20} color={VROOM_COLORS.accent} />;
        case 'repost':
          return <Ionicons name="repeat" size={20} color={VROOM_COLORS.accent} />;
        default:
          return null;
      }
    };

    return (
      <Pressable style={({ pressed }) => [styles.activityItem, pressed && { backgroundColor: VROOM_COLORS.fieldBg }]}>
        <View style={styles.activityIcon}>{getActivityIcon()}</View>

        <View style={styles.activityContent}>
          <Text style={styles.activityUser}>{item.user}</Text>
          <Text style={styles.activityAction}>{item.action}</Text>
          <Text style={styles.activityTime}>{item.time}</Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={VROOM_COLORS.muted} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* === HEADER === */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={15}>
          <Ionicons name="chevron-down" size={32} color={VROOM_COLORS.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>Activity</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* === ACTIVITY LIST === */}
      <FlatList
        data={ACTIVITY_DATA}
        keyExtractor={(item) => item.id}
        renderItem={renderActivityItem}
        scrollEnabled={true}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VROOM_COLORS.bg,
  },

  // === HEADER ===
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CONTAINER_PADDING,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: VROOM_COLORS.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: VROOM_COLORS.dark,
  },

  // === LIST ===
  listContent: {
    paddingVertical: 0,
  },

  // === ACTIVITY ITEM ===
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: CONTAINER_PADDING,
    paddingVertical: 14,
    gap: 12,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityUser: {
    fontSize: 14,
    fontWeight: '600',
    color: VROOM_COLORS.dark,
    marginBottom: 2,
  },
  activityAction: {
    fontSize: 13,
    color: VROOM_COLORS.muted,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 11,
    color: VROOM_COLORS.muted,
    fontWeight: '400',
  },

  // === DIVIDER ===
  divider: {
    height: 0.5,
    backgroundColor: VROOM_COLORS.border,
    marginHorizontal: CONTAINER_PADDING,
  },
});
