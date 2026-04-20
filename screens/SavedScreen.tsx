import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  FlatList,
  Dimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
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
const FALLBACK_IMAGE = require('../assets/logo_vroom_Couleur.png');

// Mock saved posts data
const SAVED_POSTS = [
  {
    id: '1',
    title: 'Ferrari F8',
    image: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=400&h=400&fit=crop',
    user: '@CarEnthusiast',
    likes: 1240,
  },
  {
    id: '2',
    title: 'Porsche 911',
    image: 'https://cdn.pixabay.com/photo/2020/07/28/08/29/porsche-911-5444317_640.jpg',
    user: '@SpeedDemon',
    likes: 2100,
  },
  {
    id: '3',
    title: 'McLaren 720S',
    image: 'https://images.unsplash.com/photo-1620882814836-98a2bc903323?w=400&h=400&fit=crop',
    user: '@MotorHead',
    likes: 3400,
  },
  {
    id: '4',
    title: 'Lamborghini Huracán',
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd3d9a?w=400&h=400&fit=crop',
    user: '@GearGuru',
    likes: 5200,
  },
  {
    id: '5',
    title: 'Aston Martin DBS',
    image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=400&h=400&fit=crop',
    user: '@AutoLover',
    likes: 1890,
  },
];

const GRID_COLUMNS = 2;
const GAP = 2;
const ITEM_SIZE = (width - CONTAINER_PADDING * 2 - GAP) / GRID_COLUMNS;

type SavedScreenProps = {
  navigation: any;
};

export default function SavedScreen({ navigation }: SavedScreenProps) {
  const renderSavedItem = ({ item }: { item: typeof SAVED_POSTS[0] }) => (
    <Pressable style={({ pressed }) => [styles.savedItem, pressed && { opacity: 0.7 }]}>
      <ExpoImage
        source={item.image}
        style={styles.savedImage}
        placeholder={FALLBACK_IMAGE}
        contentFit="cover"
      />
      <View style={styles.savedOverlay}>
        <View style={styles.savedInfo}>
          <Text style={styles.savedTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.savedUser} numberOfLines={1}>
            {item.user}
          </Text>
        </View>
        <View style={styles.likesBadge}>
          <Ionicons name="heart" size={14} color="#FFFFFF" />
          <Text style={styles.likesCount}>{item.likes}</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* === HEADER === */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={15}>
          <Ionicons name="chevron-down" size={32} color={VROOM_COLORS.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>Saved</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* === GRID === */}
      <FlatList
        data={SAVED_POSTS}
        keyExtractor={(item) => item.id}
        renderItem={renderSavedItem}
        numColumns={GRID_COLUMNS}
        scrollEnabled={true}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.columnWrapper}
        ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
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

  // === GRID ===
  gridContent: {
    paddingHorizontal: CONTAINER_PADDING,
    paddingVertical: GAP,
  },
  columnWrapper: {
    gap: GAP,
  },

  // === SAVED ITEM ===
  savedItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: VROOM_COLORS.fieldBg,
  },
  savedImage: {
    width: '100%',
    height: '100%',
  },
  savedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20, 1, 2, 0.4)',
    justifyContent: 'space-between',
    padding: 8,
  },
  savedInfo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  savedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  savedUser: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  likesBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(229, 9, 20, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  likesCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
