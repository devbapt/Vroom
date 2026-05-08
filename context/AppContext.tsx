import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Language } from '../i18n';

// ─── Cine Drive Types ────────────────────────────────────────────────────────

export type CineDrivePostType = 'track' | 'road_trip' | 'meet' | 'daily' | 'build' | 'spotted';

export interface TrackHUD     { kind: 'track';     power: string; acceleration: string; lapTime: string; }
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

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_CINE_POSTS: CineDrivePost[] = [
  {
    id: 'p1', type: 'track',
    user: { id: 'u1', username: 'alex_gt3', avatar: 'https://i.pravatar.cc/150?img=33' },
    vehicle: { brand: 'PORSCHE', model: '911 GT3 RS', year: 2024 },
    location: 'Paul Ricard',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&h=1600&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&h=1600&fit=crop',
      'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=900&h=1600&fit=crop',
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=900&h=1600&fit=crop',
    ],
    pages: [{ id: 'pg1', type: 'photo' }, { id: 'pg2', type: 'specs' }, { id: 'pg3', type: 'comments' }, { id: 'pg4', type: 'map' }],
    hud: { kind: 'track', power: '525hp', acceleration: '3.2s', lapTime: '1:58.4' },
    likes: 1247, isLiked: false, comments: 42, isSaved: false,
    createdAt: '2024-04-12T14:32:00Z',
  },
  {
    id: 'p2', type: 'road_trip',
    user: { id: 'u2', username: 'maria.drives', avatar: 'https://i.pravatar.cc/150?img=48' },
    vehicle: { brand: 'FERRARI', model: 'F8 TRIBUTO', year: 2022 },
    location: 'Col de Turini',
    image: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=900&h=1600&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=900&h=1600&fit=crop',
      'https://images.unsplash.com/photo-1471432338620-fc4a4607f2ce?w=900&h=1600&fit=crop',
      'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=900&h=1600&fit=crop',
    ],
    pages: [{ id: 'pg1', type: 'photo' }, { id: 'pg2', type: 'map' }, { id: 'pg3', type: 'specs' }, { id: 'pg4', type: 'comments' }],
    hud: { kind: 'road_trip', distance: '142km', duration: '3h12', crew: '4' },
    likes: 3489, isLiked: true, comments: 128, isSaved: false,
    createdAt: '2024-04-12T11:20:00Z',
  },
  {
    id: 'p3', type: 'meet',
    user: { id: 'u3', username: 'jdm_tokyo', avatar: 'https://i.pravatar.cc/150?img=15' },
    vehicle: { brand: 'NISSAN', model: 'GT-R R34', year: 1999 },
    location: 'Daikoku PA, Yokohama',
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900&h=1600&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=900&h=1600&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&h=1600&fit=crop',
    ],
    pages: [{ id: 'pg1', type: 'photo' }, { id: 'pg2', type: 'comments' }, { id: 'pg3', type: 'map' }],
    hud: { kind: 'meet', city: 'YOKOHAMA', people: '120+', cars: '87' },
    likes: 5621, isLiked: false, comments: 234, isSaved: true,
    createdAt: '2024-04-11T22:00:00Z',
  },
  {
    id: 'p4', type: 'daily',
    user: { id: 'u4', username: 'bapti_vroom', avatar: 'https://i.pravatar.cc/150?img=12' },
    vehicle: { brand: 'PORSCHE', model: 'CAYMAN GTS', year: 2023 },
    location: 'Lyon',
    image: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=900&h=1600&fit=crop',
    pages: [{ id: 'pg1', type: 'photo' }, { id: 'pg2', type: 'specs' }],
    hud: { kind: 'daily', power: '365hp', acceleration: '4.6s', transmission: 'PDK' },
    likes: 312, isLiked: false, comments: 18, isSaved: false,
    createdAt: '2024-04-11T18:00:00Z',
  },
  {
    id: 'p5', type: 'build',
    user: { id: 'u5', username: 'baptiste_garage', avatar: 'https://i.pravatar.cc/150?img=60' },
    vehicle: { brand: 'LAMBORGHINI', model: 'HURACÁN STO', year: 2022 },
    location: 'Paris',
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd3d9a?w=900&h=1600&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1544636331-e26879cd3d9a?w=900&h=1600&fit=crop',
      'https://images.unsplash.com/photo-1621135802920-133df287f89c?w=900&h=1600&fit=crop',
    ],
    pages: [{ id: 'pg1', type: 'photo' }, { id: 'pg2', type: 'specs' }, { id: 'pg3', type: 'comments' }, { id: 'pg4', type: 'map' }],
    hud: { kind: 'build', mods: '12/15', budget: '€42k', phase: '3/5' },
    likes: 4218, isLiked: true, comments: 189, isSaved: true,
    createdAt: '2024-04-11T10:30:00Z',
  },
  {
    id: 'p6', type: 'spotted',
    user: { id: 'u6', username: 'swiss_spotter', avatar: 'https://i.pravatar.cc/150?img=22' },
    vehicle: { brand: 'BUGATTI', model: 'CHIRON', year: 2023 },
    location: 'Genève',
    image: 'https://images.unsplash.com/photo-1620882814836-98a2bc903323?w=900&h=1600&fit=crop',
    pages: [{ id: 'pg1', type: 'photo' }, { id: 'pg2', type: 'comments' }],
    hud: { kind: 'spotted', city: 'GENÈVE', model: 'CHIRON', rarity: 5 },
    likes: 8104, isLiked: false, comments: 412, isSaved: false,
    createdAt: '2024-04-10T16:00:00Z',
  },
];

const MOCK_LIVE_USERS: LiveUser[] = [
  { id: 'l1', username: 'alex_gt3',     avatar: 'https://i.pravatar.cc/150?img=33', isLive: true },
  { id: 'l2', username: 'maria.drives', avatar: 'https://i.pravatar.cc/150?img=48', isLive: true },
  { id: 'l3', username: 'jdm_tokyo',    avatar: 'https://i.pravatar.cc/150?img=15', isLive: false, lastActiveText: '2m' },
  { id: 'l4', username: 'baptiste_g',   avatar: 'https://i.pravatar.cc/150?img=60', isLive: false, lastActiveText: '8m' },
  { id: 'l5', username: 'caferacer',    avatar: 'https://i.pravatar.cc/150?img=41', isLive: false, lastActiveText: '15m' },
  { id: 'l6', username: 'v8_nation',    avatar: 'https://i.pravatar.cc/150?img=68', isLive: false, lastActiveText: '32m' },
];

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

export interface AppContextType {
  // User
  user: UserProfile | null;
  updateProfile: (profile: Partial<UserProfile>) => void;

  // Stories & Highlights
  highlights: Highlight[];
  addHighlight: (highlight: Highlight) => void;
  deleteHighlight: (id: string) => void;

  // Posts
  posts: Post[];
  addPost: (post: Post) => void;
  likePost: (postId: string) => void;
  savePost: (postId: string) => void;
  deletePost: (postId: string) => void;

  // Notifications & Feed
  unreadCount: number;
  markAsRead: () => void;

  // Language
  language: Language;
  setLanguage: (lang: Language) => void;

  // Cine Drive Feed
  cinePosts: CineDrivePost[];
  savedCinePosts: CineDrivePost[];
  liveUsers: LiveUser[];
  toggleLikeCinePost: (postId: string) => void;
  toggleSaveCinePost: (postId: string) => void;
  addCinePost: (post: CineDrivePost) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>({
    id: 'user_123',
    username: 'bapti_vroom',
    displayName: 'Baptiste',
    avatar: 'https://i.pravatar.cc/150?img=12',
    bio: 'Passionné de GT & Vintage 🏁 Track day addict · Roadtrips sur route de montagne',
    followersCount: 1200,
    followingCount: 350,
    postsCount: 6,
    isPrivate: false,
    tags: [
      { id: 't1', label: 'Porsche', type: 'brand' as const },
      { id: 't2', label: 'Ferrari', type: 'brand' as const },
      { id: 't3', label: 'Circuit SPA', type: 'place' as const },
      { id: 't4', label: 'Lyon FR', type: 'location' as const },
    ],
  });

  const [highlights, setHighlights] = useState<Highlight[]>([
    { id: '1', name: 'Car Shows', image: 'https://images.unsplash.com/photo-1540261014352-7a064dc8cc94?w=200&h=200&fit=crop', storyCount: 2 },
    { id: '2', name: 'Track Days', image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200&h=200&fit=crop', storyCount: 1 },
    { id: '3', name: 'Meets', image: 'https://images.unsplash.com/photo-1549399542-7e3f8b83ad5e?w=200&h=200&fit=crop', storyCount: 2 },
    { id: '4', name: 'Events', image: 'https://images.unsplash.com/photo-1507950547674-7a86b984e2a1?w=200&h=200&fit=crop', storyCount: 1 },
  ]);

  const [posts, setPosts] = useState<Post[]>([
    { id: '1', title: 'Ferrari F8', image: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500&h=500&fit=crop', likes: 124, comments: 8, shares: 12 },
    { id: '2', title: 'Porsche 911', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&h=500&fit=crop', likes: 210, comments: 15, shares: 24 },
    { id: '3', title: 'McLaren 720S', image: 'https://images.unsplash.com/photo-1620882814836-98a2bc903323?w=500&h=500&fit=crop', likes: 340, comments: 22, shares: 45 },
    { id: '4', title: 'Lamborghini', image: 'https://images.unsplash.com/photo-1567818735868-e71b99932e29?w=500&h=500&fit=crop', likes: 520, comments: 35, shares: 78 },
    { id: '5', title: 'Aston Martin', image: 'https://images.unsplash.com/photo-1609708536965-9e47b79e1ad7?w=500&h=500&fit=crop', likes: 189, comments: 11, shares: 18 },
    { id: '6', title: 'Mercedes AMG', image: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=500&h=500&fit=crop', likes: 267, comments: 19, shares: 32 },
  ]);

  const [unreadCount, setUnreadCount] = useState(5);
  const [language, setLanguageState] = useState<Language>('fr');

  const updateProfile = useCallback((profileUpdate: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...profileUpdate } : null);
  }, []);

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
    setPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p)
    );
  }, []);

  const savePost = useCallback((postId: string) => {
    setPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, isSaved: !p.isSaved } : p)
    );
  }, []);

  const deletePost = useCallback((postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  }, []);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const changeLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const [cinePosts, setCinePosts] = useState<CineDrivePost[]>(MOCK_CINE_POSTS);
  const [liveUsers] = useState<LiveUser[]>(MOCK_LIVE_USERS);

  const toggleLikeCinePost = useCallback((postId: string) => {
    setCinePosts(prev =>
      prev.map(p =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  }, []);

  const toggleSaveCinePost = useCallback((postId: string) => {
    setCinePosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, isSaved: !p.isSaved } : p))
    );
  }, []);

  const addCinePost = useCallback((post: CineDrivePost) => {
    setCinePosts(prev => [post, ...prev]);
  }, []);

  const savedCinePosts = cinePosts.filter(p => p.isSaved);

  const value: AppContextType = {
    user,
    updateProfile,
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
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export default AppContext;
