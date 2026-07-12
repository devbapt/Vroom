import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Dimensions,
  Animated,
  Share,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import VerifiedBadge from '../components/ui/VerifiedBadge';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context/AppContext';
import { getTranslation } from '../i18n';
import type { ProfileTag } from '../context/AppContext';
import StoryViewer from './StoryViewer';
import ExpandableText from '../components/ui/ExpandableText';
import AppText from '../components/ui/AppText';

const { width } = Dimensions.get('window');

const C = {
  bg:         '#140102',
  bgCard:     '#1F0808',
  bgElevated: '#2A0A0A',
  accent:     '#E50914',
  white:      '#FFFFFF',
  whiteSoft:  'rgba(255,255,255,0.7)',
  whiteGhost: 'rgba(255,255,255,0.2)',
  border:     'rgba(255,255,255,0.12)',
  muted:      'rgba(255,255,255,0.45)',
};

const PAD = 16;
// 2-column grid with 1px gap
const CARD_GAP = 1;
const CARD_WIDTH = Math.floor((width - CARD_GAP) / 2);
const CARD_HEIGHT = Math.floor(CARD_WIDTH * 5 / 4);
const FALLBACK = require('../assets/logo_vroom_Couleur.png');

const POST_TYPE_ICON: Record<string, string> = {
  track:     'speedometer-outline',
  road_trip: 'map-outline',
  meet:      'people-outline',
  daily:     'car-outline',
  build:     'construct-outline',
  spotted:   'eye-outline',
};

interface GarageCar {
  id: string;
  name: string;
  year: string;
  body: string;
  power: string;
  image: string;
  images: string[];
  specs: { km: string; motor: string; color: string; gearbox: string };
  history: string;
  estCertifie: boolean;
  pendingCertification?: boolean;
}

// =====================================================================
// Root Screen
// =====================================================================
export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { language, user, updateProfileAvatar, markPostDeleted, highlights, feedStories } = useAppContext();
  const t = getTranslation(language);

  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'garage' | 'publications' | 'itineraires'>('garage');
  const [menuVisible, setMenuVisible] = useState(false);
  const [pendingAvatarUri, setPendingAvatarUri] = useState<string | null>(null);
  const [pendingAvatarBase64, setPendingAvatarBase64] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(600));
  const [addSlideAnim] = useState(new Animated.Value(600));
  const [menuOverlayAnim] = useState(new Animated.Value(0));
  const [addOverlayAnim] = useState(new Animated.Value(0));
  const [refreshing, setRefreshing] = useState(false);
  const [myPublications, setMyPublications] = useState<any[]>([]);
  const [garageItems, setGarageItems] = useState<GarageCar[]>([]);
  const [highlightViewerId, setHighlightViewerId] = useState<string | null>(null);
  const [myStoryViewerOpen, setMyStoryViewerOpen] = useState(false);
  const [avatarSheetVisible, setAvatarSheetVisible] = useState(false);
  const [avatarSheetAnim] = useState(new Animated.Value(600));
  const [avatarOverlayAnim] = useState(new Animated.Value(0));
  const [eventsCount, setEventsCount] = useState(0);
  const [groupsCount, setGroupsCount] = useState(0);
  const [trackdaysCount, setTrackdaysCount] = useState(0);

  const [routesSubTab, setRoutesSubTab] = useState<'recorded' | 'published' | 'favorites'>('recorded');
  const [savedRoutes, setSavedRoutes] = useState<any[]>([]);
  const [publishedRoutes, setPublishedRoutes] = useState<any[]>([]);
  const [favoriteRoutes, setFavoriteRoutes] = useState<any[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesLoaded, setRoutesLoaded] = useState(false);

  const fetchPublications = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('posts')
      .select('id, type, image_urls, created_at, description, brand, model, location, likes_count, comments_count')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setMyPublications(data);
  }, [user?.id]);

  const fetchGarage = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('garage_vehicles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!data) return;
    setGarageItems(data.map((v: any) => ({
      id: v.id,
      name: `${v.brand} ${v.model}`,
      year: String(v.year),
      body: v.status ?? '—',
      power: v.power ?? '—',
      image: v.image_url ?? '',
      images: [v.image_url ?? ''],
      specs: {
        km: v.mileage ? Number(v.mileage).toLocaleString() : '—',
        motor: v.fuel ?? '—',
        color: v.color ?? '—',
        gearbox: v.transmission ?? '—',
      },
      history: v.notes ?? '',
      estCertifie: v.est_certifie ?? false,
    })));
  }, [user?.id]);

  const fetchStats = useCallback(async () => {
    if (!user?.id) return;
    const [groupsRes, eventsRes, trackdaysRes] = await Promise.all([
      supabase.from('group_members').select('group_id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('map_points').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('type', 'event'),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('type', 'track'),
    ]);
    setGroupsCount(groupsRes.count ?? 0);
    setEventsCount(eventsRes.count ?? 0);
    setTrackdaysCount(trackdaysRes.count ?? 0);
  }, [user?.id]);

  const fetchRoutes = useCallback(async () => {
    if (!user?.id) return;
    setRoutesLoading(true);
    const [savedRes, publishedRes, favRes] = await Promise.all([
      supabase.from('saved_routes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('map_points').select('*').eq('user_id', user.id).eq('type', 'route').order('created_at', { ascending: false }),
      supabase.from('saved_route_favorites').select('map_point_id, map_points(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    setSavedRoutes(savedRes.data ?? []);
    setPublishedRoutes(publishedRes.data ?? []);
    setFavoriteRoutes((favRes.data ?? []).map((r: any) => r.map_points).filter(Boolean));
    setRoutesLoading(false);
    setRoutesLoaded(true);
  }, [user?.id]);

  useEffect(() => { fetchPublications(); }, [fetchPublications]);
  useEffect(() => { fetchGarage(); }, [fetchGarage]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => {
    if (activeTab === 'itineraires' && !routesLoaded) fetchRoutes();
  }, [activeTab, routesLoaded, fetchRoutes]);

  const selectedCar = garageItems.find((c) => c.id === selectedCarId) ?? null;
  const profileTags: ProfileTag[] = user?.tags ?? [];
  const highlightStories = feedStories
    .filter((s) => s.highlightId === highlightViewerId)
    .map((s) => ({ id: s.id, image: s.imageUrl, userId: s.userId }));
  const myOwnStories = feedStories
    .filter((s) => s.userId === user?.id && !s.highlightId)
    .map((s) => ({ id: s.id, image: s.imageUrl, userId: s.userId }));
  const hasActiveStory = myOwnStories.length > 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchPublications(), fetchGarage(), fetchStats(),
      activeTab === 'itineraires' ? fetchRoutes() : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [fetchPublications, fetchGarage, fetchStats, fetchRoutes, activeTab]);

  const SHEET_SPRING = { useNativeDriver: true, damping: 22, stiffness: 220, mass: 0.9 };

  const openMenu = () => {
    setMenuVisible(true);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, ...SHEET_SPRING }),
      Animated.timing(menuOverlayAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  };
  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 600, duration: 240, useNativeDriver: true }),
      Animated.timing(menuOverlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setMenuVisible(false));
  };

  const openAddSheet = () => {
    setAddSheetVisible(true);
    Animated.parallel([
      Animated.spring(addSlideAnim, { toValue: 0, ...SHEET_SPRING }),
      Animated.timing(addOverlayAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  };
  const closeAddSheet = () => {
    Animated.parallel([
      Animated.timing(addSlideAnim, { toValue: 600, duration: 240, useNativeDriver: true }),
      Animated.timing(addOverlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setAddSheetVisible(false));
  };

  const closeAvatarSheet = () => {
    Animated.parallel([
      Animated.timing(avatarSheetAnim, { toValue: 600, duration: 240, useNativeDriver: true }),
      Animated.timing(avatarOverlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setAvatarSheetVisible(false));
  };

  const pickAvatar = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Autorisez l\'accès à la galerie dans les réglages.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      let b64: string | null = asset.base64 ?? null;
      if (!b64 && asset.uri?.startsWith('data:')) {
        const comma = asset.uri.indexOf(',');
        b64 = comma >= 0 ? asset.uri.substring(comma + 1) : null;
      }
      if (b64 && b64.includes(';base64,')) b64 = b64.split(';base64,')[1] ?? b64;
      setPendingAvatarUri(asset.uri);
      setPendingAvatarBase64(b64);
    }
  }, []);

  const openAvatarMenu = useCallback(() => {
    const options = [
      ...(hasActiveStory ? ['Voir ma story'] : []),
      'Ajouter une story',
      'Modifier la photo de profil',
      'Annuler',
    ];
    const cancelButtonIndex = options.length - 1;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex, userInterfaceStyle: 'dark' },
        (buttonIndex) => {
          const selected = options[buttonIndex];
          if (selected === 'Voir ma story') setMyStoryViewerOpen(true);
          else if (selected === 'Ajouter une story') navigation.navigate('CreateStory');
          else if (selected === 'Modifier la photo de profil') pickAvatar();
        }
      );
    } else {
      setAvatarSheetVisible(true);
      Animated.parallel([
        Animated.spring(avatarSheetAnim, { toValue: 0, ...SHEET_SPRING }),
        Animated.timing(avatarOverlayAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [hasActiveStory, navigation, pickAvatar]);

  const confirmAvatar = useCallback(async () => {
    if (!pendingAvatarBase64 || !user?.id) return;
    setIsUploadingAvatar(true);
    try {
      const filePath = `${user.id}/avatar.jpg`;
      const binaryStr = atob(pendingAvatarBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      const { error: uploadError } = await supabase.storage
        .from('avatars').upload(filePath, bytes, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await updateProfileAvatar(`${urlData.publicUrl}?v=${Date.now()}`);
      setPendingAvatarUri(null);
      setPendingAvatarBase64(null);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de mettre à jour la photo.');
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [pendingAvatarBase64, user?.id, updateProfileAvatar]);

  const handleLogout = async () => {
    closeMenu();
    await supabase.auth.signOut();
  };

  const handleShareProfile = async () => {
    try {
      await Share.share({
        message: `Découvre le profil de ${user?.displayName ?? user?.username ?? ''} (@${user?.username ?? ''}) sur Vroom 🏎️`,
      });
    } catch (_) {}
  };

  const handleDeletePost = useCallback(async (postId: string) => {
    await supabase.from('posts').delete().eq('id', postId);
    setMyPublications(prev => prev.filter((p: any) => p.id !== postId));
    markPostDeleted(postId);
  }, [markPostDeleted]);

  return (
    <View style={styles.root}>
      {selectedCar ? (
        <CarDetailView
          car={selectedCar}
          onBack={() => setSelectedCarId(null)}
          insets={insets}
          language={language}
        />
      ) : (
        <ProfileGridView
          insets={insets}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onCarPress={(id) => setSelectedCarId(id)}
          onOpenMenu={openMenu}
          onOpenAddSheet={openAddSheet}
          onNavigate={(screen, params) => navigation.navigate(screen, params)}
          onShareProfile={handleShareProfile}
          onRefresh={onRefresh}
          refreshing={refreshing}
          highlights={highlights}
          onOpenHighlight={setHighlightViewerId}
          language={language}
          user={user}
          posts={myPublications}
          profileTags={profileTags}
          garageItems={garageItems}
          routesSubTab={routesSubTab}
          onRoutesSubTabChange={setRoutesSubTab}
          savedRoutes={savedRoutes}
          publishedRoutes={publishedRoutes}
          favoriteRoutes={favoriteRoutes}
          routesLoading={routesLoading}
          eventsCount={eventsCount}
          groupsCount={groupsCount}
          trackdaysCount={trackdaysCount}
          pendingAvatarUri={pendingAvatarUri}
          isUploadingAvatar={isUploadingAvatar}
          onOpenAvatarMenu={openAvatarMenu}
          onConfirmAvatar={confirmAvatar}
          onCancelAvatar={() => { setPendingAvatarUri(null); setPendingAvatarBase64(null); }}
          onDeletePost={handleDeletePost}
        />
      )}

      <StoryViewer
        visible={!!highlightViewerId || myStoryViewerOpen}
        highlightId={highlightViewerId ?? ''}
        onClose={() => { setHighlightViewerId(null); setMyStoryViewerOpen(false); }}
        stories={myStoryViewerOpen ? myOwnStories : highlightStories}
        currentUserId={user?.id}
      />

      {/* Menu overlay */}
      {menuVisible && (
        <Animated.View style={[styles.overlay, { opacity: menuOverlayAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
        </Animated.View>
      )}
      <Animated.View
        style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}
        pointerEvents={menuVisible ? 'box-none' : 'none'}
      >
        <View style={[styles.sheetInner, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.dragHandle} />
          <Pressable style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: C.bgElevated }]}
            onPress={() => { closeMenu(); navigation.navigate('Settings'); }}>
            <Ionicons name="settings-outline" size={20} color={C.whiteSoft} />
            <AppText weight="medium" style={styles.sheetItemText}>{t.profile.settings}</AppText>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: C.bgElevated }]}
            onPress={() => { closeMenu(); navigation.navigate('Activity'); }}>
            <Ionicons name="notifications-outline" size={20} color={C.whiteSoft} />
            <AppText weight="medium" style={styles.sheetItemText}>{t.profile.activity}</AppText>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: C.bgElevated }]}
            onPress={() => { closeMenu(); navigation.navigate('Saved'); }}>
            <Ionicons name="bookmark-outline" size={20} color={C.whiteSoft} />
            <AppText weight="medium" style={styles.sheetItemText}>{t.profile.saved}</AppText>
          </Pressable>
          <View style={styles.sheetDivider} />
          <Pressable style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: 'rgba(229,9,20,0.12)' }]}
            onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={C.accent} />
            <AppText weight="medium" style={[styles.sheetItemText, { color: C.accent }]}>{t.profile.logout}</AppText>
          </Pressable>
        </View>
      </Animated.View>

      {/* Add content overlay */}
      {addSheetVisible && (
        <Animated.View style={[styles.overlay, { opacity: addOverlayAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeAddSheet} />
        </Animated.View>
      )}
      <Animated.View
        style={[styles.bottomSheet, { transform: [{ translateY: addSlideAnim }] }]}
        pointerEvents={addSheetVisible ? 'box-none' : 'none'}
      >
        <View style={[styles.sheetInner, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.dragHandle} />
          <AppText weight="bold" style={styles.sheetTitle}>Ajouter du contenu</AppText>
          <Pressable style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: C.bgElevated }]}
            onPress={() => { closeAddSheet(); navigation.navigate('VehiclePlateSearch'); }}>
            <View style={[styles.sheetIcon, { backgroundColor: '#2A0A0A' }]}>
              <Ionicons name="car-sport-outline" size={18} color={C.white} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="medium" style={styles.sheetItemText}>Ajouter au garage</AppText>
              <AppText weight="regular" style={styles.sheetItemHint}>Ajouter un véhicule à votre collection</AppText>
            </View>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: C.bgElevated }]}
            onPress={() => { closeAddSheet(); navigation.navigate('CreatePost'); }}>
            <View style={[styles.sheetIcon, { backgroundColor: C.accent }]}>
              <Ionicons name="grid-outline" size={18} color={C.white} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="medium" style={styles.sheetItemText}>Nouvelle publication</AppText>
              <AppText weight="regular" style={styles.sheetItemHint}>Partager une photo avec vos abonnés</AppText>
            </View>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: C.bgElevated }]}
            onPress={() => { closeAddSheet(); navigation.navigate('CreateStory'); }}>
            <View style={[styles.sheetIcon, { backgroundColor: '#6C63FF' }]}>
              <Ionicons name="camera-outline" size={18} color={C.white} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText weight="medium" style={styles.sheetItemText}>Nouvelle story / highlight</AppText>
              <AppText weight="regular" style={styles.sheetItemHint}>Ajouter une photo à la une</AppText>
            </View>
          </Pressable>
        </View>
      </Animated.View>

      {/* Avatar menu — fallback Android (iOS utilise ActionSheetIOS natif) */}
      {Platform.OS === 'android' && (
        <>
          {avatarSheetVisible && (
            <Animated.View style={[styles.overlay, { opacity: avatarOverlayAnim }]}>
              <Pressable style={StyleSheet.absoluteFill} onPress={closeAvatarSheet} />
            </Animated.View>
          )}
          <Animated.View
            style={[styles.bottomSheet, { transform: [{ translateY: avatarSheetAnim }] }]}
            pointerEvents={avatarSheetVisible ? 'box-none' : 'none'}
          >
            <View style={[styles.sheetInner, { paddingBottom: insets.bottom + 12 }]}>
              <View style={styles.dragHandle} />
              {hasActiveStory && (
                <Pressable style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: C.bgElevated }]}
                  onPress={() => { closeAvatarSheet(); setMyStoryViewerOpen(true); }}>
                  <Ionicons name="play-circle-outline" size={20} color={C.whiteSoft} />
                  <AppText weight="medium" style={styles.sheetItemText}>Voir ma story</AppText>
                </Pressable>
              )}
              <Pressable style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: C.bgElevated }]}
                onPress={() => { closeAvatarSheet(); navigation.navigate('CreateStory'); }}>
                <Ionicons name="add-circle-outline" size={20} color={C.whiteSoft} />
                <AppText weight="medium" style={styles.sheetItemText}>Ajouter une story</AppText>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: C.bgElevated }]}
                onPress={() => { closeAvatarSheet(); pickAvatar(); }}>
                <Ionicons name="image-outline" size={20} color={C.whiteSoft} />
                <AppText weight="medium" style={styles.sheetItemText}>Modifier la photo de profil</AppText>
              </Pressable>
              <View style={styles.sheetDivider} />
              <Pressable style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: C.bgElevated }]}
                onPress={closeAvatarSheet}>
                <AppText weight="medium" style={styles.sheetItemText}>Annuler</AppText>
              </Pressable>
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
}

// ─── ActivityCard ─────────────────────────────────────────────────────────────
function ActivityCard({ icon, value, label, accent }: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <View style={[styles.activityCard, accent && styles.activityCardAccent]}>
      <Ionicons name={icon} size={16} color={accent ? '#FFFFFF' : C.accent} style={{ marginBottom: 6 }} />
      <Text style={styles.activityValue}>{value}</Text>
      <Text style={styles.activityLabel}>{label}</Text>
    </View>
  );
}

// =====================================================================
// VIEW 1 — Profile Grid
// =====================================================================
function ProfileGridView({
  insets, activeTab, onTabChange, onCarPress, onOpenMenu, onOpenAddSheet,
  onNavigate, onShareProfile, onRefresh, refreshing, highlights, onOpenHighlight, language,
  user, posts, profileTags, garageItems, pendingAvatarUri, isUploadingAvatar,
  onOpenAvatarMenu, onConfirmAvatar, onCancelAvatar, onDeletePost,
  eventsCount, groupsCount, trackdaysCount,
  routesSubTab, onRoutesSubTabChange, savedRoutes, publishedRoutes, favoriteRoutes, routesLoading,
}: {
  insets: ReturnType<typeof useSafeAreaInsets>;
  activeTab: string;
  onTabChange: (tab: 'garage' | 'publications' | 'itineraires') => void;
  onCarPress: (id: string) => void;
  onOpenMenu: () => void;
  onOpenAddSheet: () => void;
  onNavigate: (screen: string, params?: Record<string, any>) => void;
  onShareProfile: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  highlights: { id: string; name: string; image: string }[];
  onOpenHighlight: (id: string) => void;
  language: any;
  user: any;
  posts: any[];
  profileTags: ProfileTag[];
  garageItems: GarageCar[];
  eventsCount: number;
  groupsCount: number;
  trackdaysCount: number;
  pendingAvatarUri: string | null;
  isUploadingAvatar: boolean;
  onOpenAvatarMenu: () => void;
  onConfirmAvatar: () => void;
  onCancelAvatar: () => void;
  onDeletePost: (postId: string) => void;
  routesSubTab: 'recorded' | 'published' | 'favorites';
  onRoutesSubTabChange: (tab: 'recorded' | 'published' | 'favorites') => void;
  savedRoutes: any[];
  publishedRoutes: any[];
  favoriteRoutes: any[];
  routesLoading: boolean;
}) {
  const t = getTranslation(language);
  const username     = user?.username ?? '';
  const displayName  = user?.displayName ?? username;
  const bio          = user?.bio ?? '';
  const avatarUri    = user?.avatar || null;
  const followersCount = user?.followersCount ?? 0;

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const formatCount = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 32 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 28 }} />
          <AppText weight="bold" style={styles.headerTitle}>@{username}</AppText>
          <TouchableOpacity onPress={onOpenMenu} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="menu" size={22} color={C.white} />
          </TouchableOpacity>
        </View>

        {/* Pending avatar preview */}
        {pendingAvatarUri && (
          <View style={styles.avatarPreviewSection}>
            <ExpoImage source={pendingAvatarUri} style={styles.avatarPreviewImage} contentFit="cover" />
            <View style={styles.avatarPreviewButtons}>
              <TouchableOpacity style={styles.avatarCancelBtn} onPress={onCancelAvatar} disabled={isUploadingAvatar}>
                <Text style={styles.avatarCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.avatarConfirmBtn} onPress={onConfirmAvatar} disabled={isUploadingAvatar}>
                {isUploadingAvatar
                  ? <ActivityIndicator size="small" color={C.white} />
                  : <Text style={styles.avatarConfirmText}>Confirmer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Profile row */}
        <View style={styles.profileRow}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={onOpenAvatarMenu}>
              <View style={styles.avatarRing}>
                {avatarUri ? (
                  <ExpoImage source={avatarUri} style={styles.avatarImage} contentFit="cover"
                    placeholder={FALLBACK} cachePolicy="memory-disk" />
                ) : (
                  <View style={styles.avatarInner}>
                    <Ionicons name="person-circle-outline" size={64} color={C.muted} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.avatarBadge} onPress={onOpenAddSheet}>
              <Ionicons name="add" size={12} color={C.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <StatColumn value={formatCount(eventsCount)} label={t.profile.events} />
            <StatColumn value={formatCount(followersCount)} label={t.profile.followers} />
            <StatColumn value={formatCount(groupsCount)} label={t.profile.groups} />
          </View>
        </View>

        {/* Bio */}
        <View style={styles.bioSection}>
          <Text style={styles.bioName}>{displayName}</Text>
          {bio ? <Text style={styles.bioText}>{bio}</Text> : null}
        </View>

        {/* Tags */}
        {profileTags.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
            {profileTags.map((tag) => (
              <View key={tag.id} style={[styles.tagChip, tag.type === 'brand' ? styles.tagBrand : styles.tagOutlined]}>
                <Text style={[styles.tagChipText, tag.type === 'brand' ? { color: C.white } : { color: C.whiteSoft }]}>
                  {tag.label}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={() => onNavigate('EditProfile')}>
            <Text style={styles.actionBtnText}>{t.profile.editProfile}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={onShareProfile}>
            <Text style={styles.actionBtnText}>{t.profile.share}</Text>
          </TouchableOpacity>
        </View>

        {/* Activity cards */}
        <View style={styles.activityRow}>
          <ActivityCard icon="flag-outline"    value={formatCount(eventsCount)}   label={t.profile.events_participations} accent />
          <ActivityCard icon="car-sport-outline" value={String(garageItems.length)} label={t.profile.cars_garage} />
          <ActivityCard icon="speedometer-outline" value={formatCount(trackdaysCount)} label={t.profile.trackdays} />
        </View>

        {/* Highlights */}
        <View style={styles.highlightsSection}>
          <Text style={styles.highlightsLabel}>{t.profile.highlights}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.highlightsScroll}>
            <TouchableOpacity style={styles.highlightItem} onPress={onOpenAddSheet}>
              <View style={[styles.highlightBubble, styles.highlightAddBubble]}>
                <Ionicons name="add" size={26} color={C.muted} />
              </View>
              <Text style={styles.highlightLabel}>{t.profile.new}</Text>
            </TouchableOpacity>
            {highlights.map((h) => (
              <TouchableOpacity key={h.id} style={styles.highlightItem} onPress={() => onOpenHighlight(h.id)}>
                <View style={styles.highlightBubble}>
                  <ExpoImage source={h.image} style={styles.highlightImage} contentFit="cover"
                    placeholder={FALLBACK} cachePolicy="memory-disk" />
                </View>
                <Text style={styles.highlightLabel} numberOfLines={1}>{h.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {([
            { key: 'garage',       icon: 'car-outline',  label: t.profile.garage },
            { key: 'publications', icon: 'grid-outline', label: t.profile.publications },
            { key: 'itineraires',  icon: 'map-outline',  label: t.profile.itineraires },
          ] as const).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity key={tab.key} style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => onTabChange(tab.key)}>
                <Ionicons name={tab.icon as any} size={14} color={isActive ? C.white : C.muted} />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Garage — liste pleine largeur */}
        {activeTab === 'garage' && (
          <View style={styles.garageList}>
            {garageItems.length === 0 ? (
              <View style={styles.emptyTab}>
                <Ionicons name="car-outline" size={38} color={C.muted} />
                <Text style={styles.emptyTabText}>Aucun véhicule</Text>
              </View>
            ) : (
              garageItems.map((car) => (
                <Pressable key={car.id} style={styles.garageCard} onPress={() => onCarPress(car.id)}>
                  <View style={styles.garageCardImageWrap}>
                    <ExpoImage source={car.image} style={styles.garageCardImage}
                      contentFit="cover" placeholder={FALLBACK} cachePolicy="memory-disk" />

                    {/* Badge certifié ou en attente */}
                    {car.estCertifie ? (
                      <View style={styles.cardBadge}>
                        <VerifiedBadge variant="certified" size="sm" />
                      </View>
                    ) : (
                      <Pressable
                        style={styles.certifyBtn}
                        onPress={() => onNavigate('Certification', { vehiculeId: car.id, vehiculeName: car.name })}
                        hitSlop={4}
                      >
                        <Ionicons name="shield-outline" size={11} color="rgba(255,255,255,0.7)" />
                      </Pressable>
                    )}
                  </View>

                  <View style={styles.garageCardBody}>
                    <AppText weight="bold" style={styles.garageCardTitle} numberOfLines={1}>{car.name}</AppText>
                    <AppText weight="regular" style={styles.garageCardSubtitle}>{car.year}</AppText>
                    {car.history.length > 0 && (
                      <ExpandableText
                        text={car.history}
                        numberOfLines={1}
                        style={styles.garageCardNotes}
                        expandLabel={t.profile.showMore ?? 'Voir plus'}
                        collapseLabel={t.profile.showLess ?? 'Voir moins'}
                      />
                    )}
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* Publications grid */}
        {activeTab === 'publications' && (
          <View style={styles.grid}>
            {posts.length === 0 ? (
              <View style={styles.emptyTab}>
                <Ionicons name="grid-outline" size={38} color={C.muted} />
                <Text style={styles.emptyTabText}>Aucune publication</Text>
              </View>
            ) : (
              posts.map((post: any) => (
                <Pressable
                  key={post.id}
                  style={styles.card}
                  onPress={() => {
                    if (pendingDeleteId === post.id) {
                      setPendingDeleteId(null);
                    } else {
                      onNavigate('PostDetail', {
                        id: post.id,
                        name: [post.brand, post.model].filter(Boolean).join(' ') || post.type || 'Publication',
                        image: post.image_urls?.[0] ?? '',
                        description: post.description ?? undefined,
                        date: post.created_at
                          ? new Date(post.created_at).toLocaleDateString('fr-FR')
                          : undefined,
                      });
                    }
                  }}
                >
                  <ExpoImage
                    source={post.image_urls?.[0]}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    placeholder={FALLBACK}
                    cachePolicy="memory-disk"
                  />

                  {/* Type badge */}
                  {post.type && (
                    <View style={styles.cardTypeBadge}>
                      <Ionicons name={(POST_TYPE_ICON[post.type] ?? 'ellipse') as any} size={10} color={C.white} />
                    </View>
                  )}

                  {/* Gradient overlay with stats */}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.82)']}
                    style={styles.cardOverlay}
                  >
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {[post.brand, post.model].filter(Boolean).join(' ') || post.type || '—'}
                    </Text>
                    <View style={styles.cardStats}>
                      <Ionicons name="heart" size={11} color={C.white} />
                      <Text style={styles.cardStatText}>{post.likes_count ?? 0}</Text>
                      <Ionicons name="chatbubble" size={11} color={C.white} />
                      <Text style={styles.cardStatText}>{post.comments_count ?? 0}</Text>
                    </View>
                  </LinearGradient>

                  {/* Delete controls */}
                  {pendingDeleteId === post.id ? (
                    <TouchableOpacity
                      style={styles.cardDeleteConfirm}
                      onPress={() => { onDeletePost(post.id); setPendingDeleteId(null); }}
                    >
                      <Text style={styles.cardDeleteConfirmText}>Supprimer</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.cardMenuBtn}
                      onPress={() => setPendingDeleteId(post.id)}
                      hitSlop={8}
                    >
                      <Text style={styles.cardMenuText}>···</Text>
                    </TouchableOpacity>
                  )}
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* Itinéraires */}
        {activeTab === 'itineraires' && (
          <View style={styles.routesTabWrap}>
            <View style={styles.routesActionsRow}>
              <Pressable style={styles.routesActionBtn} onPress={() => onNavigate('RecordRoute')}>
                <Ionicons name="navigate-outline" size={15} color={C.white} />
                <Text style={styles.routesActionBtnText}>{t.map.recordRoute}</Text>
              </Pressable>
              <Pressable
                style={[styles.routesActionBtn, styles.routesActionBtnGhost]}
                onPress={() => onNavigate('Maps', { screen: 'AddMapPoint' })}
              >
                <Ionicons name="add-outline" size={15} color={C.accent} />
                <Text style={[styles.routesActionBtnText, styles.routesActionBtnTextGhost]}>{t.map.typeRoute}</Text>
              </Pressable>
            </View>

            <View style={styles.routesSubTabRow}>
              {([
                { key: 'recorded' as const,  label: t.map.recordedRoutesTab },
                { key: 'published' as const, label: t.map.publishedRoutesTab },
                { key: 'favorites' as const, label: t.map.favoriteRoutesTab },
              ]).map((tab) => {
                const isActive = routesSubTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    style={[styles.routesSubTabChip, isActive && styles.routesSubTabChipActive]}
                    onPress={() => onRoutesSubTabChange(tab.key)}
                  >
                    <Text style={[styles.routesSubTabText, isActive && styles.routesSubTabTextActive]}>{tab.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {routesLoading ? (
              <ActivityIndicator color={C.accent} style={{ marginTop: 30 }} />
            ) : routesSubTab === 'recorded' ? (
              savedRoutes.length === 0 ? (
                <View style={styles.emptyTab}>
                  <Ionicons name="navigate-outline" size={34} color={C.muted} />
                  <Text style={styles.emptyTabText}>{t.map.noSavedRoutes}</Text>
                </View>
              ) : (
                savedRoutes.map((r: any) => (
                  <View key={r.id} style={styles.routeCard}>
                    <Text style={styles.routeCardTitle} numberOfLines={1}>{r.title}</Text>
                    <View style={styles.routeCardStatsRow}>
                      <Text style={styles.routeCardStat}>{Number(r.distance_km).toFixed(2)} km</Text>
                      <Text style={styles.routeCardStat}>
                        {Math.floor(r.duration_seconds / 60)} min
                      </Text>
                    </View>
                  </View>
                ))
              )
            ) : routesSubTab === 'published' ? (
              publishedRoutes.length === 0 ? (
                <View style={styles.emptyTab}>
                  <Ionicons name="flag-outline" size={34} color={C.muted} />
                  <Text style={styles.emptyTabText}>{t.map.noPublishedRoutes}</Text>
                </View>
              ) : (
                publishedRoutes.map((r: any) => (
                  <View key={r.id} style={styles.routeCard}>
                    <Text style={styles.routeCardTitle} numberOfLines={1}>{r.title}</Text>
                    {r.description ? (
                      <Text style={styles.routeCardDesc} numberOfLines={2}>{r.description}</Text>
                    ) : null}
                  </View>
                ))
              )
            ) : (
              favoriteRoutes.length === 0 ? (
                <View style={styles.emptyTab}>
                  <Ionicons name="bookmark-outline" size={34} color={C.muted} />
                  <Text style={styles.emptyTabText}>{t.map.noFavoriteRoutes}</Text>
                </View>
              ) : (
                favoriteRoutes.map((r: any) => (
                  <View key={r.id} style={styles.routeCard}>
                    <Text style={styles.routeCardTitle} numberOfLines={1}>{r.title}</Text>
                    {r.description ? (
                      <Text style={styles.routeCardDesc} numberOfLines={2}>{r.description}</Text>
                    ) : null}
                  </View>
                ))
              )
            )}
          </View>
        )}
      </ScrollView>

    </SafeAreaView>
  );
}

// =====================================================================
// VIEW 2 — Car Detail
// =====================================================================
function CarDetailView({
  car, onBack, insets, language,
}: {
  car: GarageCar;
  onBack: () => void;
  insets: ReturnType<typeof useSafeAreaInsets>;
  language: any;
}) {
  const navigation = useNavigation<any>();
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [heroRatio, setHeroRatio] = useState(4 / 5);
  const t = getTranslation(language);
  const images = car.images.length > 0 ? car.images : [car.image];
  const handleShare = () => Share.share({ message: `${car.name} (${car.year})` }).catch(() => {});
  const heroHeight = width / heroRatio;

  // Description technique : la voiture ne vaut pas être réduite à des cases de fiche produit —
  // moteur et boîte se lisent comme une phrase, pas comme un tableau de vente.
  const techLine = [car.year, car.body, car.specs.motor, car.specs.gearbox]
    .filter((v) => v && v !== '—')
    .join(' · ');

  return (
    <View style={styles.detailRoot}>
      {/* Hero — même traitement que la vue détaillée des publications : ratio réel, pas de recadrage forcé */}
      <View style={[styles.detailHero, { height: heroHeight }]}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) =>
            setCurrentImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))
          }>
          {images.map((img, idx) => (
            <View key={idx} style={{ width, height: heroHeight }}>
              <ExpoImage source={img} style={StyleSheet.absoluteFillObject} contentFit="cover"
                placeholder={FALLBACK} cachePolicy="memory-disk"
                onLoad={idx === 0 ? (e) => {
                  const { width: w, height: h } = e.source;
                  if (w && h) setHeroRatio(Math.min(Math.max(w / h, 0.66), 1.5));
                } : undefined}
              />
            </View>
          ))}
        </ScrollView>

        <View style={[styles.detailTopBar, { top: insets.top + 10 }]}>
          <Pressable style={styles.detailGlassBtn} onPress={onBack} hitSlop={10}>
            <Ionicons name="chevron-back" size={18} color={C.white} />
          </Pressable>
          <View style={styles.detailTopRight}>
            {images.length > 1 && (
              <View style={styles.detailCounterPill}>
                <AppText weight="semibold" style={styles.detailCounterText}>{currentImageIndex + 1} / {images.length}</AppText>
              </View>
            )}
            <Pressable style={styles.detailGlassBtn} onPress={handleShare} hitSlop={10}>
              <Feather name="share" size={15} color={C.white} />
            </Pressable>
          </View>
        </View>

        {car.estCertifie && (
          <View style={styles.detailSeal}>
            <Ionicons name="shield-checkmark" size={13} color={C.accent} />
            <AppText weight="bold" style={styles.detailSealText}>Certifié</AppText>
          </View>
        )}

        {images.length > 1 && (
          <View style={styles.dotRow}>
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, i === currentImageIndex && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>

      {/* Cluster d'instruments — juste l'essentiel, lecture façon tableau de bord */}
      <View style={styles.instrumentCluster}>
        <ClusterCell value={car.specs.km} label="Km" />
        <View style={styles.clusterDivider} />
        <ClusterCell value={car.power || '—'} label="Ch" />
      </View>

      {/* Fiche */}
      <ScrollView style={styles.detailSheet}
        contentContainerStyle={[styles.detailSheetContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}>

        <View style={styles.detailIdentityRow}>
          <AppText weight="extrabold" style={styles.detailTitle} numberOfLines={2}>{car.name}</AppText>
          <View style={styles.detailSubRow}>
            <Text style={styles.detailSubtitle}>{techLine}</Text>
            {car.specs.color && car.specs.color !== '—' && (
              <View style={styles.colorPill}>
                <AppText weight="semibold" style={styles.colorPillText}>{car.specs.color}</AppText>
              </View>
            )}
          </View>
        </View>

        <View style={styles.detailActionsRow}>
          <Pressable style={[styles.detailPillBtn, isFavorite && styles.detailPillBtnActive]}
            onPress={() => setIsFavorite((v) => !v)}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={15}
              color={isFavorite ? C.accent : C.whiteSoft} />
            <AppText weight="semibold" style={[styles.detailPillText, isFavorite && { color: C.accent }]}>{t.profile.favorites}</AppText>
          </Pressable>
          <Pressable style={styles.detailPillBtn} onPress={handleShare}>
            <Feather name="corner-up-right" size={14} color={C.whiteSoft} />
            <AppText weight="semibold" style={styles.detailPillText}>{t.profile.repost}</AppText>
          </Pressable>
          {!car.estCertifie && (
            <Pressable style={[styles.detailPillBtn, styles.detailPillBtnCertify]}
              onPress={() => navigation.navigate('Certification', { vehiculeId: car.id, vehiculeName: car.name })}>
              <Ionicons name="shield-outline" size={14} color={C.white} />
              <AppText weight="semibold" style={[styles.detailPillText, { color: C.white }]}>Certifier</AppText>
            </Pressable>
          )}
        </View>

        {car.history.length > 0 && (
          <View style={styles.logbookSection}>
            <AppText weight="bold" style={styles.logbookLabel}>Carnet de bord</AppText>
            <View style={styles.logbookCard}>
              <View style={styles.logbookDot} />
              <Text style={styles.logbookText}>{car.history}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatColumn({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ClusterCell({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.clusterCell}>
      <AppText weight="bold" style={styles.clusterValue} numberOfLines={1}>{value}</AppText>
      <Text style={styles.clusterLabel}>{label}</Text>
    </View>
  );
}

// =====================================================================
// Styles — Dark Theme
// =====================================================================
const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: C.bg },
  safeArea: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingTop: 0 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: PAD, paddingVertical: 10,
  },
  headerTitle: { fontSize: 17, color: C.white },

  profileRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: PAD, paddingTop: 10, paddingBottom: 8, gap: 16,
  },
  avatarContainer: { position: 'relative' },
  avatarRing: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 2.5, borderColor: C.accent, padding: 2, overflow: 'hidden',
  },
  avatarImage: { flex: 1, borderRadius: 35 },
  avatarInner: {
    flex: 1, borderRadius: 35, backgroundColor: C.bgCard,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: C.bg,
  },

  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statCol:  { alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: '700', color: C.white, marginBottom: 1 },
  statLabel: { fontSize: 10, color: C.muted },

  bioSection: { paddingHorizontal: PAD, paddingBottom: 8 },
  bioName: { fontSize: 13, fontWeight: '700', color: C.white, marginBottom: 2 },
  bioText: { fontSize: 11, color: C.whiteSoft, lineHeight: 16 },

  tagsScroll: { paddingHorizontal: PAD, gap: 6, paddingBottom: 10 },
  tagChip:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 18 },
  tagBrand:   { backgroundColor: C.accent },
  tagOutlined: { borderWidth: 1, borderColor: C.border },
  tagChipText: { fontSize: 11, fontWeight: '600' },

  actionRow: { flexDirection: 'row', paddingHorizontal: PAD, paddingBottom: 14, gap: 8 },
  actionBtn: {
    height: 32, borderRadius: 8, borderWidth: 1, borderColor: C.border,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8,
  },
  actionBtnText: { fontSize: 11, fontWeight: '600', color: C.whiteSoft },

  activityRow: { flexDirection: 'row', paddingHorizontal: PAD, gap: 8, marginBottom: 20 },
  activityCard: {
    flex: 1, borderRadius: 14, padding: 12, minHeight: 84,
    backgroundColor: C.bgCard,
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  activityCardAccent: {
    backgroundColor: C.accent,
    borderColor: 'transparent',
  },
  activityValue: { fontSize: 20, fontWeight: '800', color: C.white, marginBottom: 1 },
  activityLabel: { fontSize: 8, color: C.whiteSoft, fontWeight: '500', textAlign: 'center', letterSpacing: 0.2 },

  highlightsSection: { marginBottom: 0 },
  highlightsLabel: {
    fontSize: 10, fontWeight: '700', color: C.muted,
    paddingHorizontal: PAD, letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase',
  },
  highlightsScroll: { paddingHorizontal: PAD - 2, gap: 8, paddingBottom: 0 },
  highlightItem:   { alignItems: 'center', width: 64 },
  highlightBubble: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 2, borderColor: C.accent, overflow: 'hidden',
    marginBottom: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bgCard,
  },
  highlightAddBubble: { borderColor: C.border, borderWidth: 1.5, borderStyle: 'dashed' },
  highlightImage: { width: '100%', height: '100%' },
  highlightLabel: { fontSize: 9, color: C.whiteSoft, fontWeight: '500', textAlign: 'center' },

  // Onglets remontés — moins d'espace mort avant le contenu (Publications) qu'on veut voir sans scroller
  tabsRow: { flexDirection: 'row', marginTop: 6, borderBottomWidth: 0.5, borderBottomColor: C.border },
  tabItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, gap: 4, borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: C.white },
  tabText:       { fontSize: 10, color: C.muted, fontWeight: '500' },
  tabTextActive: { color: C.white, fontWeight: '700' },

  // 2-column grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP, paddingTop: CARD_GAP },

  // Garage — liste 1 colonne pleine largeur, image 16:9
  garageList: { paddingTop: CARD_GAP, gap: 14 },
  garageCard: {
    width: '100%',
    backgroundColor: C.bgCard,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: C.border,
  },
  garageCardImageWrap: { width: '100%', aspectRatio: 4 / 3 },
  garageCardImage: { width: '100%', height: '100%' },
  garageCardBody: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10, gap: 2 },
  garageCardTitle: { color: C.white, fontSize: 14 },
  garageCardSubtitle: { color: C.whiteSoft, fontSize: 11, marginBottom: 2 },
  garageCardNotes: { color: C.whiteSoft, fontSize: 12, lineHeight: 16 },

  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: C.bgCard,
    overflow: 'hidden',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 8,
    paddingBottom: 10,
  },
  cardTitle: { color: C.white, fontSize: 12, fontWeight: '700', marginBottom: 3 },
  cardSubtitle: { color: C.whiteSoft, fontSize: 10 },
  cardStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardStatText: { color: C.white, fontSize: 11, fontWeight: '600' },
  cardTypeBadge: {
    position: 'absolute', top: 6, left: 6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center',
  },
  cardBadge: {
    position: 'absolute', top: 6, right: 6,
  },
  certifyBtn: {
    position: 'absolute', top: 6, right: 6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  cardMenuBtn: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3,
  },
  cardMenuText: { fontSize: 11, color: C.white, fontWeight: '700', letterSpacing: 1 },
  cardDeleteConfirm: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: C.accent,
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3,
  },
  cardDeleteConfirmText: { fontSize: 10, color: C.white, fontWeight: '700' },

  emptyTab: { width: '100%', alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTabText: { color: C.muted, fontSize: 12 },

  // Itinéraires
  routesTabWrap: { width: '100%', paddingTop: 4, gap: 14 },
  routesActionsRow: { flexDirection: 'row', gap: 10 },
  routesActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: C.accent, borderRadius: 10, paddingVertical: 11,
  },
  routesActionBtnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.accent },
  routesActionBtnText: { fontSize: 12.5, fontWeight: '700', color: C.white },
  routesActionBtnTextGhost: { color: C.accent },

  routesSubTabRow: { flexDirection: 'row', gap: 8 },
  routesSubTabChip: {
    flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8,
    backgroundColor: C.bgCard, borderWidth: 0.5, borderColor: C.border,
  },
  routesSubTabChipActive: { backgroundColor: C.bgElevated, borderColor: C.accent },
  routesSubTabText: { fontSize: 11, fontWeight: '600', color: C.muted },
  routesSubTabTextActive: { color: C.white },

  routeCard: {
    backgroundColor: C.bgCard, borderRadius: 12, borderWidth: 0.5, borderColor: C.border,
    padding: 14, marginBottom: 10,
  },
  routeCardTitle: { fontSize: 14, fontWeight: '700', color: C.white, marginBottom: 4 },
  routeCardStatsRow: { flexDirection: 'row', gap: 14 },
  routeCardStat: { fontSize: 12, color: C.whiteSoft },
  routeCardDesc: { fontSize: 12, color: C.whiteSoft, lineHeight: 17 },

  // Car Detail — hero immersif + cluster d'instruments + carnet de bord
  detailRoot: { flex: 1, backgroundColor: C.bg },
  detailHero: { position: 'relative', backgroundColor: C.bgCard },
  detailTopBar: {
    position: 'absolute', left: PAD, right: PAD,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  detailTopRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailGlassBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(10,4,4,0.5)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center', alignItems: 'center',
  },
  detailCounterPill: {
    paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(10,4,4,0.5)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  detailCounterText: { fontSize: 10, color: 'rgba(255,255,255,0.9)' },
  detailSeal: {
    position: 'absolute', left: PAD, bottom: 18,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 11, borderRadius: 20,
    backgroundColor: 'rgba(10,4,4,0.55)',
    borderWidth: 1, borderColor: 'rgba(229,9,20,0.5)',
  },
  detailSealText: { fontSize: 10, color: C.accent, letterSpacing: 0.5, textTransform: 'uppercase' },
  dotRow: {
    position: 'absolute', bottom: 10, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 5,
  },
  dot:       { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: C.white, width: 14 },

  instrumentCluster: {
    flexDirection: 'row',
    marginHorizontal: PAD,
    marginTop: -22,
    backgroundColor: C.bgCard,
    borderRadius: 16,
    borderWidth: 0.5, borderColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 10,
  },
  clusterCell: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  clusterDivider: { width: StyleSheet.hairlineWidth, backgroundColor: C.border, marginVertical: 10 },
  clusterValue: { fontSize: 13, color: C.white },
  clusterLabel: { fontSize: 8.5, color: C.muted, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 },

  detailSheet: { flex: 1, backgroundColor: C.bg },
  detailSheetContent: { padding: PAD, paddingTop: 18 },
  detailIdentityRow: { marginBottom: 16 },
  detailTitle: { fontSize: 21, color: C.white, lineHeight: 26, marginBottom: 6 },
  detailSubRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  detailSubtitle: { fontSize: 12, color: C.muted },
  colorPill: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    backgroundColor: C.bgElevated, borderWidth: 0.5, borderColor: C.border,
  },
  colorPillText: { fontSize: 10, color: C.whiteSoft },

  detailActionsRow: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  detailPillBtn: {
    flex: 1, height: 38, borderRadius: 11, borderWidth: 1, borderColor: C.border,
    backgroundColor: C.bgElevated,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  detailPillBtnActive: { borderColor: C.accent, backgroundColor: 'rgba(229,9,20,0.1)' },
  // CTA plein (pas juste teinté) pour se distinguer du bouton Favori et donner du poids à l'action
  detailPillBtnCertify: { borderColor: C.accent, backgroundColor: C.accent },
  detailPillText: { fontSize: 11.5, color: C.whiteSoft },

  logbookSection: {},
  logbookLabel: {
    fontSize: 10, color: C.accent, letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 10,
  },
  logbookCard: {
    flexDirection: 'row', gap: 10,
    backgroundColor: C.bgElevated, borderRadius: 12, padding: 14,
    borderWidth: 0.5, borderColor: C.border,
  },
  logbookDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent, marginTop: 6 },
  logbookText: { flex: 1, fontSize: 12.5, color: C.whiteSoft, lineHeight: 19 },

  // Bottom sheets
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.bgCard,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 16,
  },
  sheetInner:  { paddingHorizontal: PAD, paddingTop: 12 },
  dragHandle:  {
    alignSelf: 'center', width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.whiteGhost, marginBottom: 12,
  },
  sheetTitle:    { fontSize: 13, fontWeight: '700', color: C.white, marginBottom: 8, paddingHorizontal: 10 },
  sheetItem:     {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, gap: 12,
  },
  sheetItemText: { fontSize: 13, fontWeight: '500', color: C.whiteSoft },
  sheetItemHint: { fontSize: 11, color: C.muted, marginTop: 1 },
  sheetIcon:     { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sheetDivider:  { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginVertical: 4 },

  avatarPreviewSection: {
    alignItems: 'center', paddingHorizontal: PAD, paddingVertical: 16,
    backgroundColor: C.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
  },
  avatarPreviewImage: {
    width: 200, height: 200, borderRadius: 100,
    borderWidth: 3, borderColor: C.accent, marginBottom: 16,
  },
  avatarPreviewButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  avatarCancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 8,
    borderWidth: 1, borderColor: C.border, alignItems: 'center',
  },
  avatarCancelText: { fontSize: 14, fontWeight: '600', color: C.whiteSoft },
  avatarConfirmBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 8,
    backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  avatarConfirmText: { fontSize: 14, fontWeight: '600', color: C.white },
});
