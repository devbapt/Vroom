import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  SafeAreaView,
  Animated,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

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

// --- Story Data Mock ---
type StoryItem = {
  id: string;
  image: string;
  duration?: number; // en ms, défaut 5000
};

const STORY_DATA: { [key: string]: StoryItem[] } = {
  '1': [
    { id: '1-1', image: 'https://images.unsplash.com/photo-1540261014352-7a064dc8cc94?w=500&h=800&fit=crop', duration: 5000 },
    { id: '1-2', image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500&h=800&fit=crop', duration: 5000 },
  ],
  '2': [
    { id: '2-1', image: 'https://images.unsplash.com/photo-1549399542-7e3f8b83ad5e?w=500&h=800&fit=crop', duration: 5000 },
  ],
  '3': [
    { id: '3-1', image: 'https://images.unsplash.com/photo-1507950547674-7a86b984e2a1?w=500&h=800&fit=crop', duration: 5000 },
    { id: '3-2', image: 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=500&h=800&fit=crop', duration: 5000 },
  ],
  '4': [
    { id: '4-1', image: 'https://images.unsplash.com/photo-1514832098174-491d3f3fbf6f?w=500&h=800&fit=crop', duration: 5000 },
  ],
};

type StoryViewerProps = {
  visible: boolean;
  highlightId: string;
  onClose: () => void;
  stories?: StoryItem[]; // Dynamic stories passed from parent
};

export default function StoryViewer({ visible, highlightId, onClose, stories }: StoryViewerProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progressAnim] = useState(new Animated.Value(0));
  const displayStories = stories || STORY_DATA[highlightId] || [];
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
