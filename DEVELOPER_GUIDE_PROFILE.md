# Guide Développeur - Architecture Profil

## 🏗️ Architecture de la Page Profil

### Structure des Fichiers

```
screens/
├── ProfileScreen.tsx          # Screen principal avec vue profil et détails véhicule
├── EditProfileScreen.tsx      # Écran d'édition du profil et des tags
└── SettingsScreen.tsx         # Écran des paramètres avec langue

context/
├── AppContext.tsx             # Global state avec language et AppProvider
├── AppContext.ts              # Hook useAppContext
└── index.ts                   # Exports

i18n.ts                        # Système de traduction (FR/EN)
```

---

## 🔧 Système Multilingue (i18n)

### Fichier: `i18n.ts`

```typescript
// Types
export type Language = 'fr' | 'en';

// Structure de traduction
export interface Translations {
  profile: { ... }
  settings: { ... }
}

// Traductions
const FR: Translations = { ... }
const EN: Translations = { ... }

// Utilisation
const t = getTranslation(language);
console.log(t.profile.followers); // "Abonnés"
```

### Comment Ajouter une Traduction?

1. **Ajouter la clé dans l'interface**:
```typescript
export interface Translations {
  profile: {
    myNewKey: string; // ← Ajouter ici
  }
}
```

2. **Ajouter la valeur dans FR et EN**:
```typescript
const FR: Translations = {
  profile: {
    myNewKey: "Ma clé en français",
  }
}

const EN: Translations = {
  profile: {
    myNewKey: "My key in English",
  }
}
```

3. **Utiliser dans le composant**:
```typescript
const { language } = useAppContext();
const t = getTranslation(language);

<Text>{t.profile.myNewKey}</Text>
```

---

## 🎯 AppContext - Gestion d'État

### Fichier: `context/AppContext.tsx`

```typescript
export interface AppContextType {
  // ... autres propriétés
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
```

### Utilisation:

```typescript
// Dans un composant
const { language, setLanguage } = useAppContext();

// Changer la langue
setLanguage('en');

// Utiliser la langue
const t = getTranslation(language);
```

---

## 📱 ProfileScreen - Structure Principale

### Composants Principaux

#### 1. **ProfileGridView**
Affiche la grille de profil avec:
- Header avec username
- Avatar et statistiques
- Biographie et tags
- Boutons d'action
- Cartes d'activité
- Highlights
- Onglets (Garage, Publications, Itinéraires)
- Galerie de véhicules

#### 2. **CarDetailView**
Affiche les détails d'un véhicule:
- Slider d'images horizontal
- Compteur d'images
- Titre et sous-titre
- Grille de caractéristiques (2×2)
- Boutons d'action (Favoris, Repost, Options)
- Section historique

### Props et État

```typescript
interface ProfileGridViewProps {
  insets: ReturnType<typeof useSafeAreaInsets>;
  activeTab: string;
  onTabChange: (tab: 'garage' | 'publications' | 'itineraires') => void;
  onCarPress: (id: string) => void;
  onOpenMenu: () => void;
  onNavigate: (screen: string) => void;
  onShareProfile: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  highlights: any[];
  onAddHighlight: (name: string, image: string) => void;
  onDeleteHighlight: (id: string) => void;
  language: Language;
}
```

---

## 🚗 Données de Véhicules

### Interface GarageCar

```typescript
interface GarageCar {
  id: string;
  name: string;
  year: string;
  body: string;
  power: string;
  image: string;
  images?: string[];  // Pour le slider
  specs: { 
    km: string; 
    motor: string; 
    color: string; 
    gearbox: string; 
  };
  history: string;
}
```

### Ajouter une Voiture

```typescript
const GARAGE_CARS: GarageCar[] = [
  {
    id: '4',
    name: 'Lamborghini Huracán',
    year: '2020',
    body: 'Coupé',
    power: '640 ch',
    image: 'https://images.unsplash.com/...',
    images: [
      'https://images.unsplash.com/photo-...',
      'https://images.unsplash.com/photo-...',
    ],
    specs: { 
      km: '5 000', 
      motor: 'V10', 
      color: 'Giallo', 
      gearbox: 'Automatique' 
    },
    history: 'Acquise en 2022...',
  },
];
```

---

## 🏷️ Système de Tags

### Interface Tag

```typescript
interface Tag {
  id: string;
  label: string;
  type: 'brand' | 'place' | 'location';
}
```

### Styles de Tag

| Type | Style | Exemple |
|------|-------|---------|
| `brand` | Fond rouge (#D91D2F) | Porsche, Ferrari |
| `place` | Bordure grise | Circuit SPA |
| `location` | Bordure grise | Lyon FR |

---

## 📤 Highlights Management

### État dans ProfileScreen

```typescript
const [highlights, setHighlights] = useState(HIGHLIGHTS);

const addHighlight = (name: string, image: string) => {
  const newHighlight = {
    id: String(Date.now()),
    name,
    image,
  };
  setHighlights([...highlights, newHighlight]);
};

const deleteHighlight = (id: string) => {
  setHighlights(highlights.filter(h => h.id !== id));
};
```

### Utilisation

```typescript
// Ajouter
onAddHighlight('Car Shows', 'https://...');

// Supprimer (long-press)
onDeleteHighlight('1');
```

---

## 🌈 Système de Couleurs

### Constants Couleur

```typescript
const C = {
  bg: '#FFFFFF',           // Blanc
  dark: '#121212',         // Noir foncé
  accent: '#D91D2F',       // Rouge Vroom
  muted: '#8E8E93',        // Gris
  fieldBg: 'rgba(18,18,18,0.05)', // Fond léger
  border: '#EEEEEE',       // Bordure légère
};
```

---

## 📏 Spacings et Dimensions

### Constants

```typescript
const PAD = 16;              // Padding principal
const CARD_GAP = 8;          // Gap entre cartes
const CARD_WIDTH = (width - PAD * 2 - CARD_GAP) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.3;
```

### Ajustement des Espacements

Pour réduire les espacements:
```typescript
// Avant
gap: 12,

// Après
gap: 8,
```

---

## 🔤 Tailles de Police

### Hiérarchie des Tailles

| Élément | Taille | Weight |
|---------|--------|--------|
| Header | 14px | 700 |
| Title Large | 20px | 800 |
| Title Medium | 15px | 700 |
| Body | 12px | 400 |
| Small | 10px | 600 |
| Muted | 11px | 400 |

### Modifier les Tailles

```typescript
// Textes du header
headerTitle: {
  fontSize: 14,      // Anciennement 15
  fontWeight: '700',
}

// Stats
statValue: {
  fontSize: 15,      // Anciennement 18
}
```

---

## 🎬 Animations

### RefreshControl

```typescript
<ScrollView
  refreshControl={
    <RefreshControl 
      refreshing={refreshing} 
      onRefresh={onRefresh}
      tintColor={C.accent}
    />
  }
/>
```

### Animated Bottom Sheet

```typescript
const [slideAnim] = useState(new Animated.Value(600));

const openMenu = () => {
  Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
};

const closeMenu = () => {
  Animated.timing(slideAnim, {
    toValue: 600,
    duration: 280,
    useNativeDriver: true,
  }).start(() => setMenuVisible(false));
};
```

---

## 📸 Slider d'Images

### Implémentation

```typescript
<ScrollView
  horizontal
  pagingEnabled
  showsHorizontalScrollIndicator={false}
  scrollEventThrottle={16}
  onMomentumScrollEnd={(event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentImageIndex(index);
  }}
>
  {images.map((img, idx) => (
    <View key={idx} style={{ width, height: 300 }}>
      <ExpoImage source={img} style={StyleSheet.absoluteFillObject} />
    </View>
  ))}
</ScrollView>
```

### Compteur

```typescript
<Text style={styles.imageCounter}>
  {currentImageIndex + 1} / {images.length}
</Text>
```

---

## 🧪 Tests

### Éléments à Tester

- [ ] Pull-to-refresh fonctionne
- [ ] Changement de langue fonctionne
- [ ] Slider de photos fonctionne
- [ ] Ajout/suppression highlights
- [ ] Modification de profil sauvegarde
- [ ] Tags s'ajoutent et se suppriment
- [ ] Tous les boutons naviguent correctement
- [ ] Partage fonctionne
- [ ] Menu hamburger apparaît/disparaît

---

## 🚀 Optimisations Futures

1. **Persistance**
   - Sauvegarder la langue dans AsyncStorage
   - Sauvegarder les modifications de profil dans Supabase

2. **Performance**
   - Memoize les composants enfants
   - Lazy load les images
   - Virtual list pour les grandes collections

3. **Fonctionnalités**
   - Mode sombre
   - Animations de transition
   - Filtrage des véhicules
   - Recherche

4. **UX**
   - Skeleton loaders pendant le chargement
   - Animations de suppression
   - Confirmations avant suppression
   - Undo pour les actions

---

## 📚 Références

- [React Native Documentation](https://reactnative.dev)
- [Expo Image](https://docs.expo.dev/versions/latest/sdk/image/)
- [React Navigation](https://reactnavigation.org)
- [useSafeAreaInsets](https://reactnativedev.expo.io/docs/safe-area-context/)

---

**Version**: 1.0.0
**Auteur**: Vroom Development Team
**Date**: Avril 2026
