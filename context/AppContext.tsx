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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const now = Date.now();
const hrs = (h: number) => new Date(now - h * 3600 * 1000).toISOString();

const MOCK_FEED_STORIES: FeedStory[] = [
  {
    id: 'fs0', userId: 'user_123', username: 'bapti_vroom',
    avatar: 'https://i.pravatar.cc/150?img=12',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&h=900&fit=crop',
    createdAt: hrs(4), viewedBy: [],
  },
  {
    id: 'fs1', userId: 'u1', username: 'alex_gt3',
    avatar: 'https://i.pravatar.cc/150?img=33',
    imageUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=500&h=900&fit=crop',
    createdAt: hrs(2), viewedBy: [],
  },
  {
    id: 'fs2', userId: 'u2', username: 'maria.drives',
    avatar: 'https://i.pravatar.cc/150?img=48',
    imageUrl: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=500&h=900&fit=crop',
    createdAt: hrs(3), viewedBy: [],
  },
  {
    id: 'fs3', userId: 'u3', username: 'jdm_tokyo',
    avatar: 'https://i.pravatar.cc/150?img=15',
    imageUrl: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=500&h=900&fit=crop',
    createdAt: hrs(6), viewedBy: [],
  },
  {
    id: 'fs4', userId: 'u5', username: 'baptiste_g',
    avatar: 'https://i.pravatar.cc/150?img=60',
    imageUrl: 'https://images.unsplash.com/photo-1544636331-e26879cd3d9a?w=500&h=900&fit=crop',
    createdAt: hrs(10), viewedBy: ['user_123'],
  },
  {
    id: 'fs5', userId: 'u6', username: 'swiss_spotter',
    avatar: 'https://i.pravatar.cc/150?img=22',
    imageUrl: 'https://images.unsplash.com/photo-1620882814836-98a2bc903323?w=500&h=900&fit=crop',
    createdAt: hrs(14), viewedBy: ['user_123'],
  },
];

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
    user: { id: 'user_123', username: 'bapti_vroom', avatar: 'https://i.pravatar.cc/150?img=12' },
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

  // Feed Stories
  feedStories: FeedStory[];
  markStoryAsViewed: (storyId: string) => void;
  addFeedStory: (story: Omit<FeedStory, 'id' | 'createdAt' | 'viewedBy'>) => void;

  // Vehicles (garage)
  vehicles: Vehicle[];
  addVehicle: (v: Omit<Vehicle, 'id' | 'userId' | 'createdAt'>) => void;
  removeVehicle: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

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
  const [cinePosts, setCinePosts] = useState<CineDrivePost[]>(MOCK_CINE_POSTS);
  const [liveUsers] = useState<LiveUser[]>(MOCK_LIVE_USERS);
  const [feedStories, setFeedStories] = useState<FeedStory[]>(MOCK_FEED_STORIES);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

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
    setCinePosts(prev => prev.map(p => (p.id === postId ? { ...p, isSaved: !p.isSaved } : p)));
  }, []);

  const addCinePost = useCallback((post: CineDrivePost) => {
    setCinePosts(prev => [post, ...prev]);
  }, []);

  // Feed Stories
  const markStoryAsViewed = useCallback((storyId: string) => {
    setFeedStories(prev =>
      prev.map(s => {
        if (s.id !== storyId) return s;
        if (s.viewedBy.includes('user_123')) return s;
        return { ...s, viewedBy: [...s.viewedBy, 'user_123'] };
      })
    );
  }, []);

  const addFeedStory = useCallback((story: Omit<FeedStory, 'id' | 'createdAt' | 'viewedBy'>) => {
    const newStory: FeedStory = {
      ...story,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      viewedBy: [],
    };
    setFeedStories(prev => [newStory, ...prev]);
  }, []);

  // Vehicles
  const addVehicle = useCallback((v: Omit<Vehicle, 'id' | 'userId' | 'createdAt'>) => {
    const newVehicle: Vehicle = {
      ...v,
      id: Date.now().toString(),
      userId: 'user_123',
      createdAt: new Date().toISOString(),
    };
    setVehicles(prev => [newVehicle, ...prev]);
  }, []);

  const removeVehicle = useCallback((id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  }, []);

  const savedCinePosts = cinePosts.filter(p => p.isSaved);
  const activeStories = feedStories.filter(
    s => Date.now() - new Date(s.createdAt).getTime() < TWENTY_FOUR_HOURS
  );

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
    feedStories: activeStories,
    markStoryAsViewed,
    addFeedStory,
    vehicles,
    addVehicle,
    removeVehicle,
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
