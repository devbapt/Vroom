import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  Pressable, Switch, ActivityIndicator, Alert, Platform,
  TouchableOpacity, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context/AppContext';

const C = {
  bg: '#FFFFFF', dark: '#121212', accent: '#D91D2F',
  muted: '#8E8E93', border: '#F0F0F0', fieldBg: '#F7F7F7',
};
const PAD = 20;

export default function CreateGroupScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAppContext();

  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate]     = useState(true);
  const [requireVehicle, setRequireVehicle] = useState(false);
  const [requireReason, setRequireReason]   = useState(true);
  const [avatarUri, setAvatarUri]     = useState<string | null>(null);
  const [avatarB64, setAvatarB64]     = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);

  const pickAvatar = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1],
      quality: 0.8, base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      setAvatarB64(result.assets[0].base64 ?? null);
    }
  }, []);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      Platform.OS === 'web'
        ? alert('Le nom du groupe est obligatoire.')
        : Alert.alert('Champ requis', 'Le nom du groupe est obligatoire.');
      return;
    }
    if (!user?.id) return;
    setSaving(true);

    try {
      let avatarUrl: string | null = null;

      // Upload avatar
      if (avatarB64) {
        const path = `groups/${crypto.randomUUID()}.jpg`;
        const bytes = Uint8Array.from(atob(avatarB64), c => c.charCodeAt(0));
        const { error: upErr } = await supabase.storage
          .from('avatars').upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
          avatarUrl = urlData.publicUrl;
        }
      }

      // Create group
      const groupId = crypto.randomUUID();
      const { error: gErr } = await supabase.from('groups').insert({
        id: groupId,
        name: name.trim(),
        description: description.trim() || null,
        avatar_url: avatarUrl,
        creator_id: user.id,
        is_private: isPrivate,
        require_vehicle: requireVehicle,
        require_reason: requireReason,
        member_count: 1,
      });
      if (gErr) throw new Error(gErr.message);

      // Add creator as admin
      const { error: mErr } = await supabase.from('group_members').insert({
        group_id: groupId, user_id: user.id, role: 'admin',
      });
      if (mErr) throw new Error(mErr.message);

      navigation.goBack();
      setTimeout(() => {
        Platform.OS !== 'web' && Alert.alert('Groupe créé !', `"${name.trim()}" est maintenant actif.`);
      }, 300);
    } catch (e: any) {
      const msg = e?.message ?? 'Erreur lors de la création.';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Erreur', msg);
    } finally {
      setSaving(false);
    }
  }, [name, description, isPrivate, requireVehicle, requireReason, avatarB64, user?.id, navigation]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={C.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau groupe</Text>
        <TouchableOpacity
          onPress={handleCreate}
          disabled={saving || !name.trim()}
          style={[styles.createBtn, (!name.trim() || saving) && { opacity: 0.4 }]}
        >
          {saving
            ? <ActivityIndicator size="small" color="#FFF" />
            : <Text style={styles.createBtnText}>Créer</Text>
          }
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Avatar picker */}
          <TouchableOpacity style={styles.avatarPicker} onPress={pickAvatar} activeOpacity={0.8}>
            {avatarUri ? (
              <ExpoImage source={avatarUri} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="camera-outline" size={28} color={C.muted} />
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={12} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Photo du groupe</Text>

          {/* Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Nom du groupe <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              value={name}
              onChangeText={setName}
              placeholder="Ex : Porsche Île-de-France"
              placeholderTextColor={C.muted}
              maxLength={60}
            />
            <Text style={styles.charCount}>{name.length}/60</Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.inputMulti, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décris ton groupe, ses objectifs, le type de véhicules…"
              placeholderTextColor={C.muted}
              multiline
              maxLength={300}
            />
            <Text style={styles.charCount}>{description.length}/300</Text>
          </View>

          {/* Settings */}
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>Conditions d'adhésion</Text>

            <ToggleRow
              icon="lock-closed-outline"
              label="Groupe privé"
              sub="Les nouvelles demandes nécessitent votre approbation"
              value={isPrivate}
              onChange={setIsPrivate}
            />
            <View style={styles.divider} />

            <ToggleRow
              icon="car-outline"
              label="Fiche véhicule requise"
              sub="Le candidat doit renseigner son véhicule"
              value={requireVehicle}
              onChange={setRequireVehicle}
            />
            <View style={styles.divider} />

            <ToggleRow
              icon="chatbubble-ellipses-outline"
              label="Raison de rejoindre requise"
              sub="Le candidat doit expliquer sa motivation"
              value={requireReason}
              onChange={setRequireReason}
            />
          </View>

          {/* Info box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={C.accent} />
            <Text style={styles.infoText}>
              En tant que créateur, vous êtes automatiquement administrateur du groupe.
              Vous pourrez inviter des membres et gérer les demandes depuis la page du groupe.
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ToggleRow({
  icon, label, sub, value, onChange,
}: { icon: string; label: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <View style={[styles.toggleIcon, value && styles.toggleIconActive]}>
        <Ionicons name={icon as any} size={16} color={value ? '#FFF' : C.muted} />
      </View>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: C.border, true: C.accent }}
        thumbColor="#FFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
  },
  headerBtn:   { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.dark },
  createBtn: {
    backgroundColor: C.accent, paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, minWidth: 60, alignItems: 'center',
  },
  createBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  content: { paddingHorizontal: PAD, paddingTop: 24, paddingBottom: 40, gap: 20 },

  // Avatar
  avatarPicker: { alignSelf: 'center', position: 'relative' },
  avatarImg: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: C.fieldBg, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.border, borderStyle: 'dashed',
  },
  avatarBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: C.bg,
  },
  avatarHint: { fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 6 },

  // Fields
  section:    { gap: 6 },
  label:      { fontSize: 12, fontWeight: '700', color: C.dark, letterSpacing: 0.3 },
  required:   { color: C.accent },
  charCount:  { fontSize: 10, color: C.muted, textAlign: 'right' },
  input: {
    backgroundColor: C.fieldBg, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.dark,
    borderWidth: 1, borderColor: C.border,
  },
  inputMulti: { minHeight: 88, textAlignVertical: 'top' },

  // Settings card
  settingsCard: {
    backgroundColor: C.bg, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    overflow: 'hidden',
  },
  settingsTitle: {
    fontSize: 11, fontWeight: '700', color: C.muted,
    letterSpacing: 0.5, padding: 14, paddingBottom: 10,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginLeft: 56 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
  },
  toggleIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: C.fieldBg, justifyContent: 'center', alignItems: 'center',
  },
  toggleIconActive: { backgroundColor: C.accent },
  toggleText: { flex: 1, gap: 2 },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: C.dark },
  toggleSub:   { fontSize: 11, color: C.muted, lineHeight: 15 },

  // Info
  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: 'rgba(217,29,47,0.06)',
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(217,29,47,0.15)',
  },
  infoText: { flex: 1, fontSize: 12, color: C.dark, lineHeight: 18 },
});
