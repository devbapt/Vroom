# Guide d'Utilisation - Page Profil Vroom

## 🎯 Aperçu des Nouvelles Fonctionnalités

La page de profil a été complètement refondue pour offrir une meilleure expérience utilisateur avec plusieurs nouvelles fonctionnalités et améliorations d'interface.

---

## 📱 Page Profil (ProfileScreen)

### Navigation Principale

#### Header
- **Username** (`@Alex_Driver_23`) - Centré en haut
- **Menu hamburger** - Clic pour accéder à Paramètres, Activité, Enregistré, Déconnexion
- **Trait de séparation** - Divider sous le header

#### Profil Utilisateur
- **Avatar** - Cliquez pour aller à "Modifier le profil" et changer votre photo
- **Statistiques** (à droite de l'avatar):
  - Abonnés (1.2k)
  - Événements (18)
  - Groupes (5)

#### Biographie
- Nom complet: `Alex Driver`
- Bio personnelle avec emojis
- **Tags/Intérêts** - Défilez horizontalement pour voir tous les tags
  - Tags rouges = Marques
  - Tags avec bordure = Lieux/Régions

#### Boutons d'Action
- **Modifier le profil** - Accès à l'édition du profil, des tags et de la photo
- **Partager** - Partage le profil via le système de partage du téléphone

#### Cartes d'Activité
Trois cartes colorées affichant:
- 12 événements (Participations) - Rouge
- 3 voitures (Garage) - Noir
- 47 sorties (Track days) - Noir

#### Highlights
- **Scroll horizontal** des highlights avec images
- **Bouton "New"** - Ajoute un nouveau highlight
- **Long-press sur un highlight** - Le supprime
- Noms des highlights affichés sous les images

#### Onglets de Navigation
- **Garage** (défaut) - Affiche la galerie des voitures
- **Publications** - En construction
- **Itinéraires** - En construction

#### Galerie de Voitures (Garage)
- Affichage en grille 2 colonnes
- Chaque carte affiche:
  - Image haute résolution
  - Année en bas à droite
  - Tap pour voir les détails

---

## 🚗 Détail Véhicule (CarDetailView)

### Image et Navigation
- **Slider horizontal** - Défilez les images du véhicule
- **Compteur d'images** - Affiche "1/3" (image courante/total)
- **Bouton Partager** - En haut à droite pour partager le véhicule

### Informations du Véhicule
- **Titre** - Nom complet du véhicule
- **Sous-titre** - Année, Carrosserie, Puissance (ex: "1973 · Coupé · 210 ch")

### Caractéristiques (Specs)
Grille 2×2 affichant:
- Kilométrage (km)
- Motorisation (type de moteur)
- Couleur
- Transmission

### Actions
- ❤️ **Favoris** - Ajoute/retire des favoris (cœur rouge)
- 📤 **Repost** - Partage le véhicule
- ••• **Options** - Menu supplémentaire (à implémenter)

### Historique
Section détaillée décrivant l'histoire du véhicule avec détails sur son acquisition et restauration.

### Bouton Retour
- **Retour au garage** - Avec chevron, en haut à gauche
- **Bouton Partager** - À droite du bouton retour

---

## ✏️ Modifier le Profil (EditProfileScreen)

### Section Photo et Infos de Base
- **Photo de profil** - Cliquez pour changer (camera picker)
- **Nom** - Modifiez votre nom complet
- **Username** - Avec préfixe @ (ex: @Alex_Driver_23)
- **Biographie** - 150 caractères max avec compteur

### Gestion des Tags
#### Tags Actuels
- Affichés en chips avec couleurs différentes
- **X** sur chaque tag - Cliquez pour supprimer

#### Ajouter un Tag
1. **Tapez le nom du tag** - Champ "Nouveau tag"
2. **Sélectionnez le type**:
   - **Marque** (tags rouges)
   - **Lieu** (tags avec bordure)
   - **Région** (tags avec bordure)
3. **Cliquez "Ajouter"** - Ajoute le tag à la liste

#### Types de Tags
- **Marques** - Porsche, Ferrari, etc. (rouges)
- **Lieux** - Circuit SPA, Nürburgring, etc.
- **Régions** - Lyon FR, Paris, etc.

### Sauvegarde
- Cliquez **"Terminer"** en haut à droite pour sauvegarder
- Les modifications s'appliquent immédiatement au profil

---

## ⚙️ Paramètres (SettingsScreen)

### Compte
- **Compte privé** - Bascule pour contrôler qui voit vos posts

### Notifications
- **Notifications push** - Activez/Désactivez les notifications
- **Notifications email** - Activez/Désactivez les emails

### Langue
- **Français** - Défaut avec checkmark ✓
- **Anglais** - Basculez pour une interface en anglais
- La langue change immédiatement dans toute l'app

### Aide & Support
- À venir

---

## 🌐 Multilingue

### Comment Changer la Langue?
1. Ouvrez le **menu hambourger** (≡)
2. Appuyez sur **"Paramètres"**
3. Cherchez la section **"Langue"**
4. Sélectionnez **Français** ou **English**
5. L'interface bascule immédiatement

### Langues Disponibles
- 🇫🇷 **Français** - Interface complète en français
- 🇬🇧 **English** - Interface complète en anglais

### Traductions Incluses
- Tous les labels et boutons
- Tous les menus
- Tous les textes d'information
- Tous les placeholders

---

## 🔄 Pull-to-Refresh

### Comment Rafraîchir?
1. Allez à la page Profil
2. **Faites un geste de tirer vers le bas** sur la page
3. **Relâchez** pour rafraîchir les données
4. Un spinner indique le rechargement

---

## 🎨 Améliorations Visuelles

### Espacements
- Réduction des marges pour une compacité accrue
- Moins d'espace entre les cartes de voitures
- Interface plus dense et lisible

### Typographie
- Tailles de police légèrement réduites
- Meilleure hiérarchie visuelle
- Police plus compacte pour plus d'information visible

### Badges de Rareté
- **Supprimés** - Seule l'année est affichée maintenant
- Interface plus épurée et moderne

### Images
- **Vraies photos de voitures** d'Unsplash
- **Slider de photos** pour les détails des véhicules
- Images responsives et haute résolution

---

## 💡 Astuces & Bonnes Pratiques

### Pour Modifier Votre Profil
✓ Cliquez sur votre avatar pour changer la photo rapidement
✓ Utilisez des tags descriptifs pour une meilleure catégorisation
✓ Les emojis peuvent enrichir votre bio

### Pour les Highlights
✓ Ajoutez des highlights pour mettre en avant vos collections
✓ Long-press pour supprimer les highlights indésirables
✓ Organisez vos highlights par thème (Car Shows, Track Days, etc.)

### Pour Naviguer
✓ Le pull-to-refresh fonctionne depuis le haut de la page
✓ Swipez horizontalement dans les sliders
✓ Utilisez le menu hamburger pour accéder aux paramètres

---

## 🐛 Dépannage

### Les changements ne s'affichent pas?
- Rafraîchissez la page (pull-to-refresh)
- Vérifiez que les modifications ont été sauvegardées

### La langue ne change pas?
- Vérifiez que vous avez cliqué sur la langue dans Paramètres
- Rechargez l'application si nécessaire

### Les images ne chargent pas?
- Vérifiez votre connexion internet
- Essayez de rafraîchir la page

---

## 📞 Support

Pour toute question ou problème, consultez le menu Paramètres → Aide & Support.

---

**Version**: 1.0.0
**Dernière mise à jour**: Avril 2026
**Langue**: Français/Anglais
