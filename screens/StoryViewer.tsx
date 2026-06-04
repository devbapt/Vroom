import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';

const { width, height } = Dimensions.get('window');

// --- Colors ---
const VROOM_COLORS = {
  bg:      '#140102',
  dark:    '#140102',
  accent:  '#E50914',
  muted:   'rgba(255,255,255,0.45)',
  fieldBg: '#1F0808',
  border:  'rgba(255,255,255,0.12)',
  white:   '#FFFFFF',
};

const FALLBACK_IMAGE = require('../assets/logo_vroom_Couleur.png');

type StoryItem = {
  id: string;
  image: string;
  duration?: number;
  userId?: string;
};

type StoryViewerProps = {
  visible: boolean;
  highlightId: string;
  onClose: () => void;
  stories?: StoryItem[];
  currentUserId?: string;
  onStoryDelete?: (storyId: string) => void;
};

export default function StoryViewer({ visible, highlightId, onClose, stories, currentUserId, onStoryDelete }: StoryViewerProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progressAnim] = useState(new Animated.Value(0));
  const displayStories = stories || [];
  const currentStory = displayStories[currentStoryIndex];

  // Auto-advance story
  useEffect(() => {
    if (!visible || !currentStory) return;

    const duration = currentStory.duration || 5000;

    // Reset and animate progress
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        // Move to next story
        if (currentStoryIndex < displayStories.length - 1) {
          setCurrentStoryIndex(currentStoryIndex + 1);
        } else {
          // Close viewer when stories end
          onClose();
        }
      }
    });

    return () => {
      progressAnim.setValue(0);
    };
  }, [visible, currentStoryIndex, currentStory, displayStories.length]);

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      onClose();
    }
  };

  if (!currentStory) return null;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal
      animationType="fade"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        
        {/* === PROGRESS BAR === */}
        <View style={styles.progressContainer}>
          {stories.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.progressBar,
                {
                  backgroundColor:
                    idx < currentStoryIndex
                      ? VROOM_COLORS.accent
                      : idx === currentStoryIndex
                      ? VROOM_COLORS.border
                      : 'rgba(255,255,255,0.3)',
                },
              ]}
            />
          ))}
        </View>

        {/* === CLOSE BUTTON === */}
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={15}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </Pressable>

        {/* === DELETE BUTTON (own stories only) === */}
        {currentStory?.userId && currentStory.userId === currentUserId && (
          <Pressable
            style={styles.deleteBtn}
            hitSlop={12}
            onPress={() => {
              Alert.alert('Supprimer cette story ?', 'Elle disparaîtra définitivement.', [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Supprimer', style: 'destructive',
                  onPress: async () => {
                    await supabase.from('stories').delete().eq('id', currentStory.id);
                    onStoryDelete?.(currentStory.id);
                  },
                },
              ]);
            }}
          >
            <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          </Pressable>
        )}

        {/* === STORY IMAGE (FULLSCREEN) === */}
        <ExpoImage
          source={currentStory.image}
          style={styles.storyImage}
          placeholder={FALLBACK_IMAGE}
          contentFit="cover"
        />

        {/* === TAP ZONES FOR NAVIGATION === */}
        <View style={styles.navigationOverlay}>
          {/* Previous Zone */}
          <Pressable
            onPress={handlePrevious}
            style={styles.tapZone}
            hitSlop={0}
          />

          {/* Next Zone */}
          <Pressable
            onPress={handleNext}
            style={[styles.tapZone, { marginLeft: 'auto' }]}
            hitSlop={0}
          />
        </View>

        {/* === STORY COUNTER (Bottom-left) === */}
        <View style={styles.storyCounter}>
          <Text style={styles.counterText}>
            {currentStoryIndex + 1} / {stories.length}
          </Text>
        </View>

      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // === PROGRESS BAR ===
  progressContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 4,
    zIndex: 100,
  },
  progressBar: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },

  // === CLOSE BUTTON ===
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 100,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    position: 'absolute',
    top: 16,
    right: 60,
    zIndex: 100,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // === STORY IMAGE ===
  storyImage: {
    width: width,
    height: height,
  },

  // === TAP ZONES (LEFT/RIGHT) ===
  navigationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    pointerEvents: 'box-none',
  },
  tapZone: {
    flex: 1,
    pointerEvents: 'auto',
  },

  // === STORY COUNTER ===
  storyCounter: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    zIndex: 100,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
