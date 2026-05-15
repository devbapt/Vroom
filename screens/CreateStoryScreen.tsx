import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PREVIEW_HEIGHT = Math.min(SCREEN_HEIGHT * 0.55, (SCREEN_WIDTH - 32) * 16 / 9);

const C = {
  bg: '#140102',
  surface: 'rgba(255,255,255,0.05)',
  surfaceActive: 'rgba(229,9,20,0.12)',
  accent: '#E50914',
  white: '#FFFFFF',
  whiteSoft: 'rgba(255,255,255,0.6)',
  whiteFaint: 'rgba(255,255,255,0.2)',
  placeholder: 'rgba(255,255,255,0.35)',
  border: 'rgba(255,255,255,0.1)',
  borderActive: 'rgba(229,9,20,0.6)',
};

const MONO = 'Courier';

export default function CreateStoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, addFeedStory, addHighlight, highlights } = useAppContext();

  const [imageUri, setImageUri] = useState('');
  const [caption, setCaption] = useState('');
  const [addToHighlights, setAddToHighlights] = useState(false);
  const [selectedHighlightId, setSelectedHighlightId] = useState<string>('');

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Accès à la galerie nécessaire.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  const handlePublish = useCallback(() => {
    if (!imageUri) {
      Alert.alert('Photo requise', 'Sélectionne une photo pour publier ta story.');
      return;
    }

    addFeedStory({
      userId: user?.id ?? 'user_123',
      username: user?.username ?? 'moi',
      avatar: user?.avatar ?? '',
      imageUrl: imageUri,
    });

    if (addToHighlights) {
      if (selectedHighlightId) {
        // add to existing highlight (just increment count — Supabase will handle real data)
      } else {
        // create new highlight
        addHighlight({
          id: Date.now().toString(),
          name: 'Story',
          image: imageUri,
          storyCount: 1,
        });
      }
    }

    navigation.goBack();
  }, [imageUri, addFeedStory, addToHighlights, selectedHighlightId, addHighlight, user, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={C.white} />
        </Pressable>
        <Text style={styles.headerTitle}>NOUVELLE STORY</Text>
        <Pressable
          style={({ pressed }) => [
            styles.publishBtn,
            !imageUri && styles.publishBtnDisabled,
            pressed && { opacity: 0.8 },
          ]}
          onPress={handlePublish}
          disabled={!imageUri}
        >
          <Text style={styles.publishBtnText}>PUBLIER</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Photo preview */}
        <Pressable onPress={pickImage} style={styles.previewArea}>
          {imageUri ? (
            <>
              <ExpoImage
                source={imageUri}
                style={styles.preview}
                contentFit="cover"
              />
              <View style={styles.replaceOverlay}>
                <Ionicons name="camera-outline" size={18} color={C.white} />
                <Text style={styles.replaceText}>Changer</Text>
              </View>
            </>
          ) : (
            <View style={styles.previewPlaceholder}>
              <Ionicons name="add-circle-outline" size={48} color={C.whiteFaint} />
              <Text style={styles.previewPlaceholderTitle}>Sélectionner une photo</Text>
              <Text style={styles.previewPlaceholderHint}>Format 9:16 · Visible 24h</Text>
            </View>
          )}
        </Pressable>

        {/* Caption */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.accentBar} />
            <Text style={styles.sectionTitle}>LÉGENDE (optionnel)</Text>
          </View>
          <TextInput
            style={styles.captionInput}
            value={caption}
            onChangeText={(v) => v.length <= 100 && setCaption(v)}
            placeholder="Ajoute une légende à ta story…"
            placeholderTextColor={C.placeholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            selectionColor={C.accent}
          />
          <Text style={styles.charCount}>{caption.length}/100</Text>
        </View>

        {/* Highlights toggle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.accentBar} />
            <Text style={styles.sectionTitle}>AJOUTER AUX HIGHLIGHTS</Text>
          </View>

          <Pressable
            style={styles.toggleRow}
            onPress={() => setAddToHighlights(v => !v)}
          >
            <Text style={styles.toggleLabel}>Enregistrer dans mes Highlights</Text>
            <View style={[styles.toggle, addToHighlights && styles.toggleOn]}>
              <View style={[styles.toggleThumb, addToHighlights && styles.toggleThumbOn]} />
            </View>
          </Pressable>

          {addToHighlights && (
            <View style={styles.highlightList}>
              <Text style={styles.highlightHint}>Choisir une catégorie :</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.highlightChips}>
                {highlights.map(h => {
                  const active = selectedHighlightId === h.id;
                  return (
                    <Pressable
                      key={h.id}
                      style={[styles.highlightChip, active && styles.highlightChipActive]}
                      onPress={() => setSelectedHighlightId(active ? '' : h.id)}
                    >
                      <Text style={[styles.highlightChipText, active && styles.highlightChipTextActive]}>
                        {h.name}
                      </Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  style={[styles.highlightChip, selectedHighlightId === 'new' && styles.highlightChipActive]}
                  onPress={() => setSelectedHighlightId('new')}
                >
                  <Ionicons name="add" size={12} color={selectedHighlightId === 'new' ? C.accent : C.whiteSoft} />
                  <Text style={[styles.highlightChipText, selectedHighlightId === 'new' && styles.highlightChipTextActive]}>
                    Nouveau
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  headerTitle: {
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: 2,
    color: C.white,
    fontWeight: '700',
  },
  publishBtn: {
    backgroundColor: C.accent,
    borderRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  publishBtnDisabled: { opacity: 0.35 },
  publishBtnText: {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: 1.5,
    color: C.white,
    fontWeight: '700',
  },

  content: { paddingHorizontal: 16, paddingTop: 16 },

  previewArea: {
    width: '100%',
    height: PREVIEW_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
  },
  preview: { width: '100%', height: '100%' },
  replaceOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  replaceText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.white,
  },
  previewPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  previewPlaceholderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: C.whiteSoft,
  },
  previewPlaceholderHint: {
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: 1,
    color: C.whiteFaint,
  },

  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  accentBar: {
    width: 3, height: 14, borderRadius: 1.5,
    backgroundColor: C.accent,
  },
  sectionTitle: {
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: 2,
    color: C.whiteSoft,
    fontWeight: '600',
  },

  captionInput: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.white,
    fontSize: 14,
    minHeight: 80,
  },
  charCount: {
    fontFamily: MONO,
    fontSize: 9,
    color: C.whiteFaint,
    textAlign: 'right',
    marginTop: 4,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleLabel: {
    fontSize: 14,
    color: C.white,
    fontWeight: '500',
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 3,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: C.accent },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.white,
    alignSelf: 'flex-start',
  },
  toggleThumbOn: { alignSelf: 'flex-end' },

  // Highlights
  highlightList: { marginTop: 14 },
  highlightHint: {
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: 1,
    color: C.whiteFaint,
    marginBottom: 8,
  },
  highlightChips: { gap: 8 },
  highlightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  highlightChipActive: {
    borderColor: C.borderActive,
    backgroundColor: C.surfaceActive,
  },
  highlightChipText: {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: 1,
    color: C.whiteSoft,
    fontWeight: '600',
  },
  highlightChipTextActive: { color: C.accent },
});
