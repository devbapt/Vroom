# 🏎️ Vroom

Application mobile communautaire pour les passionnés d'automobile — fil d'actualité immersif, garage virtuel, messagerie et événements track/car-show.

---

## Sommaire

1. [Contexte et vision produit](#1-contexte-et-vision-produit)
2. [Stack technique et justification des choix](#2-stack-technique-et-justification-des-choix)
3. [Architecture du projet](#3-architecture-du-projet)
4. [Configuration et mise en route](#4-configuration-et-mise-en-route)
5. [Fonctionnalités implémentées](#5-fonctionnalités-implémentées)
6. [Utilisation de l'IA dans le développement](#6-utilisation-de-lia-dans-le-développement)

---

## 1. Contexte et vision produit

Vroom est pensé comme un réseau social verticalisé sur l'automobile, à mi-chemin entre Instagram (feed visuel, stories, commentaires) et une application de gestion de flotte personnelle. L'objectif était de livrer une expérience utilisateur proche des standards natifs iOS, tout en conservant un codebase unique pour iOS et Android.

---

## 2. Stack technique et justification des choix

### React Native + Expo (Managed Workflow)

Le choix de React Native s'est imposé pour cibler iOS et Android à partir d'un seul codebase, sans maintenir deux projets distincts en Swift et Kotlin. Expo Managed Workflow a été préféré à bare React Native pour plusieurs raisons concrètes :

- **Itération rapide** : Expo Go permet de tester sur device physique sans passer par Xcode ou Android Studio à chaque rebuild.
- **APIs natives pré-packagées** : `expo-image-picker`, `expo-blur`, `expo-image`, `expo-splash-screen` évitent d'écrire du code natif ou de configurer des dépendances Cocoapods manuellement. Tout ce qui nécessiterait `pod install` en bare devient une simple dépendance JS.
- **Contrainte acceptée** : on reste dans le périmètre de ce qu'Expo supporte nativement. Pour ce projet, cette limite n'a jamais été atteinte.

TypeScript a été adopté dès le départ pour disposer d'un typage fort sur les entités métier (posts, profils, véhicules, HUD de session), ce qui s'est avéré particulièrement utile au fur et à mesure que la complexité des types de données augmentait.

### Supabase plutôt qu'une base locale ou Firebase

Trois options étaient sur la table au moment du choix :

| Option | Avantages | Raisons d'écartement |
|---|---|---|
| SQLite local (`expo-sqlite`) | Zéro config serveur, fonctionne hors-ligne | Pas de synchronisation entre appareils, pas d'authentification, pas de stockage fichiers |
| Firebase (Firestore) | Bien intégré à l'écosystème React Native, temps réel natif | NoSQL : les requêtes relationnelles (followers → profils → posts) auraient nécessité plusieurs aller-retours ou une dénormalisation importante du schéma |
| **Supabase** | PostgreSQL, RLS, Auth, Storage, API auto-générée | — |

**Supabase a été retenu pour trois raisons déterminantes :**

1. **PostgreSQL** : le modèle de données est intrinsèquement relationnel — un post appartient à un utilisateur, a des likes et des commentaires, eux-mêmes rattachés à des profils. Les JOINs en une seule requête (`posts.select('*, profiles!user_id(...)')`) évitent le problème N+1 qui aurait été inévitable avec Firestore, où chaque document de post aurait nécessité autant de lectures supplémentaires que de profils à récupérer.

2. **Row-Level Security (RLS)** : les politiques de sécurité sont définies directement en SQL au niveau de la base. Chaque table expose ses propres règles (`un utilisateur ne peut supprimer que ses propres messages`, `le garage est visible par tous en lecture`). Cela permet d'utiliser l'API directement depuis le client mobile sans exposer de surface d'attaque, et sans écrire de backend intermédiaire pour valider les autorisations.

3. **Storage intégré** : les buckets Supabase (`avatars`, `posts`, `garage`, `stories`) obéissent aux mêmes règles RLS que les tables. Uploader une image et en stocker l'URL dans la base se fait dans le même contexte de sécurité, sans solution de stockage externe séparée (S3, Cloudinary, etc.).

L'absence de backend custom est un choix délibéré : pour un prototype à cette échelle, écrire une API REST ou GraphQL aurait représenté un effort disproportionné sans apport fonctionnel réel. Supabase remplace le backend pour tous les cas d'usage couverts.

### React Navigation v6 (Stack + Bottom Tabs)

Expo Router (basé sur la structure de fichiers) était une alternative. Il a été écarté car il impose une organisation de dossiers contraignante et complique la gestion de navigateurs imbriqués (tab → stack → modal). React Navigation donne un contrôle total sur la hiérarchie de navigation, notamment pour différencier les transitions selon le contexte : `ModalSlideFromBottomIOS` pour les écrans de création (CreatePost, AddVehicle, Settings), `forHorizontalIOS` pour les navigations classiques.

### Gestion d'état : Context API sans Redux

Redux aurait été surdimensionné. L'état global se limite à : profil utilisateur, langue, liste des posts supprimés (pour synchroniser le feed et le profil sans rechargement complet), et quelques états de session. Un `AppContext` unique couvre ces besoins sans la verbosité des reducers et des actions Redux.

---

## 3. Architecture du projet

```
Vroom/
├── assets/                     # SVG (logo, typo), PNG
├── components/
│   ├── cine/                   # Composants du feed (CineDrivePost, HomeHeader, StoriesBar…)
│   └── ui/                     # CustomTabBar
├── context/
│   └── AppContext.tsx           # État global (user, langue, deletedPostIds…)
├── hooks/
│   └── useMessages.ts          # Logique de messagerie
├── navigation/
│   ├── AppNavigator.js         # Root : Auth vs MainApp + thème dark NavigationContainer
│   ├── MainNavigator.js        # Bottom tabs (5 onglets)
│   ├── HomeStackNavigator.tsx
│   ├── ProfileStackNavigator.js
│   ├── MessagesStackNavigator.tsx
│   └── SearchStackNavigator.js
├── screens/                    # Un fichier par écran
├── i18n.ts                     # Traductions FR/EN (post, garage, profile, settings)
├── supabaseClient.js           # Initialisation du client Supabase
├── App.js                      # Point d'entrée : SafeAreaProvider + AppProvider + AppNavigator
└── app.json                    # Config Expo (splash, icône, orientations)
```

**Décisions d'architecture notables :**

- **Séparation navigation / écrans** : chaque stack est son propre fichier. Cela permet de configurer finement les `screenOptions` (interpolateur de transition, `cardStyle`, `gestureEnabled`) sans polluer les composants d'écran, et de raisonner indépendamment sur chaque flux de navigation.

- **Feed "dual-source"** : le HomeScreen agrège les posts officiels Vroom et les posts de l'utilisateur connecté en deux requêtes parallèles, déduplique par ID, et trie par date. Cette approche sans table de "following" permet un démarrage immédiat du feed même pour un nouvel utilisateur, sans dépendre d'un réseau social préexistant.

- **`useFocusEffect` pour le feed** : contrairement à `useEffect([])`, `useFocusEffect` relance le fetch à chaque retour sur l'écran (par exemple après une publication). C'est la solution la plus simple pour maintenir la fraîcheur du feed sans WebSocket ni polling.

---

## 4. Configuration et mise en route

### Prérequis

- Node.js ≥ 18
- Un compte Supabase (gratuit sur [supabase.com](https://supabase.com))
- Expo Go sur iOS ou Android pour tester sur device physique

### Installation des dépendances

```bash
git clone <repo>
cd Vroom
npm install
```

### Configuration Supabase (étape obligatoire, non automatique)

Contrairement à un projet avec base locale, **l'application ne fonctionnera pas** sans les clés Supabase. Voici les étapes :

**1. Récupérer les clés du projet**

Dans le dashboard Supabase → Settings → API :
- `Project URL`
- `anon public key`

Les renseigner dans `supabaseClient.js` :

```js
const supabaseUrl  = 'https://VOTRE_PROJECT_ID.supabase.co';
const supabaseAnonKey = 'VOTRE_ANON_KEY';
```

**2. Créer le schéma de base de données**

Les tables suivantes doivent être créées avec RLS activé :

| Table | Rôle |
|---|---|
| `profiles` | Profils utilisateurs (username, avatar_url, bio, followers_count) |
| `posts` | Publications (type, brand, model, image_urls, hud_data jsonb) |
| `post_likes` | Relation user ↔ post pour les likes |
| `post_comments` | Commentaires avec support de réponses (parent_id) |
| `comment_likes` / `comment_saves` | Interactions sur commentaires |
| `saved_posts` | Posts sauvegardés |
| `followers` | Relation follower ↔ following |
| `garage_vehicles` | Véhicules du garage (brand, model, year + 11 colonnes de specs) |
| `stories` | Stories 24h |
| `conversations` / `participants` / `messages` | Messagerie |
| `groups` / `group_members` / `group_messages` / `group_join_requests` | Groupes |

Exemples de politiques RLS configurées :
- `profiles` : lecture publique, modification uniquement par le propriétaire (`auth.uid() = id`)
- `posts` : lecture publique, insertion/suppression uniquement par le propriétaire
- `garage_vehicles` : lecture publique, écriture par le propriétaire
- `messages` : lecture réservée aux participants de la conversation

**3. Créer les buckets Storage**

Dans Supabase → Storage, créer 4 buckets :
- `avatars` (public) — photos de profil
- `posts` (public) — images des publications
- `garage` (public) — photos des véhicules
- `stories` (privé) — médias des stories

**4. Lancer l'application**

```bash
npx expo start
```

Scanner le QR code avec Expo Go (iOS/Android), ou appuyer sur `i`/`a` pour ouvrir un simulateur.

---

## 5. Fonctionnalités implémentées

### Feed immersif
Feed plein écran paginé verticalement (style Reels), avec 6 types de posts : `track`, `road_trip`, `meet`, `daily`, `build`, `spotted`. Chaque type embarque un HUD de données de session adapté (temps au tour, distance parcourue, puissance moteur…). Le feed se rafraîchit automatiquement à chaque retour sur l'écran et supporte le pull-to-refresh.

### Authentification complète
Connexion, inscription, mot de passe oublié, reset par lien email (flow `PASSWORD_RECOVERY` Supabase), déconnexion. La navigation est entièrement protégée : un utilisateur non connecté est toujours renvoyé vers le stack Auth.

### Profil & Garage
Profil utilisateur avec upload d'avatar (base64 → Uint8Array → Supabase Storage), grille de publications, garage de véhicules avec fiche détaillée (11 champs techniques). Les compteurs d'abonnés sont persistés en base à chaque follow/unfollow — pas seulement en état local.

### Création de contenu
- **Publication** : sélection multi-photos (jusqu'à 6, qualité originale sans recompression), choix du type, remplissage du HUD correspondant, upload et insertion en base.
- **Ajout garage** : formulaire complet avec upload photo 16:9.
- Les deux formulaires sont entièrement traduits selon la langue choisie dans les paramètres.

### Messagerie
Conversations 1-to-1 avec bulles différenciées, double-tap pour liker un message, suppression (soft delete), statut de lecture (double coche), partage de position/carte/photo.

### Internationalisation
Système de traductions maison (`i18n.ts`) couvrant 4 namespaces : `profile`, `settings`, `post`, `garage`. La langue est persistée dans le contexte global et modifiable depuis les Paramètres.

---

## 6. Utilisation de l'IA dans le développement

**Claude Code** (assistant IA d'Anthropic, via interface IDE) a été utilisé tout au long du projet comme outil de développement. Voici une description honnête de son rôle.

### Ce que l'IA a pris en charge

- **Débogage de comportements non évidents** : identification de bugs qui auraient été difficiles à isoler seul. Par exemple : `KeyboardAvoidingView` n'avait d'effet que sur la barre de saisie des commentaires mais pas sur la feuille entière (parce que la feuille est en `position: absolute` et que le KAV doit l'envelopper, pas être à l'intérieur). Autre exemple : `justifyContent: 'flex-end'` dans un `FlatList` inversé pousse les messages vers le haut visuel — contre-intuitif car la transformation s'applique dans l'espace non-inversé du conteneur de contenu.
- **Implémentation de features répétitives** : les transitions de navigation (application de `CardStyleInterpolators` et `TransitionPresets` sur 5 stacks), l'internationalisation de 4 écrans (ajout des namespaces, remplacement de tous les strings), l'extension du header avec blur natif depuis le bord de l'écran.
- **Interactions Supabase** : écriture des migrations SQL (ajout des 11 colonnes manquantes sur `garage_vehicles` qui causaient silencieusement l'échec de l'insertion), vérification du schéma et des politiques RLS via l'outillage MCP.

### Ce que l'IA n'a pas fait

- **Concevoir l'architecture** : la structure en stacks imbriqués, le choix de Supabase vs alternatives, le modèle de données, le design du feed "dual-source" — ces décisions ont été prises indépendamment de l'IA.
- **Définir le design** : la charte graphique (Coffee Bean `#140102`, Racing Red `#E50914`), le layout du feed plein écran, le système de HUD par type de post — tout cela a été spécifié dans les instructions données à l'IA, pas généré par elle.
- **Valider les résultats** : chaque modification proposée a été relue, testée sur device physique, et ajustée si le comportement observé ne correspondait pas à l'attendu. L'IA s'est trompée à plusieurs reprises dans son diagnostic initial — notamment sur la gestion des touches Android avec `elevation` sur les bottom sheets, ou sur le sens de `justifyContent` avec un `FlatList` inversé — et a nécessité des itérations avec des informations complémentaires (screenshot, message d'erreur exact, comportement observé sur device).

### Regard critique sur l'outil

L'IA est particulièrement efficace sur des tâches délimitées avec un contrat d'interface clair : "ce composant doit accepter ces props et produire ce rendu". Elle est moins fiable sur des diagnostics qui nécessitent une connaissance du comportement runtime (animations, gestion du clavier, priorité des événements tactiles sur Android). Dans ces cas, le diagnostic initial était parfois incorrect et nécessitait plusieurs échanges pour converger vers la vraie cause.

En pratique, l'IA a accéléré significativement les parties les plus mécaniques du travail (internationalisation, déduplication de configuration de navigation, réécriture de styles), ce qui a libéré du temps pour se concentrer sur les décisions de design et d'architecture. Elle a aussi permis de débloquer des bugs qui auraient demandé plusieurs heures de lecture de documentation ou de stacktraces — à condition de savoir poser les bonnes questions et de ne pas prendre les premières réponses pour argent comptant.
