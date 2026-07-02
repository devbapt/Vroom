# Vroom — Architecture technique

> Ce document décrit l'architecture réelle du code. Pour la présentation du projet, la justification des choix techniques et le guide de test, voir [README.md](./README.md).

---

## Vue d'ensemble

```
Vroom/
├── assets/                     # SVG (logo, typo), PNG
├── components/
│   ├── cine/                   # Composants du feed
│   │   ├── CineDrivePost.tsx    - Carte de post plein écran (feed principal)
│   │   ├── HUDStrip.tsx         - Bandeau de données de session par type de post
│   │   ├── HomeHeader.tsx       - Header du feed (logo, blur étendu au notch)
│   │   ├── StoriesBar.tsx       - Bandeau de stories
│   │   ├── ActionStack.tsx      - Actions latérales (like, commenter, partager)
│   │   ├── ChapterCard.tsx      - Carte de chapitre/highlight
│   │   └── LiveStrip.tsx        - Bandeau live
│   └── ui/
│       ├── CustomTabBar.tsx     - Bottom tab bar custom
│       └── VerifiedBadge.tsx    - Badge certifié/en attente (2 variantes, 2 tailles)
├── context/
│   ├── AppContext.tsx           - État global (user, langue, deletedPostIds, session)
│   └── index.ts
├── hooks/
│   └── useMessages.ts           - Logique de messagerie (fetch, envoi, statut lu)
├── navigation/
│   ├── AppNavigator.js          - Root : Auth vs MainApp + thème dark sur NavigationContainer
│   ├── MainNavigator.js         - Bottom tabs (5 onglets)
│   ├── HomeStackNavigator.tsx   - Feed + PostDetail
│   ├── ProfileStackNavigator.js - Profil, Garage, Certification, VehiclePlateSearch, Settings...
│   ├── MessagesStackNavigator.tsx - Conversations 1-to-1 et groupes
│   └── SearchStackNavigator.js  - Recherche utilisateurs/posts
├── screens/                     # Un fichier par écran (29 écrans)
│   ├── HomeScreen.tsx            - Feed plein écran paginé (dual-source)
│   ├── ProfileScreen.tsx / UserProfileScreen.tsx
│   ├── GarageScreen.tsx / AddVehicleScreen.tsx
│   ├── CertificationScreen.tsx   - Flow de certification de propriété véhicule
│   ├── VehiclePlateSearchScreen.tsx - Recherche par plaque → pré-remplissage garage
│   ├── CreatePostScreen.tsx / CreateStoryScreen.tsx / CreateGroupScreen.tsx
│   ├── MessagesScreen.tsx / ChatScreen.tsx
│   ├── SearchScreen.tsx / MapScreen.tsx
│   ├── LoginScreen.tsx / SignupScreen.tsx / ForgotPasswordScreen.tsx / ChangePasswordScreen.tsx
│   ├── SettingsScreen.tsx / EditProfileScreen.tsx / ActivityScreen.tsx / SavedScreen.tsx
│   ├── PostDetailScreen.tsx / PostDetailModal.tsx / CommentsSheet.tsx / StoryViewer.tsx
│   ├── AboutScreen.tsx / LegalScreen.tsx / WelcomeScreen.tsx
│   └── ...
├── services/
│   └── ImageService.ts          # Sélection et compression d'images
├── i18n.ts                      # Traductions FR/EN (namespaces: profile, settings, post, garage)
├── supabaseClient.js             # Initialisation du client Supabase
├── App.js                        # Point d'entrée : SafeAreaProvider + AppProvider + AppNavigator
└── app.json                      # Config Expo (splash, icône, orientations)
```

---

## Component Hierarchy

```
App
├─ SafeAreaProvider
├─ AppProvider (Context)
└─ AppNavigator (thème dark)
   ├─ Auth Stack (Login, Signup, ForgotPassword)
   └─ MainNavigator (Bottom Tabs, 5 onglets)
      ├─ HomeStackNavigator
      │  └─ HomeScreen → PostDetailScreen, CommentsSheet
      ├─ SearchStackNavigator
      │  └─ SearchScreen
      ├─ MapStackNavigator
      │  └─ MapScreen
      ├─ MessagesStackNavigator
      │  └─ MessagesScreen → ChatScreen, CreateGroupScreen
      └─ ProfileStackNavigator
         ├─ ProfileScreen → EditProfileScreen, SettingsScreen, ActivityScreen, SavedScreen
         ├─ GarageScreen → AddVehicleScreen → VehiclePlateSearchScreen
         │                                  → CertificationScreen
         └─ CreateStoryScreen (Modal)
```

---

## Model Layer (Context + Services)

### AppContext (`context/AppContext.tsx`)
État global partagé entre écrans, pour éviter les rechargements et resynchroniser feed ↔ profil sans prop drilling :
- **User** : profil connecté (id, username, avatar, followers/following, isPrivate)
- **Langue active** : FR/EN, persistée, consommée par `i18n.ts`
- **deletedPostIds** : synchronisation de la suppression d'un post entre le feed et le profil sans refetch complet
- **Session** : état d'authentification Supabase

### ImageService (`services/ImageService.ts`)
```typescript
pickImage(aspect, quality)      // Sélection depuis la galerie
compressImage(uri, quality)     // Compression avant upload
uploadImage(uri, bucket)        // Upload vers Supabase Storage
```

### useMessages (`hooks/useMessages.ts`)
Fetch des conversations, envoi de message, double-tap like, soft delete, statut de lecture (double coche).

---

## Controller Layer (Navigation)

Chaque stack est son propre fichier. Les `screenOptions` (interpolateurs de transition, `cardStyle`, `gestureEnabled`) sont configurés au niveau du navigateur, pas dans les composants d'écran :
- `CardStyleInterpolators.forHorizontalIOS` pour les navigations classiques
- `ModalSlideFromBottomIOS` pour les écrans de création (CreatePost, CreateStory, AddVehicle, CreateGroup)

---

## Backend (Supabase)

- **PostgreSQL relationnel** : JOINs en une requête (`posts.select('*, profiles!user_id(...)')`) pour éviter le N+1.
- **Row-Level Security** : politiques définies en SQL au niveau des tables, pas de couche d'autorisation applicative séparée.
- **Storage** : buckets `avatars`, `posts`, `garage`, `stories`, `map_points` (public, RLS), plus un bucket privé `preuves_propriete` pour les preuves de certification (URL signée, validité 10 ans).
- **Edge Functions** : `fetch-vehicle-info` — appelle l'API SIV d'immatriculation côté serveur pour ne pas exposer la clé API tierce dans le client mobile, et centralise la normalisation de la plaque. Tourne en mode démo (données fictives) tant qu'aucune clé d'API SIV payante n'est configurée.
- **Tables notables** : `garage_vehicles` (avec `plaque_hash` et `vin_hash`, deux colonnes uniques en SHA-256 empêchant qu'un même véhicule soit ajouté par deux comptes), `demandes_certification` (statut `en_attente` → validation manuelle côté équipe), `map_points` (`type` `event`/`route`, RLS : lecture publique, écriture/suppression restreintes à `auth.uid() = user_id`).

---

## Décisions d'architecture notables

- **Feed "dual-source"** : `HomeScreen` agrège les posts officiels Vroom et les posts de l'utilisateur connecté via deux requêtes parallèles, déduplique par ID, trie par date — permet un feed non vide dès la première connexion.
- **`useFocusEffect` + pull-to-refresh** sur le feed : relance le fetch à chaque retour sur l'écran, sans WebSocket ni polling.
- **Certification par photo-preuve** : upload dans un bucket privé, création d'une demande en base dissociée de la validation manuelle.
- **Recherche par plaque** : formatage SIV en temps réel (`AB-123-CD`), skeleton loader pendant l'appel Edge Function, résultat pré-remplissant le formulaire `AddVehicle` ou saisie manuelle en fallback.
- **Vérification VIN à l'ajout** : champ VIN optionnel dans `AddVehicleScreen`, décodé via l'API publique gratuite NHTSA vPIC (marque/modèle/année) pour signaler une incohérence avant enregistrement. Le VIN est haché (SHA-256) et stocké dans `vin_hash`, avec la même contrainte d'unicité que `plaque_hash` — un véhicule déjà enregistré (par plaque ou VIN) ne peut pas être ajouté par un second compte.

---

## Design system

Thème dark global (Coffee Bean `#140102`, Racing Red `#E50914`), typographie Poppins (Google Fonts), gradients et blur natifs (`expo-blur`), safe areas (notch/Dynamic Island).

---

## État des lieux / prochaines briques

### Non commencé
- [ ] Tests automatisés (unitaires/intégration) — actuellement absents du projet
- [ ] Notifications push
- [ ] Pagination infinie sur le feed (actuellement chargement complet dual-source)
- [ ] Accessibilité (a11y)

---

## Standards de code

- TypeScript pour les écrans et services (migration progressive, quelques fichiers `.js` legacy en navigation)
- Un écran = un fichier dans `screens/`
- Un stack de navigation = un fichier dans `navigation/`
- Commits : `feat:`, `fix:`, `refactor:`, `docs:`
