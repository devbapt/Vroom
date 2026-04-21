import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Modal,
  Platform,
  Animated,
  RefreshControl,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context';
import PostDetailModal from './PostDetailModal';
import StoryViewer from './StoryViewer';
import CreateStoryScreen from './CreateStoryScreen';

const { width } = Dimensions.get('window');

// --- Couleurs Charte Vroom ---
const VROOM_COLORS = {
  bg: '#FFFFFF',
  dark: '#140102',
  accent: '#E50914',
  muted: '#8E8E93',
  fieldBg: 'rgba(20, 1, 2, 0.05)',
  border: '#EEEEEE',
};

// --- Layout Constants ---
const CONTAINER_PADDING = 16;
const GARAGE_COLUMNS = 3;
const GARAGE_GAP = 1;
const GARAGE_IMAGE_SIZE = (width - (CONTAINER_PADDING * 2) - (GARAGE_GAP * (GARAGE_COLUMNS - 1))) / GARAGE_COLUMNS;

// --- Reliable Test Data ---
const GARAGE_DATA = [
  { id: '1', name: 'Ferrari F8', image: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=400&h=400&fit=crop' },
  { id: '2', name: 'Porsche 911', image: 'https://cdn.pixabay.com/photo/2020/07/28/08/29/porsche-911-5444317_640.jpg' },
  { id: '3', name: 'McLaren 720S', image: 'https://images.unsplash.com/photo-1620882814836-98a2bc903323?w=400&h=400&fit=crop' },
  { id: '4', name: 'Lamborghini', image: 'https://images.unsplash.com/photo-1544636331-e26879cd3d9a?w=400&h=400&fit=crop' },
  { id: '5', name: 'Aston Martin', image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=400&h=400&fit=crop' },
  { id: '6', name: 'Mercedes AMG', image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=400&fit=crop' },
];

const HIGHLIGHTS_DATA = [
  { id: '1', name: 'Car Shows', image: 'https://images.unsplash.com/photo-1540261014352-7a064dc8cc94?w=200&h=200&fit=crop' },
  { id: '2', name: 'Track Days', image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200&h=200&fit=crop' },
  { id: '3', name: 'Meets', image: 'https://images.unsplash.com/photo-1549399542-7e3f8b83ad5e?w=200&h=200&fit=crop' },
  { id: '4', name: 'Events', image: 'https://images.unsplash.com/photo-1507950547674-7a86b984e2a1?w=200&h=200&fit=crop' },
];

const FALLBACK_IMAGE = require('../assets/logo_vroom_Couleur.png');

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, posts, highlights, addHighlight } = useAppContext();
  
  const [activeHighlight, setActiveHighlight] = useState('1');
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [postDetailVisible, setPostDetailVisible] = useState(false);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState('');
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [bottomMenuVisible, setBottomMenuVisible] = useState(false);
  const [createStoryVisible, setCreateStoryVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [slideAnim] = useState(new Animated.Value(500));
  const insets = useSafeAreaInsets();

  // Open post detail
  const handlePostPress = (post: typeof GARAGE_DATA[0]) => {
    setSelectedPost(post);
    setPostDetailVisible(true);
  };

  // Open story viewer
  const handleStoryPress = (storyId: string) => {
    setSelectedStoryId(storyId);
    setStoryViewerVisible(true);
  };

  // Toggle Bottom Menu
  const openBottomMenu = () => {
    setBottomMenuVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const closeBottomMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 500,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setBottomMenuVisible(false));
  };

  const handleLogout = async () => {
    closeBottomMenu();
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Erreur de déconnexion : " + error.message);
    }
  };

  const handleNavigateToEditProfile = () => {
    setActionSheetVisible(false);
    navigation.navigate('EditProfile');
  };

  const handleNavigateToAddVehicle = () => {
    setActionSheetVisible(false);
    navigation.navigate('AddVehicle');
  };

  const handleNavigateToSettings = () => {
    closeBottomMenu();
    navigation.navigate('Settings');
  };

  const handleNavigateToActivity = () => {
    closeBottomMenu();
    navigation.navigate('Activity');
  };

  const handleNavigateToSaved = () => {
    closeBottomMenu();
    navigation.navigate('Saved');
  };

  const handleAddStory = (imageUri: string, storyName: string) => {
    // Story is already added via AppContext in CreateStoryScreen
    // This is just for ProfileScreen UI sync
    setCreateStoryVisible(false);
  };

  const handleNavigateToCreateStory = () => {
    setActionSheetVisible(false);
    setCreateStoryVisible(true);
  };

  // Get stories for the selected highlight
  const getStoriesForHighlight = (highlightId: string) => {
    const highlight = highlights.find(h => h.id === highlightId);
    if (highlight) {
      return [{
        id: `${highlightId}-1`,
        image: highlight.image,
        duration: 5000,
      }];
    }
    return [];
  };

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* === HEADER: USERNAME + MENU === */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.headerTitle}>@{user?.username || 'user'}</Text>
        <Pressable
          onPress={openBottomMenu}
          hitSlop={15}
          style={styles.menuButton}
        >
          <Ionicons name="menu" size={26} color={VROOM_COLORS.dark} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={VROOM_COLORS.accent}
          />
        }
      >
        
        {/* === PROFILE SECTION: AVATAR + STATS (INSTAGRAM) === */}
        <View style={styles.profileSection}>
          {/* Avatar with red border + Badge "+" */}
          <View style={styles.avatarContainer}>
            <Pressable
              onPress={() => setActionSheetVisible(true)}
              style={styles.avatarPressable}
            >
              <View style={styles.avatarBorder}>
                <ExpoImage
                  source={user?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg'}
                  style={styles.avatar}
                  placeholder={FALLBACK_IMAGE}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              </View>
              {/* Badge "+" */}
              <View style={styles.avatarBadge}>
                <Ionicons name="add" size={16} color="#FFFFFF" />
              </View>
            </Pressable>
          </View>

          {/* Stats: 3 columns */}
          <View style={styles.statsContainer}>
            <View style={styles.statColumn}>
              <Text style={styles.statNumber}>{posts.length}</Text>
              <Text style={styles.statLabel}>Vehicles</Text>
            </View>
            <View style={styles.statColumn}>
              <Text style={styles.statNumber}>{(user?.followersCount || 0).toLocaleString().slice(0, 3)}k</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statColumn}>
              <Text style={styles.statNumber}>{user?.postsCount || 0}</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
          </View>
        </View>

        {/* === BIO SECTION === */}
        <View style={styles.bioSection}>
          <Text style={styles.bioName}>{user?.displayName || 'User'}</Text>
          <Text style={styles.bioDescription}>
            {user?.bio || 'No bio yet'}
          </Text>
        </View>

        {/* === ACTION BUTTONS === */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={handleNavigateToEditProfile}
            style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </Pressable>
          <Pressable
            onPress={handleNavigateToAddVehicle}
            style={({ pressed }) => [styles.addVehicleBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.addVehicleBtnText}>Add Vehicle</Text>
          </Pressable>
        </View>

        {/* === HIGHLIGHTS (INTERACTIVE STORIES) === */}
        <View style={styles.highlightsSection}>
          <Text style={styles.highlightsLabel}>HIGHLIGHTS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.highlightsScroll}
          >
            {/* Add New Button */}
            <Pressable
              onPress={handleNavigateToCreateStory}
              style={styles.highlightItem}
            >
              <View style={[styles.highlightCircleBorder, styles.highlightNewBtn]}>
                <Ionicons name="add" size={32} color={VROOM_COLORS.dark} />
              </View>
              <Text style={styles.highlightLabel}>New</Text>
            </Pressable>

            {/* Highlights */}
            {highlights.map((story) => (
              <Pressable
                key={story.id}
                onPress={() => handleStoryPress(story.id)}
                style={styles.highlightItem}
              >
                <View style={[styles.highlightCircleBorder, activeHighlight === story.id && styles.highlightActive]}>
                  <ExpoImage
                    source={story.image}
                    style={styles.highlightImage}
                    placeholder={FALLBACK_IMAGE}
                    contentFit="cover"
                  />
                </View>
                <Text style={styles.highlightLabel} numberOfLines={1}>{story.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* === GARAGE GRID (3 COLUMNS) === */}
        <View style={styles.garageHeaderSection}>
          <Text style={styles.garageTitle}>My Garage</Text>
          <Text style={styles.garageCount}>{posts.length} vehicles</Text>
        </View>

        <View style={styles.garageGrid}>
          {posts.map((car) => (
            <Pressable
              key={car.id}
              onPress={() => {
                setSelectedPost(car);
                setPostDetailVisible(true);
              }}
              style={({ pressed }) => [styles.garageItem, pressed && { opacity: 0.7 }]}
            >
              <ExpoImage
                source={car.image}
                style={styles.garageImage}
                placeholder={FALLBACK_IMAGE}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            </Pressable>
          ))}
        </View>

        {/* Bottom padding for safe area */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* === POST DETAIL MODAL === */}
      <PostDetailModal
        visible={postDetailVisible}
        post={selectedPost}
        onClose={() => setPostDetailVisible(false)}
      />

      {/* === STORY VIEWER === */}
      <StoryViewer
        visible={storyViewerVisible}
        highlightId={selectedStoryId}
        onClose={() => setStoryViewerVisible(false)}
        stories={getStoriesForHighlight(selectedStoryId)}
      />

      {/* === CREATE STORY MODAL === */}
      <CreateStoryScreen
        visible={createStoryVisible}
        onClose={() => setCreateStoryVisible(false)}
        onStoryAdded={handleAddStory}
      />

      {/* === ACTION SHEET (CREATE CONTENT) === */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={actionSheetVisible}
        onRequestClose={() => setActionSheetVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setActionSheetVisible(false)}
        >
          <View style={[styles.actionSheetContainer, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.actionSheetContent}>
              {/* Header */}
              <Text style={styles.actionSheetTitle}>Créer</Text>

              {/* Divider */}
              <View style={styles.sheetDivider} />

              {/* Option 1: Add to Story */}
              <Pressable
                onPress={handleNavigateToCreateStory}
                style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: VROOM_COLORS.fieldBg }]}
              >
                <Ionicons name="images" size={20} color={VROOM_COLORS.accent} />
                <Text style={styles.sheetItemText}>Ajouter à la story</Text>
              </Pressable>

              {/* Option 2: New Post */}
              <Pressable
                onPress={handleNavigateToAddVehicle}
                style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: VROOM_COLORS.fieldBg }]}
              >
                <Ionicons name="add-circle" size={20} color={VROOM_COLORS.accent} />
                <Text style={styles.sheetItemText}>Nouvelle publication</Text>
              </Pressable>

              {/* Divider */}
              <View style={styles.sheetDivider} />

              {/* Cancel */}
              <Pressable
                onPress={() => setActionSheetVisible(false)}
                style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: VROOM_COLORS.fieldBg }]}
              >
                <Text style={[styles.sheetItemText, { color: VROOM_COLORS.muted }]}>Annuler</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* === BOTTOM MENU (SETTINGS) === */}
      {bottomMenuVisible && (
        <Pressable
          style={styles.bottomMenuOverlay}
          onPress={closeBottomMenu}
        />
      )}
      <Animated.View
        style={[
          styles.bottomMenuContainer,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.bottomMenuContent}>
          {/* Drag indicator */}
          <View style={styles.dragIndicator} />

          {/* Menu items */}
          <Pressable
            onPress={handleNavigateToSettings}
            style={({ pressed }) => [styles.menuItemBottom, pressed && { backgroundColor: VROOM_COLORS.fieldBg }]}
          >
            <Ionicons name="settings-outline" size={20} color={VROOM_COLORS.dark} />
            <Text style={styles.menuItemBottomText}>Paramètres</Text>
          </Pressable>

          <Pressable
            onPress={handleNavigateToActivity}
            style={({ pressed }) => [styles.menuItemBottom, pressed && { backgroundColor: VROOM_COLORS.fieldBg }]}
          >
            <Ionicons name="notifications-outline" size={20} color={VROOM_COLORS.dark} />
            <Text style={styles.menuItemBottomText}>Activité</Text>
          </Pressable>

          <Pressable
            onPress={handleNavigateToSaved}
            style={({ pressed }) => [styles.menuItemBottom, pressed && { backgroundColor: VROOM_COLORS.fieldBg }]}
          >
            <Ionicons name="bookmark-outline" size={20} color={VROOM_COLORS.dark} />
            <Text style={styles.menuItemBottomText}>Enregistré</Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.bottomMenuDivider} />

          {/* Logout (Red) */}
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.menuItemBottom, pressed && { backgroundColor: 'rgba(229, 9, 20, 0.05)' }]}
          >
            <Ionicons name="log-out-outline" size={20} color={VROOM_COLORS.accent} />
            <Text style={[styles.menuItemBottomText, { color: VROOM_COLORS.accent }]}>Se déconnecter</Text>
          </Pressable>
        </View>
      </Animated.View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  },
  headerLeft: {
    width: 26,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: VROOM_COLORS.dark,
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    width: 26,
    alignItems: 'flex-end',
  },

  // === SCROLL ===
  scrollContent: {
    paddingBottom: 0,
  },

  // === PROFILE SECTION ===
  profileSection: {
    flexDirection: 'row',
    paddingHorizontal: CONTAINER_PADDING,
    paddingVertical: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 30,
  },
  avatarPressable: {
    position: 'relative',
  },
  avatarBorder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: VROOM_COLORS.accent, // Red ring (story active)
    padding: 2,
    backgroundColor: VROOM_COLORS.bg,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
    backgroundColor: VROOM_COLORS.fieldBg,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: VROOM_COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statColumn: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: VROOM_COLORS.dark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: VROOM_COLORS.muted,
    fontWeight: '400',
  },

  // === BIO SECTION ===
  bioSection: {
    paddingHorizontal: CONTAINER_PADDING,
    paddingBottom: 20,
  },
  bioName: {
    fontSize: 15,
    fontWeight: '600',
    color: VROOM_COLORS.dark,
    marginBottom: 4,
  },
  bioDescription: {
    fontSize: 13,
    color: VROOM_COLORS.dark,
    lineHeight: 18,
  },

  // === ACTION BUTTONS ===
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: CONTAINER_PADDING,
    paddingBottom: 20,
    gap: 8,
  },
  editBtn: {
    flex: 1,
    backgroundColor: VROOM_COLORS.fieldBg,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20, 1, 2, 0.1)',
  },
  editBtnText: {
    color: VROOM_COLORS.dark,
    fontWeight: '600',
    fontSize: 13,
  },
  addVehicleBtn: {
    flex: 1,
    backgroundColor: VROOM_COLORS.dark,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addVehicleBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },

  // === HIGHLIGHTS ===
  highlightsSection: {
    paddingVertical: 20,
  },
  highlightsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: VROOM_COLORS.muted,
    paddingHorizontal: CONTAINER_PADDING,
    letterSpacing: 0.5,
    marginBottom: 15,
  },
  highlightsScroll: {
    paddingHorizontal: CONTAINER_PADDING - 4,
  },
  highlightItem: {
    alignItems: 'center',
    marginHorizontal: 6,
  },
  highlightCircleBorder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: VROOM_COLORS.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    backgroundColor: VROOM_COLORS.bg,
  },
  highlightActive: {
    borderColor: VROOM_COLORS.accent,
    borderWidth: 2.5,
  },
  highlightNewBtn: {
    backgroundColor: VROOM_COLORS.fieldBg,
    borderWidth: 0.5,
    borderColor: VROOM_COLORS.muted,
  },
  highlightImage: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    backgroundColor: VROOM_COLORS.fieldBg,
  },
  highlightLabel: {
    fontSize: 12,
    color: VROOM_COLORS.dark,
    fontWeight: '500',
    textAlign: 'center',
  },

  // === GARAGE HEADER ===
  garageHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: CONTAINER_PADDING,
    paddingVertical: 16,
  },
  garageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: VROOM_COLORS.dark,
  },
  garageCount: {
    fontSize: 13,
    color: VROOM_COLORS.muted,
    fontWeight: '400',
  },

  // === GARAGE GRID (3 COLUMNS) ===
  garageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: CONTAINER_PADDING,
    justifyContent: 'flex-start',
    gap: GARAGE_GAP,
    marginBottom: GARAGE_GAP,
  },
  garageItem: {
    width: GARAGE_IMAGE_SIZE,
    height: GARAGE_IMAGE_SIZE,
    backgroundColor: VROOM_COLORS.fieldBg,
    overflow: 'hidden',
    marginBottom: GARAGE_GAP,
  },
  garageImage: {
    width: '100%',
    height: '100%',
    backgroundColor: VROOM_COLORS.fieldBg,
  },

  // === MODAL ===
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },

  // === ACTION SHEET ===
  actionSheetContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  actionSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: CONTAINER_PADDING,
  },
  actionSheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: VROOM_COLORS.dark,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sheetDivider: {
    height: 0.5,
    backgroundColor: VROOM_COLORS.border,
    marginVertical: 8,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 12,
  },
  sheetItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: VROOM_COLORS.dark,
  },

  // === BOTTOM MENU ===
  bottomMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bottomMenuContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  bottomMenuContent: {
    paddingVertical: 16,
    paddingHorizontal: CONTAINER_PADDING,
  },
  dragIndicator: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: VROOM_COLORS.border,
    marginBottom: 16,
  },
  menuItemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 12,
  },
  menuItemBottomText: {
    fontSize: 14,
    fontWeight: '500',
    color: VROOM_COLORS.dark,
  },
  bottomMenuDivider: {
    height: 0.5,
    backgroundColor: VROOM_COLORS.border,
    marginVertical: 8,
  },
});