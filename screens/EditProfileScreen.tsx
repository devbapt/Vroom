import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

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

type EditProfileScreenProps = {
  navigation: any;
};

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const [name, setName] = useState('John Drives');
  const [username, setUsername] = useState('JohnDrives');
  const [bio, setBio] = useState('Passionate about high-performance cars and automotive excellence');
  const [avatarUri, setAvatarUri] = useState(
    'https://i.pravatar.cc/150?img=12'
  );
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const insets = useSafeAreaInsets();

  const changeAvatar = async () => {
    try {
      setIsPickingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      alert('Failed to change avatar');
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simule une sauvegarde
    setTimeout(() => {
      setIsSaving(false);
      navigation.goBack();
    }, 800);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* === HEADER === */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={15}>
          <Ionicons name="chevron-down" size={32} color={VROOM_COLORS.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Done'}</Text>
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
          {/* === AVATAR SECTION === */}
          <View style={styles.avatarSection}>
            <ExpoImage
              source={avatarUri}
              style={styles.avatarImage}
              placeholder="https://i.pravatar.cc/150"
              contentFit="cover"
            />
            <Pressable
              onPress={changeAvatar}
              disabled={isPickingImage}
              style={({ pressed }) => [
                styles.changeAvatarBtn,
                pressed && { backgroundColor: 'rgba(229, 9, 20, 0.85)' },
              ]}
            >
              {isPickingImage ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="camera" size={18} color="#FFFFFF" />
                  <Text style={styles.changeAvatarText}>Change Photo</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* === NAME FIELD === */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor={VROOM_COLORS.muted}
            />
          </View>

          {/* === USERNAME FIELD === */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Username</Text>
            <View style={styles.usernameInputWrapper}>
              <Text style={styles.usernamePrefix}>@</Text>
              <TextInput
                style={styles.usernameInput}
                value={username}
                onChangeText={setUsername}
                placeholder="username"
                placeholderTextColor={VROOM_COLORS.muted}
              />
            </View>
          </View>

          {/* === BIO FIELD === */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[styles.textInput, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              placeholderTextColor={VROOM_COLORS.muted}
              multiline
              maxLength={150}
            />
            <Text style={styles.charCount}>{bio.length}/150</Text>
          </View>

          {/* === DIVIDER === */}
          <View style={styles.divider} />

          {/* === INFO TEXT === */}
          <Text style={styles.infoText}>
            Changes will be saved to your profile and visible to everyone.
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
  saveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: VROOM_COLORS.accent,
  },

  // === SCROLL ===
  scrollContent: {
    paddingHorizontal: CONTAINER_PADDING,
    paddingVertical: 20,
  },

  // === AVATAR SECTION ===
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: VROOM_COLORS.fieldBg,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: VROOM_COLORS.accent,
  },
  changeAvatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: VROOM_COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  changeAvatarText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // === FIELDS ===
  fieldGroup: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: VROOM_COLORS.dark,
    marginBottom: 8,
    letterSpacing: 0.3,
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
  usernameInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: VROOM_COLORS.fieldBg,
    borderWidth: 1,
    borderColor: VROOM_COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  usernamePrefix: {
    fontSize: 14,
    fontWeight: '600',
    color: VROOM_COLORS.muted,
    marginRight: 4,
  },
  usernameInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: VROOM_COLORS.dark,
  },
  bioInput: {
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
