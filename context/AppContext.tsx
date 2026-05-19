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

export interface LiveUser {
  id: string;
  username: string;
  avatar: string;
  isLive: boolean;
  lastActiveText?: string;
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
}

// ─── Vehicle Types ────────────────────────────────────────────────────────────

export type VehicleTransmission = 'MT' | 'AT' | 'DCT' | 'PDK' | 'CVT';
export type VehicleDrivetrain   = 'RWD' | 'FWD' | 'AWD' | '4WD';
export type VehicleFuel         = 'gasoline' | 'diesel' | 'hybrid' | 'electric';
export type VehicleStatus       = 'daily' | 'weekend' | 'track' | 'show' | 'project';

export interface Vehicle {
  id: string;
  userId: string;
  imageUrl: string;
  brand: string;
  model: string;
  year: number;
  nickname?: string;
  power?: string;
  acceleration?: string;
  transmission?: VehicleTransmission;
  drivetrain?: VehicleDrivetrain;
  fuel?: VehicleFuel;
  color?: string;
  mileage?: number;
  acquiredAt?: string;
  status?: VehicleStatus;
  notes?: string;
  createdAt: string;
}

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

export interface Post {
  id: string;
  title: string;
  image: string;
  description?: string;
  likes: number;
  comments: number;
  shares: number;
  isSaved?: boolean;
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
  tags?: ProfileTag[];
}

// ─── Context Type ─────────────────────────────────────────────────────────────

export interface AppContextType {
  user: UserProfile | null;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateProfileAvatar: (avatarUrl: string) => Promise<void>;
  refreshProfile: (userId: string) => Promise<void>;

  highlights: Highlight[];
  addHighlight: (highlight: Highlight) => void;
  deleteHighlight: (id: string) => void;

  posts: Post[];
  addPost: (post: Post) => void;
  likePost: (postId: string) => void;
  savePost: (postId: string) => void;
  deletePost: (postId: string) => void;

  unreadCount: number;
  markAsRead: () => void;

  language: Language;
  setLanguage: (lang: Language) => void;

  // Cine Drive Feed
  cinePosts: CineDrivePost[];
  savedCinePosts: CineDrivePost[];
  liveUsers: LiveUser[];
  toggleLikeCinePost: (postId: string) => void;
  toggleSaveCinePost: (postId: string) => void;
  addCinePost: (post: CineDrivePost) => void;
  deletedPostIds: string[];
  markPostDeleted: (postId: string) => void;

  // Feed Stories
  feedStories: FeedStory[];
  markStoryAsViewed: (storyId: string) => void;
  addFeedStory: (story: Omit<FeedStory, 'id' | 'createdAt' | 'viewedBy'>) => void;
  removeFeedStory: (storyId: string) => void;
  loadStories: () => Promise<void>;

  // Vehicles (garage)
  vehicles: Vehicle[];
  addVehicle: (v: Omit<Vehicle, 'id' | 'userId' | 'createdAt'>) => void;
  removeVehicle: (id: string) => void;

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [language, setLanguageState] = useState<Language>('fr');
  const [cinePosts, setCinePosts] = useState<CineDrivePost[]>([]);
  const [liveUsers] = useState<LiveUser[]>([]);
  const [deletedPostIds, setDeletedPostIds] = useState<string[]>([]);
  const [feedStories, setFeedStories] = useState<FeedStory[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
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

  const addHighlight = useCallback((highlight: Highlight) => {
    setHighlights(prev => [...prev, highlight]);
  }, []);

  const deleteHighlight = useCallback((id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
  }, []);

  const addPost = useCallback((post: Post) => {
    setPosts(prev => [post, ...prev]);
  }, []);

  const likePost = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
  }, []);

  const savePost = useCallback((postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isSaved: !p.isSaved } : p));
  }, []);

  const deletePost = useCallback((postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  }, []);

  const markAsRead = useCallback(() => { setUnreadCount(0); }, []);

  const changeLanguage = useCallback((lang: Language) => { setLanguageState(lang); }, []);

  const toggleLikeCinePost = useCallback(async (postId: string) => {
    let currentlyLiked = false;
    setCinePosts(prev => {
      const post = prev.find(p => p.id === postId);
      currentlyLiked = post?.isLiked ?? false;
      return prev.map(p =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      );
    });

    if (!user?.id) return;

    if (currentlyLiked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
    }
  }, [user?.id]);

  const toggleSaveCinePost = useCallback(async (postId: string) => {
    // Read current saved state before optimistic update
    let currentlySaved = false;
    setCinePosts(prev => {
      const post = prev.find(p => p.id === postId);
      currentlySaved = post?.isSaved ?? false;
      return prev.map(p => p.id === postId ? { ...p, isSaved: !p.isSaved } : p);
    });

    if (!user?.id) return;

    if (currentlySaved) {
      await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      await supabase.from('saved_posts').insert({ post_id: postId, user_id: user.id });
    }
  }, [user?.id]);

  const addCinePost = useCallback((post: CineDrivePost) => {
    setCinePosts(prev => [post, ...prev]);
  }, []);

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
      .select('id, user_id, image_url, created_at, profiles!user_id(id, username, avatar_url)')
      .gte('created_at', since)
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
    })));
  }, []);

  // Vehicles
  const addVehicle = useCallback((v: Omit<Vehicle, 'id' | 'userId' | 'createdAt'>) => {
    const newVehicle: Vehicle = {
      ...v,
      id: Date.now().toString(),
      userId: user?.id ?? '',
      createdAt: new Date().toISOString(),
    };
    setVehicles(prev => [newVehicle, ...prev]);
  }, [user]);

  const removeVehicle = useCallback((id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  }, []);

  const fetchAndSetProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, followers_count')
      .eq('id', userId)
      .single();
    setUser({
      id: data?.id ?? userId,
      username: data?.username ?? '',
      displayName: data?.full_name ?? data?.username ?? '',
      avatar: data?.avatar_url ?? '',
      bio: data?.bio ?? '',
      followersCount: data?.followers_count ?? 0,
      followingCount: 0,
      postsCount: 0,
      isPrivate: false,
      tags: [],
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { fetchAndSetProfile(session.user.id); loadStories(); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchAndSetProfile(session.user.id);
        loadStories();
      } else {
        setUser(null);
        setHighlights([]);
        setPosts([]);
        setCinePosts([]);
        setFeedStories([]);
        setVehicles([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const savedCinePosts = cinePosts.filter(p => p.isSaved);
  const activeStories = feedStories.filter(
    s => Date.now() - new Date(s.createdAt).getTime() < TWENTY_FOUR_HOURS
  );

  const value: AppContextType = {
    user,
    updateProfile,
    updateProfileAvatar,
    refreshProfile: fetchAndSetProfile,
    highlights,
    addHighlight,
    deleteHighlight,
    posts,
    addPost,
    likePost,
    savePost,
    deletePost,
    unreadCount,
    markAsRead,
    language,
    setLanguage: changeLanguage,
    cinePosts,
    savedCinePosts,
    liveUsers,
    toggleLikeCinePost,
    toggleSaveCinePost,
    addCinePost,
    deletedPostIds,
    markPostDeleted,
    feedStories: activeStories,
    markStoryAsViewed,
    addFeedStory,
    removeFeedStory,
    loadStories,
    vehicles,
    addVehicle,
    removeVehicle,
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
