# Vroom

Application mobile communautaire pour les passionnés d'automobile — fil d'actualité immersif, garage virtuel, messagerie et système de certification.

---

## Sommaire

1. [Présentation du projet](#1-présentation-du-projet)
2. [Stack technique et justification des choix](#2-stack-technique-et-justification-des-choix)
3. [Architecture du projet](#3-architecture-du-projet)
4. [Tester l'application — guide complet](#4-tester-lapplication--guide-complet)
5. [Fonctionnalités implémentées](#5-fonctionnalités-implémentées)
6. [Utilisation de l'IA dans le développement](#6-utilisation-de-lia-dans-le-développement)

---

## 1. Présentation du projet

Vroom est un réseau social mobile verticalisé sur l'automobile, à mi-chemin entre Instagram (feed visuel plein écran, stories, commentaires, messagerie) et une application de gestion de flotte personnelle. L'utilisateur peut partager ses sorties (circuit, road trip, rencontre, quotidien, build, spotted), gérer son garage avec les fiches techniques de ses véhicules, et interagir avec la communauté.

L'objectif était de livrer une expérience utilisateur proche des standards natifs iOS/Android tout en conservant un seul codebase.

---

## 2. Stack technique et justification des choix

### React Native + Expo (Managed Workflow)

Le choix de React Native s'est imposé pour cibler iOS et Android à partir d'un seul codebase. Expo Managed Workflow a été préféré à bare React Native pour :

- **Itération rapide** : Expo Go permet de tester sur device physique sans passer par Xcode ou Android Studio à chaque rebuild.
- **APIs natives pré-packagées** : `expo-image-picker`, `expo-blur`, `expo-image`, `expo-splash-screen` évitent d'écrire du code natif ou de configurer des dépendances Cocoapods manuellement.
- **Contrainte acceptée** : on reste dans le périmètre de ce qu'Expo supporte nativement. Pour ce projet, cette limite n'a jamais été atteinte.

TypeScript a été adopté dès le départ pour un typage fort sur les entités métier (posts, profils, véhicules, données HUD de session).

### Supabase plutôt qu'une base locale ou Firebase

| Option | Avantages | Raisons d'écartement |
|---|---|---|
| SQLite local (`expo-sqlite`) | Zéro config serveur, fonctionne hors-ligne | Pas de synchronisation entre appareils, pas d'authentification, pas de stockage fichiers |
| Firebase (Firestore) | Bien intégré à l'écosystème React Native, temps réel natif | NoSQL : les requêtes relationnelles auraient nécessité plusieurs aller-retours ou une dénormalisation importante |
| **Supabase** | PostgreSQL, RLS, Auth, Storage, API auto-générée | — |

**Trois raisons déterminantes pour Supabase :**

1. **PostgreSQL** : le modèle est intrinsèquement relationnel. Les JOINs en une seule requête (`posts.select('*, profiles!user_id(...)')`) évitent le problème N+1 qui aurait été inévitable avec Firestore.
2. **Row-Level Security (RLS)** : les politiques de sécurité sont définies en SQL directement au niveau de la base. Pas de backend intermédiaire pour valider les autorisations.
3. **Storage intégré** : les buckets (`avatars`, `posts`, `garage`, `stories`) obéissent aux mêmes règles RLS que les tables. Pas de service de stockage externe séparé.

### React Navigation v7 (Stack + Bottom Tabs)

Expo Router (basé sur la structure de fichiers) a été écarté car il complique la gestion de navigateurs imbriqués (tab → stack → modal). React Navigation donne un contrôle total sur les transitions : `ModalSlideFromBottomIOS` pour les écrans de création, `forHorizontalIOS` pour les navigations classiques.

### Gestion d'état : Context API sans Redux

Redux aurait été surdimensionné. L'état global se limite à : profil utilisateur, langue active, liste des posts supprimés (synchronisation feed ↔ profil sans rechargement), états de session. Un `AppContext` unique couvre ces besoins sans la verbosité de Redux.

---

## 3. Architecture du projet

```
Vroom/
├── assets/                     # SVG (logo, typo), PNG
├── components/
│   ├── cine/                   # Composants du feed (CineDrivePost, HUDStrip, HomeHeader, StoriesBar…)
│   └── ui/                     # Composants réutilisables (CustomTabBar, VerifiedBadge)
├── context/
│   └── AppContext.tsx           # État global (user, langue, deletedPostIds…)
├── hooks/
│   └── useMessages.ts          # Logique de messagerie
├── navigation/
│   ├── AppNavigator.js         # Root : Auth vs MainApp + thème dark
│   ├── MainNavigator.js        # Bottom tabs (5 onglets)
│   ├── HomeStackNavigator.tsx
│   ├── ProfileStackNavigator.js  # Inclut les routes Certification et VehiclePlateSearch
│   ├── MessagesStackNavigator.tsx
│   └── SearchStackNavigator.js
├── screens/                    # Un fichier par écran (31 écrans)
│   ├── CertificationScreen.tsx  # Flow de certification de propriété véhicule
│   ├── VehiclePlateSearchScreen.tsx  # Recherche par plaque → pré-remplissage garage
│   └── ...
├── services/
│   └── ImageService.ts         # Sélection et compression d'images
├── i18n.ts                     # Traductions FR/EN (post, garage, profile, settings)
├── supabaseClient.js           # Initialisation du client Supabase (clés déjà configurées)
├── App.js                      # Point d'entrée : SafeAreaProvider + AppProvider + AppNavigator
└── app.json                    # Config Expo (splash, icône, orientations)
```

**Décisions d'architecture notables :**

- **Séparation navigation / écrans** : chaque stack est son propre fichier. Les `screenOptions` (interpolateurs de transition, `cardStyle`, `gestureEnabled`) sont configurées au niveau du navigateur, pas dans les composants d'écran.
- **Feed "dual-source"** : le HomeScreen agrège les posts officiels Vroom et les posts de l'utilisateur connecté en deux requêtes parallèles, déduplique par ID, et trie par date. Cela permet un démarrage immédiat du feed même pour un nouvel utilisateur.
- **`useFocusEffect` pour le feed** : relance le fetch à chaque retour sur l'écran (ex. après une publication) sans WebSocket ni polling.
- **Edge Function pour la recherche par plaque** : l'appel à l'API SIV (immatriculation française) passe par une Edge Function Supabase (`fetch-vehicle-info`) plutôt que directement depuis le client. Cela évite d'exposer la clé API du service tiers dans le code mobile et permet de centraliser la logique de normalisation de la plaque.
- **Certification par photo-preuve** : les preuves de propriété sont uploadées dans un bucket privé Supabase (`preuves_propriete`) avec génération d'une URL signée valable 10 ans. La demande est créée en table `demandes_certification` avec un statut `en_attente`, dissociant la validation (manuelle, côté équipe) du flux utilisateur.

---

## 4. Tester l'application — guide complet

> Le backend (Supabase) est déjà configuré et opérationnel. Aucune création de compte Supabase ni configuration de base de données n'est nécessaire pour tester. Il suffit d'installer les outils locaux et de lancer l'application.

---

### Prérequis à installer sur la machine

#### 1. Node.js (version 18 ou supérieure)

Télécharger et installer depuis [nodejs.org](https://nodejs.org) — choisir la version **LTS** (Long Term Support).

Vérifier l'installation :
```bash
node --version   # doit afficher v18.x.x ou supérieur
npm --version
```

#### 2. Cloner le projet et installer les dépendances

```bash
git clone <url-du-repo>
cd Vroom
npm install
```

> `npm install` peut prendre 1 à 3 minutes. Ne pas interrompre.

#### 3. Lancer le serveur de développement Expo

```bash
npx expo start
```

Un QR code et un menu texte apparaissent dans le terminal. Laisser ce terminal ouvert pendant toute la durée des tests.

---

### Option A — Test sur device physique (recommandé)

C'est l'option la plus simple et la plus représentative de l'expérience réelle.

#### Sur Android

1. Installer **Expo Go** depuis le Google Play Store sur le téléphone Android.
2. Ouvrir l'application Expo Go.
3. Scanner le **QR code** affiché dans le terminal avec l'appareil photo intégré d'Expo Go (ou via "Scan QR code").
4. L'application se charge automatiquement.

> Le téléphone et la machine doivent être sur le **même réseau Wi-Fi**.

#### Sur iPhone (iOS)

1. Installer **Expo Go** depuis l'App Store.
2. Ouvrir l'application Expo Go.
3. Scanner le **QR code** affiché dans le terminal avec l'appareil photo natif iOS (application Appareil photo, pas besoin d'ouvrir Expo Go d'abord).
4. iOS proposera d'ouvrir le lien dans Expo Go — accepter.
5. L'application se charge automatiquement.

> Le téléphone et la machine doivent être sur le **même réseau Wi-Fi**.

---

### Option B — Test sur simulateur/émulateur (si pas de device physique)

#### Simulateur iOS (Mac uniquement)

Xcode doit être installé (App Store, ~10 Go). Avec le terminal Expo ouvert, appuyer sur la touche **`i`** — Expo lance automatiquement le simulateur iOS et installe l'application.

#### Émulateur Android (Windows, Mac, Linux)

1. Installer **Android Studio** depuis [developer.android.com/studio](https://developer.android.com/studio).
2. Dans Android Studio → Virtual Device Manager, créer un émulateur (ex. Pixel 8, API 34).
3. Lancer l'émulateur.
4. Avec le terminal Expo ouvert, appuyer sur la touche **`a`** — Expo installe et lance l'application sur l'émulateur.

---

### Compte de test

Créer un compte directement depuis l'écran d'inscription de l'application (email + mot de passe). Un email de confirmation n'est pas requis — la connexion est effective immédiatement.

Un compte de démonstration est disponible si besoin :
- **Email** : `demo@vroom.app`
- **Mot de passe** : `Vroom2024!`

---

### Résumé des commandes

| Étape | Commande |
|---|---|
| Installer les dépendances | `npm install` |
| Lancer Expo | `npx expo start` |
| Ouvrir sur iOS Simulator (Mac) | Appuyer sur `i` dans le terminal |
| Ouvrir sur émulateur Android | Appuyer sur `a` dans le terminal |
| Device physique | Scanner le QR code avec Expo Go |

---

### En cas de problème

| Problème | Solution |
|---|---|
| `npm install` échoue | Vérifier que Node.js ≥ 18 est installé (`node --version`) |
| QR code ne charge pas | Vérifier que le téléphone et la machine sont sur le même réseau Wi-Fi |
| "Network response timed out" | Relancer avec `npx expo start --tunnel` (mode tunnel, contourne les restrictions réseau) |
| L'app reste bloquée sur le splash screen | Secouer le device pour ouvrir le menu Expo, puis "Reload" |
| Expo Go demande une mise à jour de la SDK | Accepter — la version cible est SDK 54 |

---

## 5. Fonctionnalités implémentées

### Feed immersif
Feed plein écran paginé verticalement (style Reels), avec 6 types de posts : `track`, `road_trip`, `meet`, `daily`, `build`, `spotted`. Chaque type embarque un HUD de données de session adapté (temps au tour, distance parcourue, puissance moteur…). Pull-to-refresh et rechargement automatique à chaque retour sur l'écran.

### Authentification complète
Connexion, inscription avec validation (username 3-20 chars, email regex, mot de passe 8+ chars avec lettre + chiffre), mot de passe oublié via lien email (flow `PASSWORD_RECOVERY` Supabase), déconnexion. Navigation entièrement protégée.

### Profil & Garage
Upload d'avatar (base64 → Uint8Array → Supabase Storage), grille de publications, compteurs de followers/following persistés en base. Garage de véhicules avec fiches techniques complètes (marque, modèle, année, surnom, puissance, 0-100 km/h, transmission, traction, carburant, couleur, kilométrage, date d'acquisition, statut, notes, photo).

### Création de contenu
- **Publication** : sélection multi-photos (jusqu'à 6), choix du type de post, remplissage du HUD correspondant, upload et insertion en base.
- **Ajout garage** : formulaire complet avec upload photo 16:9.
- Les deux formulaires sont entièrement traduits selon la langue active.

### Messagerie
Conversations 1-to-1 avec bulles différenciées, double-tap pour liker un message, suppression (soft delete), statut de lecture (double coche). Support des groupes de discussion avec gestion des membres et des rôles.

### Certification de propriété véhicule
Flow complet de vérification en 4 étapes : instructions (défi photo — papier avec pseudo + date visible sur le tableau de bord), ouverture caméra native, preview + confirmation, upload de la preuve vers un bucket privé Supabase (`preuves_propriete`) et création d'une demande en table `demandes_certification` (statut `en_attente`). Le composant `VerifiedBadge` affiche l'état de chaque véhicule dans le garage (bouclier vert "Certifié" ou badge orange "En attente"). La navigation vers cet écran se fait depuis la fiche véhicule dans le profil.

### Recherche de véhicule par plaque d'immatriculation
Écran de saisie de la plaque au format SIV (formatage automatique `AB-123-CD` en temps réel) qui appelle une Edge Function Supabase (`fetch-vehicle-info`). Le résultat est affiché sous forme de carte avec une plaque stylisée (bande bleue F + fond blanc), un skeleton loader animé pendant le chargement, et deux choix : confirmer pour pré-remplir automatiquement le formulaire d'ajout de véhicule (marque, modèle, année, plaque), ou saisir manuellement. Le bouton "Ajouter un véhicule" du profil pointe désormais vers cet écran en premier.

### Vérification VIN et anti-doublon
Champ VIN (numéro de châssis) optionnel dans le formulaire d'ajout de véhicule, vérifié via l'API publique et gratuite **NHTSA vPIC** (`vpic.nhtsa.dot.gov`) : la marque/modèle/année décodés sont comparés à la saisie utilisateur pour signaler une incohérence avant l'ajout. La plaque et le VIN sont hachés (SHA-256) et stockés dans des colonnes uniques (`plaque_hash`, `vin_hash`) sur `garage_vehicles` — un même véhicule ne peut donc pas être enregistré par deux comptes Vroom différents. En cas de doublon détecté, l'utilisateur est invité à contacter le support plutôt que de se voir proposer une "revendication" automatique non implémentée.

### Internationalisation
Système de traductions maison (`i18n.ts`) couvrant 4 namespaces : `profile`, `settings`, `post`, `garage`. Langue persistée dans le contexte global, modifiable depuis les Paramètres (FR/EN).

### Design system
Thème dark global (Coffee Bean `#140102`, Racing Red `#E50914`), typographie Poppins (Google Fonts), gradients et effets blur natifs. Compatible notch/Dynamic Island (safe areas). Transitions différenciées selon le contexte de navigation.

---

## 6. Utilisation de l'IA dans le développement

**Claude Code** (assistant IA d'Anthropic, via interface IDE) a été utilisé tout au long du projet comme outil de développement. Voici une description honnête de son rôle.

### Ce que l'IA a pris en charge

- **Débogage de comportements non évidents** : par exemple, `KeyboardAvoidingView` n'avait d'effet que sur la barre de saisie des commentaires mais pas sur la feuille entière — parce que la feuille est en `position: absolute` et que le KAV doit l'envelopper, pas être à l'intérieur. Autre exemple : `justifyContent: 'flex-end'` dans un `FlatList` inversé pousse les messages vers le haut visuel, contre-intuitif car la transformation s'applique dans l'espace non-inversé du conteneur de contenu.
- **Implémentation de features répétitives** : transitions de navigation sur 5 stacks, internationalisation de 4 écrans (ajout des namespaces, remplacement de tous les strings), extension du header avec blur natif.
- **Interactions Supabase** : écriture des migrations SQL (ajout des 11 colonnes manquantes sur `garage_vehicles` qui causaient silencieusement l'échec de l'insertion), vérification du schéma et des politiques RLS, appel et gestion des erreurs des Edge Functions.
- **Implémentation des nouveaux flows garage** : `CertificationScreen` (flow 4 étapes avec caméra, preview, upload bucket privé, création de demande), `VehiclePlateSearchScreen` (formatage dynamique de plaque SIV, skeleton loader animé, pré-remplissage du formulaire `AddVehicle` via paramètres de navigation), composant `VerifiedBadge` avec deux variantes (certified/pending) et deux tailles (sm/md).

### Ce que l'IA n'a pas fait

- **Concevoir l'architecture** : la structure en stacks imbriqués, le choix de Supabase vs alternatives, le modèle de données, le design du feed "dual-source" — ces décisions ont été prises indépendamment de l'IA.
- **Définir le design** : la charte graphique, le layout du feed plein écran, le système de HUD par type de post — tout cela a été spécifié dans les instructions données à l'IA, pas généré par elle.
- **Valider les résultats** : chaque modification a été relue, testée sur device physique, et ajustée si le comportement observé ne correspondait pas à l'attendu. L'IA s'est trompée à plusieurs reprises dans son diagnostic initial (gestion des touches Android avec `elevation` sur les bottom sheets, sens de `justifyContent` avec un `FlatList` inversé) et a nécessité des itérations avec des informations complémentaires (screenshot, message d'erreur exact, comportement observé sur device).

### Regard critique sur l'outil

L'IA est particulièrement efficace sur des tâches délimitées avec un contrat d'interface clair. Elle est moins fiable sur des diagnostics qui nécessitent une connaissance du comportement runtime (animations, gestion du clavier, priorité des événements tactiles Android). Dans ces cas, le diagnostic initial était souvent incorrect et nécessitait plusieurs échanges pour converger vers la vraie cause.

En pratique, l'IA a accéléré significativement les parties les plus mécaniques (internationalisation, déduplication de configuration de navigation, réécriture de styles), libérant du temps pour les décisions de design et d'architecture. Elle a aussi permis de débloquer des bugs qui auraient demandé plusieurs heures de documentation — à condition de poser les bonnes questions et de ne pas prendre les premières réponses pour argent comptant.
