import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Modal,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import ImageService from '../services/ImageService';
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

const CONTAINER_PADDING = 16;
const FALLBACK_IMAGE = require('../assets/logo_vroom_Couleur.png');

type CreateStoryScreenProps = {
  visible: boolean;
  onClose: () => void;
  onStoryAdded: (image: string, name: string) => void;
};

export default function CreateStoryScreen({
  visible,
  onClose,
  onStoryAdded,
}: CreateStoryScreenProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [storyName, setStoryName] = useState('');
  const { addHighlight } = useAppContext();

  const pickImage = async () => {
    try {
      setIsLoading(true);
      const pickedImage = await ImageService.pickImage([9, 16], 0.8);
      if (pickedImage) {
        setSelectedImage(pickedImage);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishStory = async () => {
    if (!selectedImage || !storyName.trim()) {
      alert('Please select an image and enter a name');
      return;
    }

    setIsLoading(true);
    try {
      // Upload and compress image
      const uploadResult = await ImageService.uploadImage(selectedImage, 'stories');
      
      if (uploadResult.success) {
        // Add to global highlights
        const newHighlight = {
          id: String(Date.now()),
          name: storyName,
          image: uploadResult.url,
          createdAt: Date.now(),
          storyCount: 1,
        };
        
        addHighlight(newHighlight);
        
        // Call parent callback for UI update
        onStoryAdded(uploadResult.url, storyName);
        
        // Reset state
        setSelectedImage(null);
        setStoryName('');
        setIsLoading(false);
        onClose();
      } else {
        alert('Failed to upload story');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error publishing story:', error);
      alert('Failed to publish story');
      setIsLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
      {/* === HEADER === */}
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={15}>
          <Ionicons name="chevron-down" size={32} color={VROOM_COLORS.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>Create Story</Text>
        <Pressable
          onPress={handlePublishStory}
          disabled={isLoading || !selectedImage || !storyName.trim()}
          style={({ pressed }) => [
            styles.shareBtn,
            (pressed || isLoading || !selectedImage || !storyName.trim()) && {
              opacity: 0.6,
            },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={VROOM_COLORS.accent} />
          ) : (
            <Text style={styles.shareBtnText}>Share</Text>
          )}
        </Pressable>
      </View>

      {/* === CONTENT === */}
      <View style={styles.content}>
        {selectedImage ? (
          <>
            {/* Story Preview */}
            <View style={styles.previewContainer}>
              <ExpoImage
                source={selectedImage}
                style={styles.storyPreview}
                contentFit="cover"
              />
              <Pressable
                onPress={() => setSelectedImage(null)}
                style={styles.changePhotoBtn}
              >
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </Pressable>
            </View>

            {/* Story Name Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Story Name</Text>
              <View style={styles.nameInputWrapper}>
                <TextInput
                  style={styles.nameInput}
                  value={storyName}
                  onChangeText={setStoryName}
                  placeholder="e.g., Track Day, Car Meet"
                  placeholderTextColor={VROOM_COLORS.muted}
                  maxLength={20}
                />
                <Text style={styles.charCounter}>
                  {storyName.length}/20
                </Text>
              </View>
            </View>
          </>
        ) : (
          /* Initial State - Pick Image */
          <View style={styles.emptyState}>
            <View style={styles.iconContainer}>
              <Ionicons name="images" size={64} color={VROOM_COLORS.accent} />
            </View>
            <Text style={styles.emptyTitle}>No Photo Selected</Text>
            <Text style={styles.emptyHint}>
              Pick a photo from your gallery to create a story
            </Text>
            <Pressable
              onPress={pickImage}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.pickPhotoBtn,
                pressed && { backgroundColor: 'rgba(229, 9, 20, 0.85)' },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="images-outline"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.pickPhotoBtnText}>Pick Photo</Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </View>
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
    paddingHorizontal: CONTAINER_PADDING,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: VROOM_COLORS.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: VROOM_COLORS.dark,
  },
  shareBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: VROOM_COLORS.accent,
  },

  // === CONTENT ===
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: CONTAINER_PADDING,
  },

  // === PREVIEW STATE ===
  previewContainer: {
    marginBottom: 24,
  },
  storyPreview: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    backgroundColor: VROOM_COLORS.fieldBg,
    marginBottom: 16,
  },
  changePhotoBtn: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: VROOM_COLORS.fieldBg,
    borderRadius: 8,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '600',
    color: VROOM_COLORS.dark,
  },

  // === INPUT SECTION ===
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: VROOM_COLORS.dark,
    marginBottom: 8,
  },
  nameInputWrapper: {
    backgroundColor: VROOM_COLORS.fieldBg,
    borderWidth: 1,
    borderColor: VROOM_COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
    fontSize: 14,
    color: VROOM_COLORS.dark,
  },
  charCounter: {
    fontSize: 11,
    color: VROOM_COLORS.muted,
    marginLeft: 8,
  },

  // === EMPTY STATE ===
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: VROOM_COLORS.dark,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 13,
    color: VROOM_COLORS.muted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  pickPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: VROOM_COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  pickPhotoBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
