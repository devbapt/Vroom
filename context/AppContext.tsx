import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * App Context - Global state management (MVC Model Layer)
 * Handles: profile, stories, posts, user data
 */

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // User Profile
  const [user, setUser] = useState<UserProfile>({
    id: 'user_123',
    username: 'bapti_vroom',
    displayName: 'Baptiste',
    avatar: 'https://i.pravatar.cc/150?img=12',
    bio: 'Car enthusiast | Porsche lover | Track days',
    followersCount: 1200,
    followingCount: 350,
    postsCount: 6,
    isPrivate: false,
  });

  // Highlights
  const [highlights, setHighlights] = useState<Highlight[]>([
    { id: '1', name: 'Car Shows', image: 'https://images.unsplash.com/photo-1540261014352-7a064dc8cc94?w=200&h=200&fit=crop', storyCount: 2 },
    { id: '2', name: 'Track Days', image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200&h=200&fit=crop', storyCount: 1 },
    { id: '3', name: 'Meets', image: 'https://images.unsplash.com/photo-1549399542-7e3f8b83ad5e?w=200&h=200&fit=crop', storyCount: 2 },
    { id: '4', name: 'Events', image: 'https://images.unsplash.com/photo-1507950547674-7a86b984e2a1?w=200&h=200&fit=crop', storyCount: 1 },
  ]);

  // Posts (Garage)
  const [posts, setPosts] = useState<Post[]>([
    { id: '1', title: 'Ferrari F8', image: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=400&h=400&fit=crop', likes: 124, comments: 8, shares: 12 },
    { id: '2', title: 'Porsche 911', image: 'https://cdn.pixabay.com/photo/2020/07/28/08/29/porsche-911-5444317_640.jpg', likes: 210, comments: 15, shares: 24 },
    { id: '3', title: 'McLaren 720S', image: 'https://images.unsplash.com/photo-1620882814836-98a2bc903323?w=400&h=400&fit=crop', likes: 340, comments: 22, shares: 45 },
    { id: '4', title: 'Lamborghini', image: 'https://images.unsplash.com/photo-1544636331-e26879cd3d9a?w=400&h=400&fit=crop', likes: 520, comments: 35, shares: 78 },
    { id: '5', title: 'Aston Martin', image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=400&h=400&fit=crop', likes: 189, comments: 11, shares: 18 },
    { id: '6', title: 'Mercedes AMG', image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=400&fit=crop', likes: 267, comments: 19, shares: 32 },
  ]);

  // Notifications
  const [unreadCount, setUnreadCount] = useState(5);

  // Profile updates
  const updateProfile = useCallback((profileUpdate: Partial<UserProfile>) => {
    setUser(prev => prev ? { ...prev, ...profileUpdate } : null);
  }, []);

  // Highlight management
  const addHighlight = useCallback((highlight: Highlight) => {
    setHighlights(prev => [...prev, highlight]);
  }, []);

  const deleteHighlight = useCallback((id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
  }, []);

  // Post management
  const addPost = useCallback((post: Post) => {
    setPosts(prev => [post, ...prev]);
  }, []);

  const likePost = useCallback((postId: string) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId ? { ...p, likes: p.likes + 1 } : p
      )
    );
  }, []);

  const savePost = useCallback((postId: string) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId ? { ...p, isSaved: !p.isSaved } : p
      )
    );
  }, []);

  const deletePost = useCallback((postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  }, []);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

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
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Hook to use app context
 */
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export default AppContext;
