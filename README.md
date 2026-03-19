# 🏎️ Vroom - L'application des passionnés d'automobile

Bienvenue sur le dépôt officiel de **Vroom**, l'application mobile de référence pensée par et pour les passionnés de voitures. Gérez votre garage virtuel, découvrez des événements (Track Days, Car Shows) et connectez-vous avec la communauté.

## ✨ Fonctionnalités Principales

* **🔐 Authentification Sécurisée :** Système de connexion et de création de compte géré via Supabase.
* **🧭 Navigation Intuitive :** Barre de navigation à 5 onglets (Home, Maps, Search, Messages, Profile) avec protection des routes (Redirection automatique si non connecté).
* **👤 Profil Utilisateur (Pixel Perfect) :** * Statistiques de la communauté (Followers, Events, Groups).
  * Section "Highlights" (Stories) avec UI personnalisée.
  * **My Garage :** Grille d'affichage premium de la collection de véhicules avec effets de dégradés (Linear Gradients).
* **🎨 Design System Personnalisé :** Interface claire, moderne et contrastée utilisant les couleurs officielles de la marque (Racing Red `#E50914`, Coffee Bean `#140102`).

## 🛠️ Stack Technique

* **Framework :** [React Native](https://reactnative.dev/) (avec [Expo](https://expo.dev/))
* **Navigation :** [React Navigation v6](https://reactnavigation.org/) (Bottom Tabs & Stack Navigator)
* **Backend as a Service (BaaS) :** [Supabase](https://supabase.com/) (Authentification & Base de données)
* **Composants visuels :** `expo-linear-gradient`, `@expo/vector-icons`

## 📂 Architecture du Projet

```text
Vroom/
├── assets/                 # Logos, polices et icônes SVG/PNG
├── navigation/             # Configuration des routes
│   ├── AppNavigator.js     # Chef d'orchestre (Auth vs MainApp)
│   └── MainNavigator.js    # Barre de navigation à 5 onglets
├── screens/                # Pages de l'application
│   ├── LoginScreen.tsx     # Écran de connexion
│   ├── ProfileScreen.tsx   # Écran Profil & Garage
│   └── ...                 # (Home, Maps, Search, Messages)
├── App.js                  # Point d'entrée de l'application
├── supabaseClient.js       # Configuration et connexion à Supabase
└── package.json            # Dépendances et scripts du projet
