import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Share,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context';
import type { HomeStackParamList } from '../navigation/HomeStackNavigator';

const { width } = Dimensions.get('window');

const C = {
  bg:         '#140102',
  bgCard:     '#1F0808',
  bgElevated: '#2A0A0A',
  dark:       '#140102',
  accent:     '#E50914',
  muted:      'rgba(255,255,255,0.45)',
  fieldBg:    'rgba(255,255,255,0.07)',
  border:     'rgba(255,255,255,0.12)',
  white:      '#FFFFFF',
  whiteSoft:  'rgba(255,255,255,0.7)',
};

const PAD = 16;
const CARD_GAP    = 1;
const CARD_WIDTH  = Math.floor((width - CARD_GAP) / 2);
const CARD_HEIGHT = Math.floor(CARD_WIDTH * 5 / 4);
const FALLBACK = require('../assets/logo_vroom_Couleur.png');

const POST_TYPE_ICON: Record<string, string> = {
  track: 'speedometer-outline',
  road_trip: 'map-outline',
  meet: 'people-outline',
  daily: 'car-outline',
  build: 'construct-outline',
  spotted: 'eye-outline',
};

type RouteType = RouteProp<HomeStackParamList, 'UserProfile'>;
type PostThumb = { id: string; image_urls: string[] | null; type?: string };
type GarageVehicle = { id: string; image_url: string | null; brand: string; model: string; year: number | null };

function StatColumn({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function UserProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteType>();
  const { userId, username } = route.params;
  const { user } = useAppContext();

  const [profile, setProfile] = useState<{
    avatar_url: string | null;
    full_name: string | null;
    bio: string | null;
    followers_count: number;
  } | null>(null);
  const [posts, setPosts] = useState<PostThumb[]>([]);
  const [garageVehicles, setGarageVehicles] = useState<GarageVehicle[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'garage' | 'publications' | 'itineraires'>('publications');

  const canFollow = !!user?.id && user.id !== userId;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const [profileRes, postsRes, followRes, garageRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('avatar_url, full_name, bio, followers_count')
          .eq('id', userId)
          .single(),
        supabase
          .from('posts')
          .select('id, image_urls, type')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(30),
        user?.id
          ? supabase
              .from('followers')
              .select('follower_id')
              .eq('follower_id', user.id)
              .eq('following_id', userId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from('garage_vehicles')
          .select('id, image_url, brand, model, year')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
      ]);

      if (cancelled) return;
      if (profileRes.data) {
        setProfile(profileRes.data);
        setFollowersCount(profileRes.data.followers_count ?? 0);
      }
      setPosts(postsRes.data ?? []);
      setGarageVehicles(garageRes.data ?? []);
      setIsFollowing(!!followRes.data);
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [userId, user?.id]);

  const handleToggleFollow = useCallback(async () => {
    if (!user?.id) return;

    if (isFollowing) {
      // Optimistic update
      setIsFollowing(false);
      setFollowersCount(prev => Math.max(0, prev - 1));

      const { error: deleteError } = await supabase.from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (deleteError) {
        console.error('[Follow] unfollow error:', deleteError.message);
        // Revert
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        return;
      }
    } else {
      // Optimistic update
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);

      const { error: insertError } = await supabase.from('followers').insert({
        follower_id: user.id,
        following_id: userId,
      });

      if (insertError) {
        console.error('[Follow] follow error:', insertError.message);
        // Revert
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        return;
      }

      await supabase.from('notifications').insert({ user_id: userId, actor_id: user.id, type: 'follow' });
    }

    // Re-fetch the real count from DB (maintenu par trigger sur `followers`) pour éviter toute dérive
    const { data: refreshed } = await supabase
      .from('profiles')
      .select('followers_count')
      .eq('id', userId)
      .single();
    if (refreshed) setFollowersCount(refreshed.followers_count ?? 0);
  }, [isFollowing, user?.id, userId]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Découvre le profil de @${username} sur Vroom 🏎️`,
      });
    } catch (_) {}
  }, [username]);

  const formatCount = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 10 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={22} color={C.dark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>@{username}</Text>
          <View style={{ width: 22 }} />
        </View>
        <ActivityIndicator color={C.accent} style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={C.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>@{username}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}
      >
        {/* ── Profile row ── */}
        <View style={styles.profileRow}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarRing}>
              {profile?.avatar_url ? (
                <ExpoImage
                  source={profile.avatar_url}
                  style={styles.avatarImage}
                  contentFit="cover"
                  placeholder={FALLBACK}
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={styles.avatarInner}>
                  <Ionicons name="person-circle-outline" size={64} color={C.muted} />
                </View>
              )}
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatColumn value={String(posts.length)} label="Posts" />
            <StatColumn value={formatCount(followersCount)} label="Abonnés" />
            <StatColumn value={String(garageVehicles.length)} label="Garage" />
          </View>
        </View>

        {/* ── Bio ── */}
        <View style={styles.bioSection}>
          <Text style={styles.bioName}>{profile?.full_name ?? username}</Text>
          {profile?.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}
        </View>

        {/* ── Action buttons ── */}
        <View style={styles.actionRow}>
          {canFollow ? (
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followBtnFollowing]}
              onPress={handleToggleFollow}
            >
              <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextFollowing]}>
                {isFollowing ? 'Abonné' : "S'abonner"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditProfile' as any)}
            >
              <Text style={styles.editBtnText}>Modifier le profil</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={16} color={C.dark} />
          </TouchableOpacity>
        </View>

        {/* ── Activity cards ── */}
        <View style={styles.activityRow}>
          {[
            { value: String(posts.length), label: 'publications', bg: C.accent },
            { value: formatCount(followersCount), label: 'abonnés', bg: C.dark },
            { value: String(garageVehicles.length), label: 'voitures · Garage', bg: C.dark },
          ].map((card, i) => (
            <View key={i} style={[styles.activityCard, { backgroundColor: card.bg }]}>
              <Text style={styles.activityValue}>{card.value}</Text>
              <Text style={styles.activityLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Tabs ── */}
        <View style={styles.tabsRow}>
          {([
            { key: 'garage', icon: 'car-outline', label: 'Garage' },
            { key: 'publications', icon: 'grid-outline', label: 'Publications' },
            { key: 'itineraires', icon: 'map-outline', label: 'Itinéraires' },
          ] as const).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Ionicons name={tab.icon as any} size={14} color={isActive ? C.dark : C.muted} />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Garage ── */}
        {activeTab === 'garage' && (
          <View style={styles.pubGrid}>
            {garageVehicles.length === 0 ? (
              <View style={styles.emptyTab}>
                <Ionicons name="car-outline" size={38} color={C.muted} />
              </View>
            ) : (
              garageVehicles.map((car) => (
                <View key={car.id} style={styles.pubItem}>
                  <ExpoImage
                    source={car.image_url ?? undefined}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                    placeholder={FALLBACK}
                    cachePolicy="memory-disk"
                  />
                  <View style={styles.pubItemMeta}>
                    <Text style={styles.pubItemName} numberOfLines={1}>{car.brand} {car.model}</Text>
                    {car.year ? <Text style={styles.pubItemYear}>{car.year}</Text> : null}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── Publications ── */}
        {activeTab === 'publications' && (
          <View style={styles.pubGrid}>
            {posts.length === 0 ? (
              <View style={styles.emptyTab}>
                <Ionicons name="grid-outline" size={38} color={C.muted} />
              </View>
            ) : (
              posts.map((post) => (
                <Pressable
                  key={post.id}
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate('PostDetail', {
                      id: post.id,
                      name: post.type ?? 'Publication',
                      image: post.image_urls?.[0] ?? '',
                    })
                  }
                >
                  <ExpoImage
                    source={post.image_urls?.[0] ?? undefined}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    placeholder={FALLBACK}
                    cachePolicy="memory-disk"
                  />
                  {post.type && (
                    <View style={styles.cardTypeBadge}>
                      <Ionicons name={(POST_TYPE_ICON[post.type] ?? 'ellipse') as any} size={10} color="#FFF" />
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.cardOverlay}
                  >
                    <Text style={styles.cardTitle} numberOfLines={1}>{post.type ?? '—'}</Text>
                  </LinearGradient>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingTop: 0 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAD,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.white,
    textAlign: 'center',
  },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAD,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 16,
  },
  avatarContainer: { position: 'relative' },
  avatarRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    borderColor: C.accent,
    padding: 2,
    overflow: 'hidden',
  },
  avatarImage: { flex: 1, borderRadius: 35 },
  avatarInner: {
    flex: 1,
    borderRadius: 35,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statCol: { alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: '700', color: C.white, marginBottom: 1 },
  statLabel: { fontSize: 10, color: C.muted },

  bioSection: { paddingHorizontal: PAD, paddingBottom: 8 },
  bioName: { fontSize: 13, fontWeight: '700', color: C.white, marginBottom: 2 },
  bioText: { fontSize: 11, color: C.whiteSoft, lineHeight: 16 },

  actionRow: { flexDirection: 'row', paddingHorizontal: PAD, paddingBottom: 14, gap: 8, alignItems: 'center' },
  followBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followBtnFollowing: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: C.border,
  },
  followBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  followBtnTextFollowing: { color: C.whiteSoft },
  editBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnText: { fontSize: 13, fontWeight: '600', color: C.whiteSoft },
  shareBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  activityRow: { flexDirection: 'row', paddingHorizontal: PAD, gap: 6, marginBottom: 20 },
  activityCard: { flex: 1, borderRadius: 12, padding: 10, minHeight: 76, justifyContent: 'flex-end' },
  activityValue: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 2 },
  activityLabel: { fontSize: 9, color: '#FFF', fontWeight: '500', opacity: 0.9 },

  tabsRow: { flexDirection: 'row', marginTop: 16 },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: C.white },
  tabText: { fontSize: 10, color: C.muted, fontWeight: '500' },
  tabTextActive: { color: C.white, fontWeight: '700' },

  pubGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP, paddingTop: CARD_GAP },
  card: { width: CARD_WIDTH, height: CARD_HEIGHT, backgroundColor: C.fieldBg, overflow: 'hidden' },
  cardOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 8, paddingBottom: 10,
  },
  cardTitle: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  cardTypeBadge: {
    position: 'absolute', top: 6, left: 6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center',
  },
  pubItemMeta: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 4, backgroundColor: 'rgba(0,0,0,0.45)' },
  pubItemName: { fontSize: 9, fontWeight: '700', color: '#FFF' },
  pubItemYear: { fontSize: 8, color: 'rgba(255,255,255,0.8)' },

  emptyTab: { alignItems: 'center', paddingVertical: 60, gap: 12, width: '100%' },
  emptyTabText: { color: C.muted, fontSize: 12 },
});
