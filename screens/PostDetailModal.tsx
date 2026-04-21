import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Share,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAppContext } from '../context';

const { width, height } = Dimensions.get('window');

// --- Colors ---
const VROOM_COLORS = {
  bg: '#FFFFFF',
  dark: '#140102',
  accent: '#E50914',
  muted: '#8E8E93',
  fieldBg: 'rgba(20, 1, 2, 0.05)',
  border: '#EEEEEE',
};

const FALLBACK_IMAGE = require('../assets/logo_vroom_Couleur.png');

// Mock post data with full details
const GARAGE_POST_DETAILS: { [key: string]: any } = {
  '1': {
    id: '1',
    name: 'Ferrari F8',
    image: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?w=400&h=400&fit=crop',
    description: '2022 Ferrari F8 Tributo - Stunning Performance supercar with 710 HP V12 engine. Recently serviced and in pristine condition.',
    date: '3 weeks ago',
    likes: 1240,
    comments: 45,
  },
  '2': {
    id: '2',
    name: 'Porsche 911',
    image: 'https://cdn.pixabay.com/photo/2020/07/28/08/29/porsche-911-5444317_640.jpg',
    description: '2021 Porsche 911 Turbo - Iconic German engineering with 580 HP. Track-ready with custom suspension upgrades.',
    date: '2 months ago',
    likes: 2100,
    comments: 82,
  },
  '3': {
    id: '3',
    name: 'McLaren 720S',
    image: 'https://images.unsplash.com/photo-1620882814836-98a2bc903323?w=400&h=400&fit=crop',
    description: '2023 McLaren 720S - British luxury meets raw performance. 710 HP twin-turbo with carbon fiber body.',
    date: '1 month ago',
    likes: 3400,
    comments: 156,
  },
  '4': {
    id: '4',
    name: 'Lamborghini',
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd3d9a?w=400&h=400&fit=crop',
    description: 'Lamborghini Huracán Tecnica - Ultimate track-focused hypercar with 631 HP V10 engine. Limited production.',
    date: '5 weeks ago',
    likes: 5200,
    comments: 203,
  },
  '5': {
    id: '5',
    name: 'Aston Martin',
    image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=400&h=400&fit=crop',
    description: 'Aston Martin DBS Superleggera - British elegance with 715 HP twin-turbo engine. Handcrafted luxury performance.',
    date: '2 months ago',
    likes: 1890,
    comments: 67,
  },
  '6': {
    id: '6',
    name: 'Mercedes AMG',
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=400&fit=crop',
    description: 'Mercedes-AMG GT R Pro - German precision with 585 HP V8 engine. Aerodynamic masterpiece for the road and track.',
    date: '1 week ago',
    likes: 2650,
    comments: 94,
  },
};

type PostDetailModalProps = {
  visible: boolean;
  post: {
    id: string;
    name: string;
    image: string;
    description?: string;
    date?: string;
  } | null;
  onClose: () => void;
};

export default function PostDetailModal({ visible, post, onClose }: PostDetailModalProps) {
  const { likePost, savePost, posts } = useAppContext();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (!post) return null;

  // Get post from global state or use mock data
  const postData = posts.find(p => p.id === post.id) || GARAGE_POST_DETAILS[post.id] || post;
  const likes = postData.likes || 0;
  const comments = postData.comments || 0;

  const handleLike = () => {
    likePost(post.id);
    setIsLiked(!isLiked);
  };

  const handleSave = () => {
    savePost(post.id);
    setIsSaved(!isSaved);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this car: ${postData.name}`,
        url: postData.image,
        title: postData.name,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        
        {/* === HEADER === */}
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={15}>
            <Ionicons name="chevron-down" size={32} color={VROOM_COLORS.dark} />
          </Pressable>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          
          {/* === IMAGE (OPTIMIZED) === */}
          <ExpoImage
            source={postData.image}
            style={styles.postImage}
            placeholder={FALLBACK_IMAGE}
            contentFit="cover"
            cachePolicy="memory-disk"
          />

          {/* === POST INFO SECTION === */}
          <View style={styles.infoSection}>
            {/* Title */}
            <Text style={styles.postTitle}>{postData.name}</Text>

            {/* Engagement Stats */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{likes.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Likes</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{comments}</Text>
                <Text style={styles.statLabel}>Comments</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>-</Text>
                <Text style={styles.statLabel}>Shares</Text>
              </View>
            </View>

            {/* Description */}
            {postData.description && (
              <Text style={styles.postDescription}>{postData.description}</Text>
            )}

            {/* Date */}
            {postData.date && (
              <Text style={styles.postDate}>{postData.date}</Text>
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* === ACTION BUTTONS ROW === */}
            <View style={styles.actionsRow}>
              
              {/* Like Button */}
              <Pressable
                onPress={handleLike}
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]}
              >
                <Feather
                  name={isLiked ? 'heart' : 'heart'}
                  size={20}
                  color={isLiked ? VROOM_COLORS.accent : VROOM_COLORS.dark}
                  fill={isLiked ? VROOM_COLORS.accent : 'none'}
                />
                <Text style={[styles.actionLabel, isLiked && { color: VROOM_COLORS.accent }]}>
                  {isLiked ? 'Liked' : 'Like'}
                </Text>
              </Pressable>

              {/* Comment Button */}
              <Pressable style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]}>
                <Feather name="message-circle" size={20} color={VROOM_COLORS.dark} />
                <Text style={styles.actionLabel}>Comment</Text>
              </Pressable>

              {/* Share Button */}
              <Pressable
                onPress={handleShare}
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]}
              >
                <Feather name="share" size={20} color={VROOM_COLORS.dark} />
                <Text style={styles.actionLabel}>Share</Text>
              </Pressable>

              {/* Save Button */}
              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]}
              >
                <Feather
                  name={isSaved ? 'bookmark' : 'bookmark'}
                  size={20}
                  color={isSaved ? VROOM_COLORS.accent : VROOM_COLORS.dark}
                  fill={isSaved ? VROOM_COLORS.accent : 'none'}
                />
                <Text style={[styles.actionLabel, isSaved && { color: VROOM_COLORS.accent }]}>
                  {isSaved ? 'Saved' : 'Save'}
                </Text>
              </Pressable>

            </View>

            {/* Divider 2 */}
            <View style={styles.divider} />

            {/* === REPOST BUTTON (PROMINENT) === */}
            <Pressable
              style={({ pressed }) => [
                styles.repostBtn,
                pressed && { backgroundColor: 'rgba(229, 9, 20, 0.1)' },
              ]}
            >
              <Ionicons name="repeat" size={18} color={VROOM_COLORS.accent} />
              <Text style={styles.repostText}>Repost to Your Garage</Text>
            </Pressable>

          </View>

          {/* Bottom Padding */}
          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: VROOM_COLORS.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: VROOM_COLORS.dark,
  },

  // === SCROLL ===
  scrollContent: {
    paddingBottom: 0,
  },

  // === POST IMAGE (OPTIMIZED) ===
  postImage: {
    width: width,
    height: (height * 2) / 5, // Reduced from 3/4 to 2/5 for better UX
    backgroundColor: VROOM_COLORS.fieldBg,
  },

  // === INFO SECTION ===
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: VROOM_COLORS.dark,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    marginBottom: 12,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderTopColor: VROOM_COLORS.border,
    borderBottomColor: VROOM_COLORS.border,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: VROOM_COLORS.dark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: VROOM_COLORS.muted,
    fontWeight: '500',
  },
  postDescription: {
    fontSize: 14,
    color: VROOM_COLORS.dark,
    lineHeight: 20,
    marginBottom: 12,
  },
  postDate: {
    fontSize: 12,
    color: VROOM_COLORS.muted,
    fontWeight: '400',
    marginBottom: 16,
  },

  // === DIVIDER ===
  divider: {
    height: 0.5,
    backgroundColor: VROOM_COLORS.border,
    marginVertical: 16,
  },

  // === ACTION BUTTONS ===
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: VROOM_COLORS.dark,
  },

  // === REPOST BUTTON ===
  repostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(229, 9, 20, 0.05)',
    borderWidth: 1.5,
    borderColor: VROOM_COLORS.accent,
  },
  repostText: {
    fontSize: 14,
    fontWeight: '600',
    color: VROOM_COLORS.accent,
  },
});
