import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  Switch,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../supabaseClient';

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

type SettingsScreenProps = {
  navigation: any;
};

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert('Logout error: ' + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* === HEADER === */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={15}>
          <Ionicons name="chevron-down" size={32} color={VROOM_COLORS.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* === ACCOUNT SECTION === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.sectionContent}>
            {/* Private Account */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Private Account</Text>
                <Text style={styles.settingHint}>Control who can see your posts</Text>
              </View>
              <Switch
                value={privateAccount}
                onValueChange={setPrivateAccount}
                trackColor={{ false: VROOM_COLORS.fieldBg, true: 'rgba(229, 9, 20, 0.3)' }}
                thumbColor={privateAccount ? VROOM_COLORS.accent : VROOM_COLORS.muted}
              />
            </View>

            <View style={styles.divider} />

            {/* Change Password */}
            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && { backgroundColor: VROOM_COLORS.fieldBg }]}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Change Password</Text>
                <Text style={styles.settingHint}>Update your security</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={VROOM_COLORS.muted} />
            </Pressable>
          </View>
        </View>

        {/* === NOTIFICATIONS SECTION === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.sectionContent}>
            {/* Push Notifications */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingHint}>Get notified about activity</Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: VROOM_COLORS.fieldBg, true: 'rgba(229, 9, 20, 0.3)' }}
                thumbColor={pushNotifications ? VROOM_COLORS.accent : VROOM_COLORS.muted}
              />
            </View>

            <View style={styles.divider} />

            {/* Email Notifications */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Email Notifications</Text>
                <Text style={styles.settingHint}>Receive emails about updates</Text>
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

        {/* === HELP SECTION === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Support</Text>

          <View style={styles.sectionContent}>
            {/* About */}
            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && { backgroundColor: VROOM_COLORS.fieldBg }]}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>About Vroom</Text>
                <Text style={styles.settingHint}>Version 1.0.0</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={VROOM_COLORS.muted} />
            </Pressable>

            <View style={styles.divider} />

            {/* Contact Support */}
            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && { backgroundColor: VROOM_COLORS.fieldBg }]}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Contact Support</Text>
                <Text style={styles.settingHint}>Get help from our team</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={VROOM_COLORS.muted} />
            </Pressable>

            <View style={styles.divider} />

            {/* Terms & Privacy */}
            <Pressable
              style={({ pressed }) => [styles.settingRow, pressed && { backgroundColor: VROOM_COLORS.fieldBg }]}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Terms & Privacy</Text>
                <Text style={styles.settingHint}>Our policies and terms</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={VROOM_COLORS.muted} />
            </Pressable>
          </View>
        </View>

        {/* === DANGER ZONE === */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          {/* Logout Button */}
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="log-out" size={20} color="#FFFFFF" />
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
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

  // === SCROLL ===
  scrollContent: {
    paddingVertical: 20,
  },

  // === SECTIONS ===
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: VROOM_COLORS.muted,
    paddingHorizontal: CONTAINER_PADDING,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: VROOM_COLORS.bg,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderTopColor: VROOM_COLORS.border,
    borderBottomColor: VROOM_COLORS.border,
  },

  // === SETTING ROW ===
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: CONTAINER_PADDING,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: VROOM_COLORS.dark,
    marginBottom: 4,
  },
  settingHint: {
    fontSize: 12,
    color: VROOM_COLORS.muted,
    fontWeight: '400',
  },

  // === DIVIDER ===
  divider: {
    height: 0.5,
    backgroundColor: VROOM_COLORS.border,
    marginHorizontal: CONTAINER_PADDING,
  },

  // === LOGOUT BUTTON ===
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: VROOM_COLORS.accent,
    marginHorizontal: CONTAINER_PADDING,
    paddingVertical: 14,
    borderRadius: 8,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
