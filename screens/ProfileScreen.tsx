import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Animated,
  Share,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context/AppContext';
import { getTranslation } from '../i18n';
import type { ProfileTag } from '../context/AppContext';

const { width } = Dimensions.get('window');

const C = {
  bg: '#FFFFFF',
  dark: '#121212',
  accent: '#D91D2F',
  muted: '#9E9E9E',
  fieldBg: 'rgba(18,18,18,0.05)',
  border: '#F0F0F0',
};

const PAD = 16;
const PUB_GAP = 2;
const PUB_SIZE = Math.floor((width - PUB_GAP * 2) / 3);
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
}

// =====================================================================
// Root Screen
// =====================================================================
export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { language, user, updateProfileAvatar, markPostDeleted } = useAppContext();
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
  const [refreshing, setRefreshing] = useState(false);
  const [myPublications, setMyPublications] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<{ id: string; name: string; image: string }[]>([]);
  const [garageItems, setGarageItems] = useState<GarageCar[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('posts')
      .select('id, type, image_urls, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setMyPublications(data); });
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('garage_vehicles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
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
        })));
      });
  }, [user?.id]);

  const selectedCar = garageItems.find((c) => c.id === selectedCarId) ?? null;

  const profileTags: ProfileTag[] = user?.tags ?? [];

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  // ── Menu handlers ──
  const openMenu = () => {
    setMenuVisible(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
  };
  const closeMenu = () => {
    Animated.timing(slideAnim, { toValue: 600, duration: 280, useNativeDriver: true }).start(() =>
      setMenuVisible(false)
    );
  };

  // ── Add sheet handlers ──
  const openAddSheet = () => {
    setAddSheetVisible(true);
    Animated.spring(addSlideAnim, { toValue: 0, useNativeDriver: true }).start();
  };
  const closeAddSheet = () => {
    Animated.timing(addSlideAnim, { toValue: 600, duration: 260, useNativeDriver: true }).start(() =>
      setAddSheetVisible(false)
    );
  };


  const handleAddGarage = () => {
    closeAddSheet();
    navigation.navigate('AddVehicle');
  };

  const handleAddPublication = () => {
    closeAddSheet();
    navigation.navigate('CreatePost');
  };

  const handleAddStory = () => {
    closeAddSheet();
    navigation.navigate('CreateStory');
  };

  const pickAvatar = useCallback(async () => {
    console.log('[Avatar:pick] start');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log('[Avatar:pick] permission =', status);
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
    console.log('[Avatar:pick] canceled =', result.canceled);
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      console.log('[Avatar:pick] uri prefix =', asset.uri?.substring(0, 60));
      console.log('[Avatar:pick] base64 field available =', !!asset.base64, 'length =', asset.base64?.length ?? 0);

      let b64: string | null = asset.base64 ?? null;

      // Web: uri is a data URI like "data:image/png;base64,iVBOR..." when base64 field is absent
      if (!b64 && asset.uri?.startsWith('data:')) {
        console.log('[Avatar:pick] extracting base64 from data URI');
        const comma = asset.uri.indexOf(',');
        b64 = comma >= 0 ? asset.uri.substring(comma + 1) : null;
      }
      // Strip prefix if the base64 field itself contains it (some environments)
      if (b64 && b64.includes(';base64,')) {
        console.log('[Avatar:pick] stripping data URI prefix from base64 field');
        b64 = b64.split(';base64,')[1] ?? b64;
      }

      console.log('[Avatar:pick] final b64 length =', b64?.length ?? 0);
      setPendingAvatarUri(asset.uri);
      setPendingAvatarBase64(b64);
    }
  }, []);

  const confirmAvatar = useCallback(async () => {
    console.log('[Avatar:confirm] start — pendingAvatarBase64 length =', pendingAvatarBase64?.length ?? 0, '| user.id =', user?.id);
    if (!pendingAvatarBase64 || !user?.id) {
      console.warn('[Avatar:confirm] EARLY RETURN — missing base64 or user.id');
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const filePath = `${user.id}/avatar.jpg`;
      console.log('[Avatar:confirm] filePath =', filePath);

      console.log('[Avatar:confirm] converting base64 → Uint8Array...');
      const binaryStr = atob(pendingAvatarBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      console.log('[Avatar:confirm] bytes.length =', bytes.length);

      console.log('[Avatar:confirm] uploading to Supabase Storage bucket=avatars...');
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('avatars')
        .upload(filePath, bytes, { upsert: true, contentType: 'image/jpeg' });
      console.log('[Avatar:confirm] upload result — error:', uploadError, '| data:', uploadData);

      if (uploadError) {
        console.error('[Avatar:confirm] UPLOAD FAILED:', uploadError.message);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const finalUrl = `${urlData.publicUrl}?v=${Date.now()}`;
      console.log('[Avatar:confirm] public URL =', finalUrl);

      console.log('[Avatar:confirm] calling updateProfileAvatar...');
      await updateProfileAvatar(finalUrl);
      console.log('[Avatar:confirm] updateProfileAvatar done — clearing pending state');

      setPendingAvatarUri(null);
      setPendingAvatarBase64(null);
    } catch (e) {
      console.error('[Avatar:confirm] EXCEPTION:', e);
      Alert.alert('Erreur', 'Impossible de mettre à jour la photo.');
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [pendingAvatarBase64, user?.id, updateProfileAvatar]);

  const cancelAvatar = useCallback(() => {
    setPendingAvatarUri(null);
    setPendingAvatarBase64(null);
  }, []);

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

  const handleDeleteHighlight = (id: string) => {
    Alert.alert(t.profile.delete_highlight, t.profile.delete_confirm, [
      { text: t.profile.cancel, style: 'cancel' },
      {
        text: t.profile.delete,
        style: 'destructive',
        onPress: () => setHighlights((prev) => prev.filter((h) => h.id !== id)),
      },
    ]);
  };

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
          onNavigate={(screen) => navigation.navigate(screen)}
          onShareProfile={handleShareProfile}
          onRefresh={onRefresh}
          refreshing={refreshing}
          highlights={highlights}
          onDeleteHighlight={handleDeleteHighlight}
          language={language}
          user={user}
          posts={myPublications}
          profileTags={profileTags}
          garageItems={garageItems}
          pendingAvatarUri={pendingAvatarUri}
          isUploadingAvatar={isUploadingAvatar}
          onPickAvatar={pickAvatar}
          onConfirmAvatar={confirmAvatar}
          onCancelAvatar={cancelAvatar}
          onDeletePost={handleDeletePost}
        />
      )}

      {/* Menu overlay */}
      {menuVisible && <Pressable style={styles.overlay} onPress={closeMenu} />}
      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={[styles.sheetInner, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.dragHandle} />
          <Pressable style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: C.fieldBg }]}
            onPress={() => { closeMenu(); navigation.navigate('Settings'); }}>
            <Ionicons name="settings-outline" size={20} color={C.dark} />
            <Text style={styles.sheetItemText}>{t.profile.settings}</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: C.fieldBg }]}
            onPress={() => { closeMenu(); navigation.navigate('Activity'); }}>
            <Ionicons name="notifications-outline" size={20} color={C.dark} />
            <Text style={styles.sheetItemText}>{t.profile.activity}</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: C.fieldBg }]}
            onPress={() => { closeMenu(); navigation.navigate('Saved'); }}>
            <Ionicons name="bookmark-outline" size={20} color={C.dark} />
            <Text style={styles.sheetItemText}>{t.profile.saved}</Text>
          </Pressable>
          <View style={styles.sheetDivider} />
          <Pressable style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: 'rgba(217,29,47,0.05)' }]}
            onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={C.accent} />
            <Text style={[styles.sheetItemText, { color: C.accent }]}>{t.profile.logout}</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Add content overlay */}
      {addSheetVisible && <Pressable style={styles.overlay} onPress={closeAddSheet} />}
      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: addSlideAnim }] }]}>
        <View style={[styles.sheetInner, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.dragHandle} />
          <Text style={styles.sheetTitle}>Ajouter du contenu</Text>
          <Pressable style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: C.fieldBg }]}
            onPress={handleAddGarage}>
            <View style={[styles.sheetIcon, { backgroundColor: C.dark }]}>
              <Ionicons name="car-sport-outline" size={18} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetItemText}>Ajouter au garage</Text>
              <Text style={styles.sheetItemHint}>Ajouter un véhicule à votre collection</Text>
            </View>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: C.fieldBg }]}
            onPress={handleAddPublication}>
            <View style={[styles.sheetIcon, { backgroundColor: C.accent }]}>
              <Ionicons name="grid-outline" size={18} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetItemText}>Nouvelle publication</Text>
              <Text style={styles.sheetItemHint}>Partager une photo avec vos abonnés</Text>
            </View>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.sheetItem, pressed && { backgroundColor: C.fieldBg }]}
            onPress={handleAddStory}>
            <View style={[styles.sheetIcon, { backgroundColor: '#6C63FF' }]}>
              <Ionicons name="camera-outline" size={18} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetItemText}>Nouvelle story / highlight</Text>
              <Text style={styles.sheetItemHint}>Ajouter une photo à la une</Text>
            </View>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

// =====================================================================
// VIEW 1: Profile Grid
// =====================================================================
function ProfileGridView({
  insets,
  activeTab,
  onTabChange,
  onCarPress,
  onOpenMenu,
  onOpenAddSheet,
  onNavigate,
  onShareProfile,
  onRefresh,
  refreshing,
  highlights,
  onDeleteHighlight,
  language,
  user,
  posts,
  profileTags,
  garageItems,
  pendingAvatarUri,
  isUploadingAvatar,
  onPickAvatar,
  onConfirmAvatar,
  onCancelAvatar,
  onDeletePost,
}: {
  insets: ReturnType<typeof useSafeAreaInsets>;
  activeTab: string;
  onTabChange: (tab: 'garage' | 'publications' | 'itineraires') => void;
  onCarPress: (id: string) => void;
  onOpenMenu: () => void;
  onOpenAddSheet: () => void;
  onNavigate: (screen: string) => void;
  onShareProfile: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  highlights: { id: string; name: string; image: string }[];
  onDeleteHighlight: (id: string) => void;
  language: any;
  user: any;
  posts: any[];
  profileTags: ProfileTag[];
  garageItems: GarageCar[];
  pendingAvatarUri: string | null;
  isUploadingAvatar: boolean;
  onPickAvatar: () => void;
  onConfirmAvatar: () => void;
  onCancelAvatar: () => void;
  onDeletePost: (postId: string) => void;
}) {
  const t = getTranslation(language);
  const username = user?.username ?? '';
  const displayName = user?.displayName ?? username;
  const bio = user?.bio ?? '';
  const avatarUri = user?.avatar || null;
  const followersCount = user?.followersCount ?? 0;
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const formatCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={styles.headerTitle}>@{username}</Text>
          <TouchableOpacity style={styles.headerMenuBtn} onPress={onOpenMenu}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="menu" size={22} color={C.dark} />
          </TouchableOpacity>
        </View>

        {/* ── Pending avatar preview (full-width, inline) ── */}
        {pendingAvatarUri && (
          <View style={styles.avatarPreviewSection}>
            <ExpoImage
              source={pendingAvatarUri}
              style={styles.avatarPreviewImage}
              contentFit="cover"
            />
            <View style={styles.avatarPreviewButtons}>
              <TouchableOpacity
                style={styles.avatarCancelBtn}
                onPress={onCancelAvatar}
                disabled={isUploadingAvatar}
              >
                <Text style={styles.avatarCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.avatarConfirmBtn}
                onPress={onConfirmAvatar}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <Text style={styles.avatarConfirmText}>Confirmer</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Profile row ── */}
        <View style={styles.profileRow}>
          {/* Avatar — tap = changer la photo */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={onPickAvatar}>
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
            {/* Badge "+" → add content */}
            <TouchableOpacity style={styles.avatarBadge} onPress={onOpenAddSheet}>
              <Ionicons name="add" size={12} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Stats — ordre: Événements | Abonnés | Groupes */}
          <View style={styles.statsRow}>
            <StatColumn value="0" label={t.profile.events} />
            <StatColumn value={formatCount(followersCount)} label={t.profile.followers} />
            <StatColumn value="0" label={t.profile.groups} />
          </View>
        </View>

        {/* ── Bio ── */}
        <View style={styles.bioSection}>
          <Text style={styles.bioName}>{displayName}</Text>
          <Text style={styles.bioText}>{bio}</Text>
        </View>

        {/* ── Tags ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
          {profileTags.map((tag) => (
            <View key={tag.id} style={[styles.tagChip, tag.type === 'brand' ? styles.tagBrand : styles.tagOutlined]}>
              <Text style={[styles.tagChipText, tag.type === 'brand' ? styles.tagBrandText : styles.tagOutlinedText]}>
                {tag.label}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* ── Action buttons ── */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={() => onNavigate('EditProfile')}>
            <Text style={styles.actionBtnText}>{t.profile.editProfile}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { flex: 1 }]} onPress={onShareProfile}>
            <Text style={styles.actionBtnText}>{t.profile.share}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Activity cards ── */}
        <View style={styles.activityRow}>
          {[
            { value: '0', label: t.profile.events_participations, bg: C.accent },
            { value: String(garageItems.length), label: t.profile.cars_garage, bg: C.dark },
            { value: '0', label: t.profile.trackdays, bg: C.dark },
          ].map((card, i) => (
            <View key={i} style={[styles.activityCard, { backgroundColor: card.bg }]}>
              <Text style={styles.activityValue}>{card.value}</Text>
              <Text style={styles.activityLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Highlights ── */}
        <View style={styles.highlightsSection}>
          <Text style={styles.highlightsLabel}>{t.profile.highlights}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.highlightsScroll}>
            {/* Add highlight */}
            <TouchableOpacity style={styles.highlightItem} onPress={onOpenAddSheet}>
              <View style={[styles.highlightBubble, styles.highlightAddBubble]}>
                <Ionicons name="add" size={26} color={C.muted} />
              </View>
              <Text style={styles.highlightLabel}>{t.profile.new}</Text>
            </TouchableOpacity>

            {highlights.map((h) => (
              <TouchableOpacity key={h.id} style={styles.highlightItem}
                onLongPress={() => onDeleteHighlight(h.id)} delayLongPress={500}>
                <View style={styles.highlightBubble}>
                  <ExpoImage source={h.image} style={styles.highlightImage} contentFit="cover"
                    placeholder={FALLBACK} cachePolicy="memory-disk" />
                </View>
                <Text style={styles.highlightLabel} numberOfLines={1}>{h.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Tabs ── */}
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
                <Ionicons name={tab.icon as any} size={14} color={isActive ? C.dark : C.muted} />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Garage — grille 3 colonnes identique aux publications ── */}
        {activeTab === 'garage' && (
          <View style={styles.pubGrid}>
            {garageItems.length === 0 ? (
              <View style={styles.emptyTab} />
            ) : (
              garageItems.map((car) => (
                <TouchableOpacity key={car.id} style={styles.pubItem}
                  onPress={() => onCarPress(car.id)} activeOpacity={0.9}>
                  <ExpoImage source={car.image} style={StyleSheet.absoluteFillObject}
                    contentFit="cover" placeholder={FALLBACK} cachePolicy="memory-disk" />
                  <View style={styles.pubItemGradient} />
                  <View style={styles.pubItemMeta}>
                    <Text style={styles.pubItemName} numberOfLines={1}>{car.name}</Text>
                    <Text style={styles.pubItemYear}>{car.year}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* ── Publications ── */}
        {activeTab === 'publications' && (
          <View style={styles.pubGrid}>
            {posts.length === 0 ? (
              <View style={styles.emptyTab} />
            ) : (
              posts.map((post: any) => (
                <Pressable key={post.id} style={styles.pubItem} onPress={() => setPendingDeleteId(null)}>
                  <ExpoImage
                    source={post.image_urls?.[0] ?? post.photos?.[0] ?? post.image}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                    placeholder={FALLBACK}
                    cachePolicy="memory-disk"
                  />
                  {post.type && (
                    <View style={styles.pubTypeBadge}>
                      <Ionicons name={(POST_TYPE_ICON[post.type] ?? 'ellipse') as any} size={10} color="#FFF" />
                    </View>
                  )}
                  {pendingDeleteId === post.id ? (
                    <TouchableOpacity
                      style={styles.pubDeleteConfirmBtn}
                      onPress={() => { onDeletePost(post.id); setPendingDeleteId(null); }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.pubDeleteConfirmText}>Supprimer</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.pubMenuBtn}
                      onPress={() => setPendingDeleteId(post.id)}
                      hitSlop={6}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.pubMenuText}>···</Text>
                    </TouchableOpacity>
                  )}
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* ── Itinéraires ── */}
        {activeTab === 'itineraires' && (
          <View style={styles.emptyTab}>
            <Ionicons name="map-outline" size={38} color={C.muted} />
            <Text style={styles.emptyTabText}>Bientôt disponible</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================================================================
// VIEW 2: Car Detail
// =====================================================================
function CarDetailView({
  car, onBack, insets, language,
}: {
  car: GarageCar;
  onBack: () => void;
  insets: ReturnType<typeof useSafeAreaInsets>;
  language: any;
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const t = getTranslation(language);
  const images = car.images.length > 0 ? car.images : [car.image];

  const handleShare = async () => {
    try {
      await Share.share({ message: `${car.name} (${car.year}) — ${t.profile.discover}`, title: car.name });
    } catch (_) {}
  };

  return (
    <View style={styles.detailRoot}>
      {/* Image slider */}
      <View style={styles.detailImageSection}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) =>
            setCurrentImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))
          }>
          {images.map((img, idx) => (
            <View key={idx} style={{ width, height: 300 }}>
              <ExpoImage source={img} style={StyleSheet.absoluteFillObject} contentFit="cover"
                placeholder={FALLBACK} cachePolicy="memory-disk" />
            </View>
          ))}
        </ScrollView>

        <View style={styles.detailImageDim} />

        {/* Counter */}
        <View style={[styles.detailTopBar, { top: insets.top + 10 }]}>
          <Text style={styles.imageCounter}>{currentImageIndex + 1} / {images.length}</Text>
        </View>

        {/* Dots */}
        {images.length > 1 && (
          <View style={styles.dotRow}>
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, i === currentImageIndex && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>

      {/* White sheet */}
      <ScrollView style={styles.detailSheet}
        contentContainerStyle={[styles.detailSheetContent, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}>

        {/* Back + share */}
        <View style={styles.detailBackRowContainer}>
          <TouchableOpacity style={styles.detailBackRow} onPress={onBack}>
            <Ionicons name="chevron-back" size={16} color={C.muted} />
            <Text style={styles.detailBackText}>{t.profile.back_to_garage}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.detailShareBtn} onPress={handleShare}>
            <Feather name="share" size={16} color={C.dark} />
          </TouchableOpacity>
        </View>

        <Text style={styles.detailTitle} numberOfLines={2}>{car.name}</Text>
        <Text style={styles.detailSubtitle}>{car.year} · {car.body} · {car.power}</Text>

        <View style={styles.specsGrid}>
          <SpecCard value={car.specs.km} label={t.profile.kilometer} />
          <SpecCard value={car.specs.motor} label={t.profile.motorization} />
          <SpecCard value={car.specs.color} label={t.profile.color} />
          <SpecCard value={car.specs.gearbox} label={t.profile.transmission} />
        </View>

        <View style={styles.detailActionsRow}>
          <TouchableOpacity style={[styles.detailActionBtn, isFavorite && styles.detailActionBtnFav]}
            onPress={() => setIsFavorite((v) => !v)}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={14}
              color={isFavorite ? C.accent : C.dark} />
            <Text style={[styles.detailActionText, isFavorite && { color: C.accent }]}>{t.profile.favorites}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.detailActionBtn} onPress={handleShare}>
            <Feather name="corner-up-right" size={13} color={C.dark} />
            <Text style={styles.detailActionText}>{t.profile.repost}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.detailActionBtn, { flex: 0, paddingHorizontal: 16 }]}>
            <Text style={styles.detailActionText}>•••</Text>
          </TouchableOpacity>
        </View>

        {car.history.length > 0 && (
          <View style={styles.histSection}>
            <Text style={styles.histLabel}>{t.profile.history}</Text>
            <Text style={styles.histText}>{car.history}</Text>
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

function SpecCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.specCard}>
      <Text style={styles.specValue}>{value}</Text>
      <Text style={styles.specLabel}>{label}</Text>
    </View>
  );
}

// =====================================================================
// Styles
// =====================================================================
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  safeArea: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingTop: 0 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: PAD, paddingVertical: 10,
  },
  headerLeft: { width: 28 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', color: C.dark },
  headerMenuBtn: { width: 28, alignItems: 'flex-end' },

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
    flex: 1, borderRadius: 35, backgroundColor: '#1A1A1A',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitials: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1 },
  avatarBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: C.bg,
  },

  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statCol: { alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: '700', color: C.dark, marginBottom: 1 },
  statLabel: { fontSize: 10, color: C.muted },

  bioSection: { paddingHorizontal: PAD, paddingBottom: 8 },
  bioName: { fontSize: 13, fontWeight: '700', color: C.dark, marginBottom: 2 },
  bioText: { fontSize: 11, color: C.dark, lineHeight: 16 },

  tagsScroll: { paddingHorizontal: PAD, gap: 6, paddingBottom: 10 },
  tagChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 18 },
  tagBrand: { backgroundColor: C.accent },
  tagOutlined: { borderWidth: 1, borderColor: '#CCCCCC' },
  tagChipText: { fontSize: 11, fontWeight: '600' },
  tagBrandText: { color: '#FFFFFF' },
  tagOutlinedText: { color: C.dark },

  actionRow: { flexDirection: 'row', paddingHorizontal: PAD, paddingBottom: 14, gap: 8 },
  actionBtn: {
    height: 30, borderRadius: 8, borderWidth: 1, borderColor: '#CCCCCC',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8,
  },
  actionBtnText: { fontSize: 11, fontWeight: '600', color: C.dark },

  activityRow: { flexDirection: 'row', paddingHorizontal: PAD, gap: 6, marginBottom: 20 },
  activityCard: { flex: 1, borderRadius: 12, padding: 10, minHeight: 76, justifyContent: 'flex-end' },
  activityValue: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 2 },
  activityLabel: { fontSize: 9, color: '#FFF', fontWeight: '500', opacity: 0.9 },

  highlightsSection: { marginBottom: 4 },
  highlightsLabel: {
    fontSize: 10, fontWeight: '700', color: C.muted,
    paddingHorizontal: PAD, letterSpacing: 0.6, marginBottom: 10, textTransform: 'uppercase',
  },
  highlightsScroll: { paddingHorizontal: PAD - 2, gap: 8, paddingBottom: 4 },
  highlightItem: { alignItems: 'center', width: 64 },
  highlightBubble: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 2, borderColor: C.accent, overflow: 'hidden',
    marginBottom: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: C.fieldBg,
  },
  highlightAddBubble: { borderColor: '#CCCCCC', borderWidth: 1.5, borderStyle: 'dashed' },
  highlightImage: { width: '100%', height: '100%' },
  highlightLabel: { fontSize: 9, color: C.dark, fontWeight: '500', textAlign: 'center' },

  tabsRow: { flexDirection: 'row', marginTop: 16 },
  tabItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, gap: 4, borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: C.dark },
  tabText: { fontSize: 10, color: C.muted, fontWeight: '500' },
  tabTextActive: { color: C.dark, fontWeight: '700' },

  // Publications + Garage unified grid
  pubGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: PUB_GAP, paddingTop: 2 },
  pubItem: { width: PUB_SIZE, height: PUB_SIZE, backgroundColor: C.fieldBg, position: 'relative', overflow: 'hidden' },
  pubItemGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // gradient-like overlay using a semi-transparent bottom section
  },
  pubItemMeta: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 4, backgroundColor: 'rgba(0,0,0,0.45)' },
  pubItemName: { fontSize: 9, fontWeight: '700', color: '#FFF' },
  pubItemYear: { fontSize: 8, color: 'rgba(255,255,255,0.8)' },
  pubTypeBadge: {
    position: 'absolute', top: 5, left: 5,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center',
  },
  pubMenuBtn: {
    position: 'absolute', top: 4, right: 4, zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3,
  },
  pubMenuText: { fontSize: 11, color: '#FFF', fontWeight: '700', letterSpacing: 1 },
  pubDeleteConfirmBtn: {
    position: 'absolute', top: 4, right: 4, zIndex: 10,
    backgroundColor: '#D91D2F',
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3,
  },
  pubDeleteConfirmText: { fontSize: 10, color: '#FFF', fontWeight: '700' },

  emptyTab: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTabText: { color: C.muted, fontSize: 12 },

  // Car Detail
  detailRoot: { flex: 1, backgroundColor: C.bg },
  detailImageSection: { height: 300, position: 'relative' },
  detailImageDim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)' },
  detailTopBar: {
    position: 'absolute', right: PAD, left: PAD,
    flexDirection: 'row', justifyContent: 'flex-end',
  },
  imageCounter: {
    fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  dotRow: {
    position: 'absolute', bottom: 10, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 5,
  },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#FFF', width: 14 },
  detailSheet: {
    flex: 1, backgroundColor: C.bg,
    borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -20,
  },
  detailSheetContent: { padding: PAD, paddingTop: 12 },
  detailBackRowContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  detailBackRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  detailBackText: { fontSize: 11, color: C.muted, fontWeight: '500' },
  detailShareBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: C.fieldBg,
    justifyContent: 'center', alignItems: 'center',
  },
  detailTitle: { fontSize: 19, fontWeight: '800', color: C.dark, lineHeight: 24, marginBottom: 4 },
  detailSubtitle: { fontSize: 11, color: C.muted, marginBottom: 14 },
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  specCard: { width: '48%', backgroundColor: C.fieldBg, borderRadius: 10, padding: 12 },
  specValue: { fontSize: 14, fontWeight: '700', color: C.dark, marginBottom: 2 },
  specLabel: { fontSize: 9, color: C.muted },
  detailActionsRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  detailActionBtn: {
    flex: 1, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#DDD',
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5,
  },
  detailActionBtnFav: { borderColor: C.accent, backgroundColor: 'rgba(217,29,47,0.06)' },
  detailActionText: { fontSize: 11, fontWeight: '600', color: C.dark },
  histSection: { backgroundColor: C.fieldBg, borderRadius: 12, padding: 14 },
  histLabel: { fontSize: 9, fontWeight: '700', color: C.accent, letterSpacing: 0.8, marginBottom: 7 },
  histText: { fontSize: 12, color: C.dark, lineHeight: 18 },

  // Bottom sheets
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 16,
  },
  sheetInner: { paddingHorizontal: PAD, paddingTop: 12 },
  dragHandle: {
    alignSelf: 'center', width: 36, height: 4, borderRadius: 2,
    backgroundColor: C.border, marginBottom: 12,
  },
  sheetTitle: { fontSize: 13, fontWeight: '700', color: C.dark, marginBottom: 8, paddingHorizontal: 10 },
  sheetItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, gap: 12,
  },
  sheetItemText: { fontSize: 13, fontWeight: '500', color: C.dark },
  sheetItemHint: { fontSize: 11, color: C.muted, marginTop: 1 },
  sheetIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sheetDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginVertical: 4 },

  avatarPreviewSection: {
    alignItems: 'center',
    paddingHorizontal: PAD,
    paddingVertical: 16,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  avatarPreviewImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: C.accent,
    marginBottom: 16,
  },
  avatarPreviewButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  avatarCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  avatarCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.dark,
  },
  avatarConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  avatarConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  });
