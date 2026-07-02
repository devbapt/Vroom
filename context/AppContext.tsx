import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Language } from '../i18n';
import { supabase } from '../supabaseClient';

// ─── Cine Drive Types ────────────────────────────────────────────────────────

export type CineDrivePostType = 'track' | 'road_trip' | 'meet' | 'daily' | 'build' | 'spotted';

export interface TrackHUD     { kind: 'track';     power: string; acceleration: string; lapTime: string; avgSpeed: string; }
export interface RoadTripHUD  { kind: 'road_trip'; distance: string; duration: string; crew: string; }
export interface MeetHUD      { kind: 'meet';      city: string; people: string; cars: string; }
export interface DailyHUD     { kind: 'daily';     power: string; acceleration: string; transmission: string; }
export interface BuildHUD     { kind: 'build';     mods: string; budget: string; phase: string; }
export interface SpottedHUD   { kind: 'spotted';   city: string; model: string; rarity: 1 | 2 | 3 | 4 | 5; }

export type AnyHUD = TrackHUD | RoadTripHUD | MeetHUD | DailyHUD | BuildHUD | SpottedHUD;

export interface CineDrivePost {
  id: string;
  type: CineDrivePostType;
  user: { id: string; username: string; avatar: string };
  vehicle: { brand: string; model: string; year?: number };
  location?: string;
  image: string;
  photos?: string[];
  pages: Array<{ id: string; type: 'photo' | 'map' | 'specs' | 'comments' }>;
  hud: AnyHUD;
  description?: string;
  likes: number;
  isLiked: boolean;
  comments: number;
  isSaved: boolean;
  createdAt: string;
  isLive?: boolean;
}

// ─── Feed Story Types ─────────────────────────────────────────────────────────

export interface FeedStory {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  imageUrl: string;
  createdAt: string;
  viewedBy: string[];
  highlightId?: string | null;
}

// ─── Vehicle Types ────────────────────────────────────────────────────────────

export type VehicleTransmission = 'MT' | 'AT' | 'DCT' | 'PDK' | 'CVT';
export type VehicleDrivetrain   = 'RWD' | 'FWD' | 'AWD' | '4WD';
export type VehicleFuel         = 'gasoline' | 'diesel' | 'hybrid' | 'electric';
export type VehicleStatus       = 'daily' | 'weekend' | 'track' | 'show' | 'project';

// ─── Other types ──────────────────────────────────────────────────────────────

export interface Highlight {
  id: string;
  name: string;
  image: string;
  createdAt?: number;
  storyCount?: number;
}

export interface Story {
  id: string;
  image: string;
  duration?: number;
  viewedBy?: string[];
}

export interface ProfileTag {
  id: string;
  label: string;
  type: 'brand' | 'place' | 'location';
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isPrivate: boolean;
  notifPush: boolean;
  notifEmail: boolean;
  tags?: ProfileTag[];
}

// ─── Context Type ─────────────────────────────────────────────────────────────

export interface AppContextType {
  user: UserProfile | null;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateProfileAvatar: (avatarUrl: string) => Promise<void>;
  refreshProfile: (userId: string) => Promise<void>;

  highlights: Highlight[];
  addHighlight: (name: string, coverImage?: string) => Promise<Highlight | null>;
  deleteHighlight: (id: string) => Promise<void>;
  loadHighlights: (userId: string) => Promise<void>;

  unreadCount: number;
  markAsRead: () => void;

  language: Language;
  setLanguage: (lang: Language) => void;

  deletedPostIds: string[];
  markPostDeleted: (postId: string) => void;

  // Feed Stories
  feedStories: FeedStory[];
  markStoryAsViewed: (storyId: string) => void;
  addFeedStory: (story: Omit<FeedStory, 'id' | 'createdAt' | 'viewedBy'>) => void;
  removeFeedStory: (storyId: string) => void;
  loadStories: () => Promise<void>;

  // Welcome screen after signup
  showWelcome: boolean;
  triggerWelcome: () => void;
  dismissWelcome: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [language, setLanguageState] = useState<Language>('fr');
  const [deletedPostIds, setDeletedPostIds] = useState<string[]>([]);
  const [feedStories, setFeedStories] = useState<FeedStory[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);

  const triggerWelcome = useCallback(() => setShowWelcome(true), []);
  const dismissWelcome = useCallback(() => setShowWelcome(false), []);

  const updateProfile = useCallback((profileUpdate: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...profileUpdate } : null);
  }, []);

  const updateProfileAvatar = useCallback(async (avatarUrl: string) => {
    console.log('[AppContext:updateProfileAvatar] called — url =', avatarUrl);
    if (!user?.id) {
      console.warn('[AppContext:updateProfileAvatar] EARLY RETURN — no user.id');
      return;
    }
    console.log('[AppContext:updateProfileAvatar] writing avatar_url to DB for user', user.id);
    const { error: dbError } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
    console.log('[AppContext:updateProfileAvatar] DB update result — error:', dbError ?? 'none');
    setUser(prev => {
      console.log('[AppContext:updateProfileAvatar] setUser — prev.avatar =', prev?.avatar, '→ new =', avatarUrl);
      return prev ? { ...prev, avatar: avatarUrl } : null;
    });
    console.log('[AppContext:updateProfileAvatar] done');
  }, [user?.id]);

  const addHighlight = useCallback(async (name: string, coverImage?: string) => {
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from('highlights')
      .insert({ user_id: user.id, name, cover_image: coverImage ?? null })
      .select()
      .single();
    if (error || !data) return null;
    const newHighlight: Highlight = {
      id: data.id,
      name: data.name,
      image: data.cover_image ?? '',
      createdAt: new Date(data.created_at).getTime(),
      storyCount: 0,
    };
    setHighlights(prev => [newHighlight, ...prev]);
    return newHighlight;
  }, [user?.id]);

  const deleteHighlight = useCallback(async (id: string) => {
    await supabase.from('highlights').delete().eq('id', id);
    setHighlights(prev => prev.filter(h => h.id !== id));
  }, []);

  const loadHighlights = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('highlights')
      .select('id, name, cover_image, created_at, stories(count)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!data) return;
    setHighlights(data.map((row: any) => ({
      id: row.id,
      name: row.name,
      image: row.cover_image ?? '',
      createdAt: new Date(row.created_at).getTime(),
      storyCount: row.stories?.[0]?.count ?? 0,
    })));
  }, []);

  const markAsRead = useCallback(() => { setUnreadCount(0); }, []);

  const changeLanguage = useCallback((lang: Language) => { setLanguageState(lang); }, []);

  const markPostDeleted = useCallback((postId: string) => {
    setDeletedPostIds(prev => [...prev, postId]);
  }, []);

  // Feed Stories
  const markStoryAsViewed = useCallback((storyId: string) => {
    const viewerId = user?.id ?? '';
    setFeedStories(prev =>
      prev.map(s => {
        if (s.id !== storyId) return s;
        if (s.viewedBy.includes(viewerId)) return s;
        return { ...s, viewedBy: [...s.viewedBy, viewerId] };
      })
    );
  }, [user]);

  const addFeedStory = useCallback((story: Omit<FeedStory, 'id' | 'createdAt' | 'viewedBy'>) => {
    const newStory: FeedStory = {
      ...story,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      viewedBy: [],
    };
    setFeedStories(prev => [newStory, ...prev]);
  }, []);

  const removeFeedStory = useCallback((storyId: string) => {
    setFeedStories(prev => prev.filter(s => s.id !== storyId));
  }, []);

  const loadStories = useCallback(async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('stories')
      .select('id, user_id, image_url, created_at, highlight_id, profiles!user_id(id, username, avatar_url)')
      .or(`created_at.gte.${since},highlight_id.not.is.null`)
      .order('created_at', { ascending: false });

    if (!data) return;
    setFeedStories(data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      username: row.profiles?.username ?? '',
      avatar: row.profiles?.avatar_url ?? '',
      imageUrl: row.image_url,
      createdAt: row.created_at,
      viewedBy: [],
      highlightId: row.highlight_id,
    })));
  }, []);

  const fetchAndSetProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, followers_count, following_count, posts_count, is_private, notif_push, notif_email, tags')
      .eq('id', userId)
      .single();
    setUser({
      id: data?.id ?? userId,
      username: data?.username ?? '',
      displayName: data?.full_name ?? data?.username ?? '',
      avatar: data?.avatar_url ?? '',
      bio: data?.bio ?? '',
      followersCount: data?.followers_count ?? 0,
      followingCount: data?.following_count ?? 0,
      postsCount: data?.posts_count ?? 0,
      isPrivate: data?.is_private ?? false,
      notifPush: data?.notif_push ?? true,
      notifEmail: data?.notif_email ?? false,
      tags: data?.tags ?? [],
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { fetchAndSetProfile(session.user.id); loadStories(); loadHighlights(session.user.id); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchAndSetProfile(session.user.id);
        loadStories();
        loadHighlights(session.user.id);
      } else {
        setUser(null);
        setHighlights([]);
        setFeedStories([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const activeStories = feedStories.filter(
    s => s.highlightId || Date.now() - new Date(s.createdAt).getTime() < TWENTY_FOUR_HOURS
  );

  const value: AppContextType = {
    user,
    updateProfile,
    updateProfileAvatar,
    refreshProfile: fetchAndSetProfile,
    highlights,
    addHighlight,
    deleteHighlight,
    loadHighlights,
    unreadCount,
    markAsRead,
    language,
    setLanguage: changeLanguage,
    deletedPostIds,
    markPostDeleted,
    feedStories: activeStories,
    markStoryAsViewed,
    addFeedStory,
    removeFeedStory,
    loadStories,
    showWelcome,
    triggerWelcome,
    dismissWelcome,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

export default AppContext;
