import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';
import { useAppContext } from '../context/AppContext';
import { getTranslation, Language } from '../i18n';

const VROOM_COLORS = {
  bg: '#FFFFFF',
  dark: '#140102',
  accent: '#E50914',
  muted: '#8E8E93',
  fieldBg: 'rgba(20, 1, 2, 0.05)',
  border: '#EEEEEE',
};

const CONTAINER_PADDING = 16;

type SettingsScreenProps = { navigation: any };

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);
  const { language, setLanguage } = useAppContext();
  const t = getTranslation(language);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert('Erreur : ' + error.message);
  };

  const handleLanguageChange = (lang: Language) => setLanguage(lang);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={15}>
          <Ionicons name="chevron-down" size={30} color={VROOM_COLORS.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>{t.settings.title}</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* === LANGUE === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.language.toUpperCase()}</Text>
          <View style={styles.sectionContent}>
            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && { backgroundColor: VROOM_COLORS.fieldBg }]}
              onPress={() => handleLanguageChange('fr')}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t.settings.french}</Text>
                <Text style={styles.settingHint}>{t.settings.language_hint}</Text>
              </View>
              {language === 'fr' && (
                <Ionicons name="checkmark-circle" size={20} color={VROOM_COLORS.accent} />
              )}
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && { backgroundColor: VROOM_COLORS.fieldBg }]}
              onPress={() => handleLanguageChange('en')}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t.settings.english}</Text>
                <Text style={styles.settingHint}>Choose English as app language</Text>
              </View>
              {language === 'en' && (
                <Ionicons name="checkmark-circle" size={20} color={VROOM_COLORS.accent} />
              )}
            </Pressable>
          </View>
        </View>

        {/* === COMPTE === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.account}</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t.settings.private_account}</Text>
                <Text style={styles.settingHint}>{t.settings.private_hint}</Text>
              </View>
              <Switch
                value={privateAccount}
                onValueChange={setPrivateAccount}
                trackColor={{ false: VROOM_COLORS.fieldBg, true: 'rgba(229, 9, 20, 0.3)' }}
                thumbColor={privateAccount ? VROOM_COLORS.accent : VROOM_COLORS.muted}
              />
            </View>

            <View style={styles.divider} />

            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && { backgroundColor: VROOM_COLORS.fieldBg }]}
              onPress={() => navigation.navigate('ChangePassword')}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t.settings.change_password}</Text>
                <Text style={styles.settingHint}>{t.settings.change_password_hint}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={VROOM_COLORS.muted} />
            </Pressable>
          </View>
        </View>

        {/* === NOTIFICATIONS === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.notifications_section}</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t.settings.push}</Text>
                <Text style={styles.settingHint}>{t.settings.push_hint}</Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: VROOM_COLORS.fieldBg, true: 'rgba(229, 9, 20, 0.3)' }}
                thumbColor={pushNotifications ? VROOM_COLORS.accent : VROOM_COLORS.muted}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t.settings.email}</Text>
                <Text style={styles.settingHint}>{t.settings.email_hint}</Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: VROOM_COLORS.fieldBg, true: 'rgba(229, 9, 20, 0.3)' }}
                thumbColor={emailNotifications ? VROOM_COLORS.accent : VROOM_COLORS.muted}
              />
            </View>
          </View>
        </View>

        {/* === AIDE === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings.help_section}</Text>
          <View style={styles.sectionContent}>
            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && { backgroundColor: VROOM_COLORS.fieldBg }]}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t.settings.about}</Text>
                <Text style={styles.settingHint}>{t.settings.version}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={VROOM_COLORS.muted} />
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && { backgroundColor: VROOM_COLORS.fieldBg }]}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t.settings.support}</Text>
                <Text style={styles.settingHint}>{t.settings.support_hint}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={VROOM_COLORS.muted} />
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && { backgroundColor: VROOM_COLORS.fieldBg }]}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t.settings.terms}</Text>
                <Text style={styles.settingHint}>{t.settings.terms_hint}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={VROOM_COLORS.muted} />
            </Pressable>
          </View>
        </View>

        {/* Déconnexion */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
            <Text style={styles.logoutBtnText}>{t.settings.sign_out}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: VROOM_COLORS.bg },
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
  scrollContent: { paddingVertical: 20 },
  section: { marginBottom: 26 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: VROOM_COLORS.muted,
    paddingHorizontal: CONTAINER_PADDING,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: VROOM_COLORS.bg,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderTopColor: VROOM_COLORS.border,
    borderBottomColor: VROOM_COLORS.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: CONTAINER_PADDING,
  },
  settingInfo: { flex: 1, marginRight: 12 },
  settingLabel: { fontSize: 14, fontWeight: '500', color: VROOM_COLORS.dark, marginBottom: 2 },
  settingHint: { fontSize: 11, color: VROOM_COLORS.muted },
  divider: {
    height: 0.5,
    backgroundColor: VROOM_COLORS.border,
    marginHorizontal: CONTAINER_PADDING,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: VROOM_COLORS.accent,
    marginHorizontal: CONTAINER_PADDING,
    paddingVertical: 13,
    borderRadius: 8,
  },
  logoutBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});
