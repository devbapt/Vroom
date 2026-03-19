import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Modal, // Pour le menu hamburger
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../supabaseClient'; // Fichier de config indispensable

const { width } = Dimensions.get('window');
// Marges et calculs pour un grid compact et propre
const CONTAINER_PADDING = 20;
const CARD_MARGIN = 12;
const CARD_WIDTH = (width - (CONTAINER_PADDING * 2) - CARD_MARGIN) / 2;

// --- Couleurs de la Charte Vroom ---
const VROOM_COLORS = {
  bg: '#FFFFFF', // Fond blanc impératif
  dark: '#140102', // Café Bean pour texte et boutons noirs
  accent: '#E50914', // Racing Red pour accents et icônes
  muted: '#8E8E93', // Gris standard pour sous-titres
  fieldBg: 'rgba(20, 1, 2, 0.05)', // Gris neutre pour fields
};

// --- Données fictives fiables (CDNs rapides) ---
const GARAGE_DATA = [
  { id: '1', name: 'Ferrari F8 Tributo', image: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?q=80&w=800&auto=format&fit=crop' },
  { id: '2', name: 'Porsche 911 GT3', image: 'https://cdn.pixabay.com/photo/2020/07/28/08/29/porsche-911-5444317_1280.jpg' },
  { id: '3', name: 'McLaren 720S', image: 'https://images.unsplash.com/photo-1620882814836-98a2bc903323?q=80&w=800&auto=format&fit=crop' },
  { id: '4', name: 'Lamborghini Huracán', image: 'https://images.unsplash.com/photo-1544636331-e26879cd3d9a?q=80&w=800&auto=format&fit=crop' },
  { id: '5', name: 'Aston Martin DBS', image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=800&auto=format&fit=crop' },
  { id: '6', name: 'Mercedes-AMG GT', image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=800&auto=format&fit=crop' },
];

const FALLBACK_IMAGE = require('../assets/logo_vroom_Couleur.png');

type SafeRemoteImageProps = {
  uri: string;
  style: any;
  containerStyle?: any;
  showLoader?: boolean;
};

// Image distante robuste: affiche un fallback si l'URL échoue
const SafeRemoteImage = ({ uri, style, containerStyle, showLoader = false }: SafeRemoteImageProps) => {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const img = (
    <Image
      source={hasError ? FALLBACK_IMAGE : { uri }}
      style={style}
      resizeMode="cover"
      onLoadStart={() => {
        setLoading(true);
        setHasError(false);
      }}
      onLoadEnd={() => setLoading(false)}
      onError={(e) => {
        console.warn('Image load error:', uri, e?.nativeEvent);
        setHasError(true);
        setLoading(false);
      }}
    />
  );

  const shouldWrap = showLoader || !!containerStyle;
  if (!shouldWrap) return img;

  return (
    <View style={containerStyle}>
      {img}
      {showLoader && loading && (
        <View style={styles.imageLoader}>
          <ActivityIndicator size="small" color={VROOM_COLORS.accent} />
        </View>
      )}
    </View>
  );
};

export default function ProfileScreen() {
  const [menuVisible, setMenuVisible] = useState(false); // État pour le menu hamburger

  const handleLogout = async () => {
    setMenuVisible(false); // Ferme le menu d'abord
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Erreur de déconnexion : " + error.message);
    }
    // AppNavigator détectera la déconnexion et redirigera vers Login
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* HEADER AVEC TITRE CENTRÉ ET MENU À DROITE */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable onPress={() => setMenuVisible(true)} hitSlop={15} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color={VROOM_COLORS.dark} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* INFO PROFIL ET STATS (Nombres plus grands) */}
        <View style={styles.profileInfoContainer}>
          <SafeRemoteImage
            uri="https://randomuser.me/api/portraits/men/32.jpg" // Photo temporaire
            style={styles.avatar}
          />
          <Text style={styles.username}>@JohnDrives</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}><Text style={styles.statNumber}>1.2k</Text><Text style={styles.statLabel}>Followers</Text></View>
            <Text style={styles.statDot}> • </Text>
            <View style={styles.statItem}><Text style={styles.statNumber}>15</Text><Text style={styles.statLabel}>Events</Text></View>
            <Text style={styles.statDot}> • </Text>
            <View style={styles.statItem}><Text style={styles.statNumber}>3</Text><Text style={styles.statLabel}>Groups</Text></View>
          </View>
        </View>

        {/* BOUTONS D'ACTION (Compact et Couleurs Vroom) */}
        <View style={styles.actionButtonsRow}>
          <Pressable style={({ hovered }: any) => [styles.editProfileBtn, hovered && { opacity: 0.8 }]}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </Pressable>
          <Pressable style={({ hovered }: any) => [styles.addVehicleBtn, hovered && { opacity: 0.8 }]}>
            <Text style={styles.addVehicleText}>Add Vehicle</Text>
          </Pressable>
        </View>

        {/* HIGHLIGHTS AVEC COULEUR D'ACCENT ROUGE */}
        <View style={styles.highlightsSection}>
          <Text style={styles.sectionTitleSmall}>HIGHLIGHTS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.highlightsScroll}>
            
            {/* Bouton New */}
            <View style={styles.highlightItem}>
              <View style={[styles.highlightCircle, styles.highlightNew]}>
                <Ionicons name="add" size={28} color={VROOM_COLORS.dark} />
              </View>
              <Text style={styles.highlightLabel}>New</Text>
            </View>

            {/* Bulles Highlights (Cercle Rouge Accent) */}
            <View style={styles.highlightItem}>
              <View style={styles.highlightCircleBorder}>
                <SafeRemoteImage uri={GARAGE_DATA[1].image} style={styles.highlightImage} />
              </View>
              <Text style={styles.highlightLabel}>Car Shows</Text>
            </View>
            <View style={styles.highlightItem}>
              <View style={styles.highlightCircleBorder}>
                <SafeRemoteImage uri={GARAGE_DATA[2].image} style={styles.highlightImage} />
              </View>
              <Text style={styles.highlightLabel}>Track Days</Text>
            </View>
            <View style={styles.highlightItem}>
              <View style={styles.highlightCircleBorder}>
                <SafeRemoteImage uri={GARAGE_DATA[3].image} style={styles.highlightImage} />
              </View>
              <Text style={styles.highlightLabel}>Meets</Text>
            </View>

          </ScrollView>
        </View>

        {/* GARAGE */}
        <View style={styles.garageHeader}>
          <Text style={styles.sectionTitleLarge}>My Garage</Text>
          <Text style={styles.vehicleCount}>6 vehicles</Text>
        </View>

        <View style={styles.garageGrid}>
          {GARAGE_DATA.map((car) => (
            <Pressable key={car.id} style={styles.carCard}>
              <SafeRemoteImage
                uri={car.image}
                style={styles.carImage}
                containerStyle={styles.carImageContainer}
                showLoader
              />
              {/* Overlay dégradé pour le nom de la voiture */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradientOverlay}
              />
              <Text style={styles.carName}>{car.name}</Text>
            </Pressable>
          ))}
        </View>

      </ScrollView>

      {/* --- MENU HAMBURGER (MODAL POPUP) --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuPopup}>
            {/* Contenu du menu */}
            <Text style={styles.menuHeader}>Paramètres</Text>
            
            <View style={styles.menuDivider} />

            <Pressable onPress={handleLogout} style={styles.menuItem}>
              <Ionicons name="log-out-outline" size={22} color={VROOM_COLORS.accent} />
              <Text style={styles.menuItemTextLogout}>Se déconnecter</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: VROOM_COLORS.bg },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: CONTAINER_PADDING, paddingTop: 10, paddingBottom: 15 },
  headerSpacer: { width: 28 }, 
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: VROOM_COLORS.dark },
  menuButton: { width: 28, alignItems: 'flex-end' },
  
  scrollContent: { paddingBottom: 30 },

  // Profile Info
  profileInfoContainer: { alignItems: 'center', marginTop: 10 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#EEEEEE', marginBottom: 15 },
  username: { fontSize: 22, fontWeight: '800', color: VROOM_COLORS.dark, marginBottom: 15 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 13, color: VROOM_COLORS.muted, marginTop: 2 },
  statNumber: { fontWeight: '400', color: VROOM_COLORS.dark, fontSize: 18 }, // Plus grand mais non gras
  statDot: { color: '#D1D1D6', marginHorizontal: 12, fontSize: 18, fontWeight: 'bold' },

  // Boutons Action (Compact et Couleurs Vroom)
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: CONTAINER_PADDING, marginBottom: 30 },
  editProfileBtn: { 
    flex: 1, 
    backgroundColor: VROOM_COLORS.fieldBg, 
    height: 40, 
    borderRadius: 10, 
    justifyContent: 'center',
    alignItems: 'center', 
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(20, 1, 2, 0.08)',
  },
  editProfileText: { color: VROOM_COLORS.dark, fontWeight: '700', fontSize: 14 },
  addVehicleBtn: { 
    flex: 1, 
    backgroundColor: VROOM_COLORS.dark, // Noir
    height: 40, 
    borderRadius: 10, 
    justifyContent: 'center',
    alignItems: 'center', 
    marginLeft: 8 
  },
  addVehicleText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  // Highlights (Rouge Accent)
  highlightsSection: { marginBottom: 30 },
  sectionTitleSmall: { fontSize: 12, fontWeight: 'bold', color: VROOM_COLORS.muted, paddingHorizontal: CONTAINER_PADDING, letterSpacing: 1, marginBottom: 15 },
  highlightsScroll: { paddingHorizontal: CONTAINER_PADDING, paddingBottom: 5 },
  highlightItem: { alignItems: 'center', marginRight: 18 },
  highlightCircle: { width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  highlightCircleBorder: { 
    width: 68, 
    height: 68, 
    borderRadius: 34, 
    borderWidth: 2, 
    borderColor: VROOM_COLORS.accent, // Rouge Vroom
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8, 
    padding: 3,
  },
  highlightNew: { backgroundColor: VROOM_COLORS.fieldBg, borderWidth: 0 },
  highlightImage: { width: '100%', height: '100%', borderRadius: 30, backgroundColor: '#E5E5EA' },
  highlightLabel: { fontSize: 12, color: '#48484A', fontWeight: '500' },

  // Garage Header
  garageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: CONTAINER_PADDING, marginBottom: 15 },
  sectionTitleLarge: { fontSize: 20, fontWeight: '800', color: VROOM_COLORS.dark },
  vehicleCount: { fontSize: 14, color: VROOM_COLORS.muted },
  
  // Garage Grid
  garageGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: CONTAINER_PADDING, justifyContent: 'space-between' },
  carCard: { width: CARD_WIDTH, height: 140, borderRadius: 16, overflow: 'hidden', marginBottom: CARD_MARGIN },
  carImageContainer: { width: '100%', height: '100%', backgroundColor: VROOM_COLORS.fieldBg },
  carImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageLoader: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  gradientOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
  carName: { position: 'absolute', bottom: 14, left: 14, right: 14, color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // --- Styles pour le Menu Hamburger (Modal) ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-start', alignItems: 'flex-end' },
  menuPopup: { 
    marginTop: Platform.OS === 'ios' ? 70 : 50, // Positionné sous le header
    marginRight: CONTAINER_PADDING, 
    width: 200, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuHeader: { fontSize: 16, fontWeight: 'bold', color: VROOM_COLORS.dark, marginBottom: 10, paddingLeft: 5 },
  menuDivider: { height: 1, backgroundColor: 'rgba(20, 1, 2, 0.08)', marginBottom: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingLeft: 5 },
  menuItemTextLogout: { color: VROOM_COLORS.accent, fontSize: 14, fontWeight: 'bold', marginLeft: 10 },
});