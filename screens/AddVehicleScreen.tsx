import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ImageService from '../services/ImageService';
import { useAppContext } from '../context';

const { width } = Dimensions.get('window');

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

type AddVehicleScreenProps = {
  navigation: any;
};

export default function AddVehicleScreen({ navigation }: AddVehicleScreenProps) {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const insets = useSafeAreaInsets();
  const { addPost } = useAppContext();

  const pickImageFromGallery = async () => {
    try {
      setIsPickingImage(true);
      const pickedImage = await ImageService.pickImage([4, 3], 0.8);
      if (pickedImage) {
        setImageUrl(pickedImage);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image');
    } finally {
      setIsPickingImage(false);
    }
  };

  const handlePublish = async () => {
    if (!brand || !model) {
      alert('Please fill in Brand and Model');
      return;
    }
    if (!imageUrl) {
      alert('Please select an image');
      return;
    }
    setIsLoading(true);
    try {
      // Upload and compress image
      const uploadResult = await ImageService.uploadImage(imageUrl, 'posts');
      
      if (uploadResult.success) {
        // Add to global state
        addPost({
          id: String(Date.now()),
          title: `${brand} ${model}`,
          image: uploadResult.url,
          description: description || undefined,
          likes: 0,
          comments: 0,
          shares: 0,
        });
        
        alert('Vehicle added successfully!');
        navigation.goBack();
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Publish error:', error);
      alert('Failed to add vehicle');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* === HEADER === */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={15}>
          <Ionicons name="chevron-down" size={32} color={VROOM_COLORS.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Vehicle</Text>
        <Pressable
          onPress={handlePublish}
          disabled={isLoading || !brand || !model}
          style={({ pressed }) => [
            styles.publishBtn,
            (pressed || isLoading || !brand || !model) && { opacity: 0.6 },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={VROOM_COLORS.accent} />
          ) : (
            <Text style={styles.publishBtnText}>Publish</Text>
          )}
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* === IMAGE PICKER (Gallery) === */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Cover Image *</Text>
            <Pressable
              onPress={pickImageFromGallery}
              disabled={isPickingImage}
              style={({ pressed }) => [
                styles.imagePickerBtn,
                pressed && { backgroundColor: 'rgba(229, 9, 20, 0.08)' },
              ]}
            >
              {isPickingImage ? (
                <ActivityIndicator size="small" color={VROOM_COLORS.accent} />
              ) : (
                <>
                  <Ionicons name="images-outline" size={24} color={VROOM_COLORS.accent} />
                  <Text style={styles.imagePickerText}>Select from Gallery</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* === IMAGE PREVIEW SECTION === */}
          {imageUrl && (
            <View style={styles.imagePreviewSection}>
              <ExpoImage
                source={imageUrl}
                style={styles.previewImage}
                placeholder={FALLBACK_IMAGE}
                contentFit="cover"
              />
              <Pressable
                onPress={() => setImageUrl('')}
                style={styles.removeImageBtn}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          )}

          {/* === BRAND FIELD === */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Brand *</Text>
            <TextInput
              style={styles.textInput}
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g., Ferrari, Porsche"
              placeholderTextColor={VROOM_COLORS.muted}
            />
          </View>

          {/* === MODEL FIELD === */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Model *</Text>
            <TextInput
              style={styles.textInput}
              value={model}
              onChangeText={setModel}
              placeholder="e.g., F8 Tributo, 911 GT3"
              placeholderTextColor={VROOM_COLORS.muted}
            />
          </View>

          {/* === DESCRIPTION FIELD === */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.descInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add details about your vehicle..."
              placeholderTextColor={VROOM_COLORS.muted}
              multiline
              maxLength={200}
            />
            <Text style={styles.charCount}>{description.length}/200</Text>
          </View>

          {/* === DIVIDER === */}
          <View style={styles.divider} />

          {/* === INFO TEXT === */}
          <Text style={styles.infoText}>
            Your vehicle will be added to your garage and visible to your followers.
          </Text>

          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VROOM_COLORS.bg,
  },
  flex: {
    flex: 1,
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
  publishBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  publishBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: VROOM_COLORS.accent,
  },

  // === SCROLL ===
  scrollContent: {
    paddingHorizontal: CONTAINER_PADDING,
    paddingVertical: 20,
  },

  // === IMAGE PREVIEW ===
  imagePreviewSection: {
    position: 'relative',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    backgroundColor: VROOM_COLORS.fieldBg,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // === IMAGE PICKER BUTTON ===
  imagePickerBtn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: VROOM_COLORS.fieldBg,
    borderWidth: 1.5,
    borderColor: VROOM_COLORS.accent,
    borderRadius: 8,
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  imagePickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: VROOM_COLORS.accent,
  },

  // === FIELDS ===
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: VROOM_COLORS.dark,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  fieldHint: {
    fontSize: 11,
    color: VROOM_COLORS.muted,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  textInput: {
    backgroundColor: VROOM_COLORS.fieldBg,
    borderWidth: 1,
    borderColor: VROOM_COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: VROOM_COLORS.dark,
  },
  descInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: VROOM_COLORS.muted,
    marginTop: 6,
    textAlign: 'right',
  },

  // === DIVIDER ===
  divider: {
    height: 0.5,
    backgroundColor: VROOM_COLORS.border,
    marginVertical: 20,
  },

  // === INFO ===
  infoText: {
    fontSize: 12,
    color: VROOM_COLORS.muted,
    lineHeight: 18,
    fontWeight: '400',
  },
});
