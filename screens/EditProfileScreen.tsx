import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context/AppContext';
import type { ProfileTag } from '../context/AppContext';
import { getTranslation } from '../i18n';

const VROOM_COLORS = {
  bg: '#FFFFFF',
  dark: '#140102',
  accent: '#E50914',
  muted: '#8E8E93',
  fieldBg: 'rgba(20, 1, 2, 0.05)',
  border: '#EEEEEE',
};

const CONTAINER_PADDING = 16;

type EditProfileScreenProps = { navigation: any };

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const { language, user, updateProfile, updateProfileAvatar } = useAppContext();
  const t = getTranslation(language);

  const [name, setName] = useState(user?.displayName ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarUri, setAvatarUri] = useState(user?.avatar ?? '');
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [tags, setTags] = useState<ProfileTag[]>(user?.tags ?? []);
  const [newTagInput, setNewTagInput] = useState('');
  const [newTagType, setNewTagType] = useState<'brand' | 'place' | 'location'>('brand');

  const changeAvatar = async () => {
    try {
      setIsPickingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setAvatarUri(asset.uri);

        let b64 = asset.base64 ?? null;
        // Web: uri is a data URI when base64 field is absent
        if (!b64 && asset.uri?.startsWith('data:')) {
          const comma = asset.uri.indexOf(',');
          b64 = comma >= 0 ? asset.uri.substring(comma + 1) : null;
        }
        if (b64?.includes(';base64,')) {
          b64 = b64.split(';base64,')[1] ?? b64;
        }
        setAvatarBase64(b64);
      }
    } catch (error) {
      console.error('Image picker error:', error);
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      let finalAvatarUrl = user?.avatar ?? '';

      const isNewAvatar = avatarBase64 !== null;
      if (isNewAvatar) {
        const filePath = `${user.id}/avatar.jpg`;
        const binaryStr = atob(avatarBase64!);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, bytes, { upsert: true, contentType: 'image/jpeg' });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
          finalAvatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;
        } else {
          console.error('EditProfile avatar upload error:', uploadError.message);
        }
      } else if (avatarUri.startsWith('http')) {
        finalAvatarUrl = avatarUri;
      }

      await supabase
        .from('profiles')
        .update({
          full_name: name.trim(),
          username: username.trim().toLowerCase(),
          bio: bio.trim(),
          avatar_url: finalAvatarUrl || null,
        })
        .eq('id', user.id);

      updateProfile({
        displayName: name.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        avatar: finalAvatarUrl,
        tags,
      });

      navigation.goBack();
    } catch (error) {
      console.error('Save profile error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = () => {
    if (newTagInput.trim()) {
      setTags([...tags, { id: String(Date.now()), label: newTagInput.trim(), type: newTagType }]);
      setNewTagInput('');
    }
  };

  const removeTag = (id: string) => setTags(tags.filter((t) => t.id !== id));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={15}>
          <Ionicons name="chevron-down" size={30} color={VROOM_COLORS.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>Modifier le profil</Text>
        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.7 }]}
        >
          <Text style={styles.saveBtnText}>{isSaving ? '...' : 'Terminer'}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            {avatarUri ? (
              <ExpoImage
                source={avatarUri}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                <Ionicons name="person-circle-outline" size={70} color={VROOM_COLORS.muted} />
              </View>
            )}
            <Pressable
              onPress={changeAvatar}
              disabled={isPickingImage}
              style={({ pressed }) => [styles.changeAvatarBtn, pressed && { opacity: 0.8 }]}
            >
              {isPickingImage ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                  <Text style={styles.changeAvatarText}>Changer la photo</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Nom */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Nom</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Votre nom complet"
              placeholderTextColor={VROOM_COLORS.muted}
            />
          </View>

          {/* Username */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Nom d'utilisateur</Text>
            <View style={styles.usernameInputWrapper}>
              <Text style={styles.usernamePrefix}>@</Text>
              <TextInput
                style={styles.usernameInput}
                value={username}
                onChangeText={setUsername}
                placeholder="username"
                placeholderTextColor={VROOM_COLORS.muted}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Bio */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Biographie</Text>
            <TextInput
              style={[styles.textInput, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Parlez-nous de vous"
              placeholderTextColor={VROOM_COLORS.muted}
              multiline
              maxLength={150}
            />
            <Text style={styles.charCount}>{bio.length}/150</Text>
          </View>

          <View style={styles.divider} />

          {/* Tags */}
          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>Tags & Intérêts</Text>
            <Text style={styles.sectionHint}>Appuyez sur × pour supprimer un tag</Text>

            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag) => (
                  <View
                    key={tag.id}
                    style={[styles.tagChip, tag.type === 'brand' ? styles.tagBrand : styles.tagOutlined]}
                  >
                    <Text
                      style={[
                        styles.tagChipText,
                        tag.type === 'brand' ? styles.tagBrandText : styles.tagOutlinedText,
                      ]}
                    >
                      {tag.label}
                    </Text>
                    <Pressable onPress={() => removeTag(tag.id)} style={styles.tagRemoveBtn}>
                      <Ionicons
                        name="close"
                        size={13}
                        color={tag.type === 'brand' ? '#FFFFFF' : VROOM_COLORS.dark}
                      />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.addTagGroup}>
              <TextInput
                style={styles.addTagInput}
                placeholder="Nouveau tag"
                placeholderTextColor={VROOM_COLORS.muted}
                value={newTagInput}
                onChangeText={setNewTagInput}
              />
              <View style={styles.typeSelector}>
                {(['brand', 'place', 'location'] as const).map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setNewTagType(type)}
                    style={[styles.typeBtn, newTagType === type && styles.typeBtnActive]}
                  >
                    <Text style={[styles.typeBtnText, newTagType === type && styles.typeBtnTextActive]}>
                      {type === 'brand' ? 'Marque' : type === 'place' ? 'Lieu' : 'Région'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                onPress={addTag}
                disabled={!newTagInput.trim()}
                style={({ pressed }) => [
                  styles.addTagBtn,
                  pressed && { opacity: 0.7 },
                  !newTagInput.trim() && { opacity: 0.4 },
                ]}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.addTagBtnText}>Ajouter</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.infoText}>
            Les modifications seront visibles sur votre profil public.
          </Text>
          <View style={{ height: 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VROOM_COLORS.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CONTAINER_PADDING,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: VROOM_COLORS.border,
  },
  headerTitle: { fontSize: 15, fontWeight: '600', color: VROOM_COLORS.dark },
  saveBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: VROOM_COLORS.accent },
  scrollContent: { paddingHorizontal: CONTAINER_PADDING, paddingVertical: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: VROOM_COLORS.fieldBg,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: VROOM_COLORS.accent,
  },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  changeAvatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: VROOM_COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  changeAvatarText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: VROOM_COLORS.dark,
    marginBottom: 7,
    letterSpacing: 0.3,
  },
  textInput: {
    backgroundColor: VROOM_COLORS.fieldBg,
    borderWidth: 1,
    borderColor: VROOM_COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
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
  usernamePrefix: { fontSize: 14, fontWeight: '600', color: VROOM_COLORS.muted, marginRight: 4 },
  usernameInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: VROOM_COLORS.dark },
  bioInput: { height: 90, textAlignVertical: 'top' },
  charCount: { fontSize: 10, color: VROOM_COLORS.muted, marginTop: 5, textAlign: 'right' },
  divider: { height: 0.5, backgroundColor: VROOM_COLORS.border, marginVertical: 18 },
  tagsSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: VROOM_COLORS.dark, marginBottom: 4 },
  sectionHint: { fontSize: 10, color: VROOM_COLORS.muted, marginBottom: 12 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
    gap: 5,
  },
  tagBrand: { backgroundColor: VROOM_COLORS.accent },
  tagOutlined: { borderWidth: 1, borderColor: '#CCCCCC' },
  tagChipText: { fontSize: 11, fontWeight: '600' },
  tagBrandText: { color: '#FFFFFF' },
  tagOutlinedText: { color: VROOM_COLORS.dark },
  tagRemoveBtn: { padding: 2 },
  addTagGroup: {
    backgroundColor: VROOM_COLORS.fieldBg,
    borderRadius: 10,
    padding: 12,
  },
  addTagInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: VROOM_COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: VROOM_COLORS.dark,
    marginBottom: 10,
  },
  typeSelector: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  typeBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: VROOM_COLORS.border,
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: VROOM_COLORS.accent, borderColor: VROOM_COLORS.accent },
  typeBtnText: { fontSize: 10, fontWeight: '600', color: VROOM_COLORS.dark },
  typeBtnTextActive: { color: '#FFFFFF' },
  addTagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: VROOM_COLORS.accent,
    paddingVertical: 9,
    borderRadius: 8,
  },
  addTagBtnText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  infoText: { fontSize: 11, color: VROOM_COLORS.muted, lineHeight: 17 },
});
