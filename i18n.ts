export type Language = 'fr' | 'en';

export interface Translations {
  profile: {
    followers: string;
    events: string;
    groups: string;
    editProfile: string;
    share: string;
    events_participations: string;
    cars_garage: string;
    trackdays: string;
    garage: string;
    publications: string;
    itineraires: string;
    back_to_garage: string;
    favorites: string;
    repost: string;
    history: string;
    logout: string;
    settings: string;
    activity: string;
    saved: string;
    highlights: string;
    new: string;
    kilometer: string;
    motorization: string;
    color: string;
    transmission: string;
    discover: string;
    delete_highlight: string;
    delete_confirm: string;
    cancel: string;
    delete: string;
    permission_required: string;
    permission_photos: string;
  };
  settings: {
    title: string;
    language: string;
    notifications: string;
    push: string;
    email: string;
    privacy: string;
    private_account: string;
    account: string;
    logout: string;
    english: string;
    french: string;
    push_hint: string;
    email_hint: string;
    private_hint: string;
    change_password: string;
    change_password_hint: string;
    about: string;
    version: string;
    support: string;
    support_hint: string;
    terms: string;
    terms_hint: string;
    sign_out: string;
    notifications_section: string;
    help_section: string;
    language_hint: string;
  };
}

const FR: Translations = {
  profile: {
    followers: 'Abonnés',
    events: 'Événements',
    groups: 'Groupes',
    editProfile: 'Modifier le profil',
    share: 'Partager',
    events_participations: 'événements · Participations',
    cars_garage: 'voitures · Garage',
    trackdays: 'sorties · Track days',
    garage: 'Garage',
    publications: 'Publications',
    itineraires: 'Itinéraires',
    back_to_garage: 'Retour au garage',
    favorites: 'Favoris',
    repost: 'Repost',
    history: 'HISTORIQUE',
    logout: 'Se déconnecter',
    settings: 'Paramètres',
    activity: 'Activité',
    saved: 'Enregistré',
    highlights: 'HIGHLIGHTS',
    new: 'Nouveau',
    kilometer: 'Kilométrage (km)',
    motorization: 'Motorisation',
    color: 'Couleur',
    transmission: 'Transmission',
    discover: 'découvert sur Vroom 🏎️',
    delete_highlight: 'Supprimer le highlight',
    delete_confirm: 'Voulez-vous supprimer ce highlight ?',
    cancel: 'Annuler',
    delete: 'Supprimer',
    permission_required: 'Permission requise',
    permission_photos: "L'accès à votre photothèque est nécessaire.",
  },
  settings: {
    title: 'Paramètres',
    language: 'Langue',
    language_hint: 'Choisissez la langue de l\'application',
    notifications: 'Notifications',
    notifications_section: 'NOTIFICATIONS',
    push: 'Notifications push',
    push_hint: 'Recevoir des alertes d\'activité',
    email: 'Notifications e-mail',
    email_hint: 'Recevoir des mises à jour par e-mail',
    privacy: 'Confidentialité',
    private_account: 'Compte privé',
    private_hint: 'Contrôler qui voit vos publications',
    account: 'COMPTE',
    change_password: 'Modifier le mot de passe',
    change_password_hint: 'Mettre à jour votre sécurité',
    logout: 'Se déconnecter',
    english: 'English',
    french: 'Français',
    help_section: 'AIDE & SUPPORT',
    about: 'À propos de Vroom',
    version: 'Version 1.0.0',
    support: 'Contacter le support',
    support_hint: 'Obtenir de l\'aide',
    terms: 'Conditions & Confidentialité',
    terms_hint: 'Nos politiques et conditions',
    sign_out: 'Se déconnecter',
  },
};

const EN: Translations = {
  profile: {
    followers: 'Followers',
    events: 'Events',
    groups: 'Groups',
    editProfile: 'Edit Profile',
    share: 'Share',
    events_participations: 'events · Participations',
    cars_garage: 'cars · Garage',
    trackdays: 'outings · Track days',
    garage: 'Garage',
    publications: 'Publications',
    itineraires: 'Routes',
    back_to_garage: 'Back to garage',
    favorites: 'Favorites',
    repost: 'Repost',
    history: 'HISTORY',
    logout: 'Log out',
    settings: 'Settings',
    activity: 'Activity',
    saved: 'Saved',
    highlights: 'HIGHLIGHTS',
    new: 'New',
    kilometer: 'Mileage (km)',
    motorization: 'Engine',
    color: 'Color',
    transmission: 'Transmission',
    discover: 'discovered on Vroom 🏎️',
    delete_highlight: 'Delete highlight',
    delete_confirm: 'Delete this highlight?',
    cancel: 'Cancel',
    delete: 'Delete',
    permission_required: 'Permission required',
    permission_photos: 'Access to your photo library is needed.',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    language_hint: 'Choose the app language',
    notifications: 'Notifications',
    notifications_section: 'NOTIFICATIONS',
    push: 'Push Notifications',
    push_hint: 'Get notified about activity',
    email: 'Email Notifications',
    email_hint: 'Receive emails about updates',
    privacy: 'Privacy',
    private_account: 'Private Account',
    private_hint: 'Control who can see your posts',
    account: 'ACCOUNT',
    change_password: 'Change Password',
    change_password_hint: 'Update your security',
    logout: 'Log out',
    english: 'English',
    french: 'Français',
    help_section: 'HELP & SUPPORT',
    about: 'About Vroom',
    version: 'Version 1.0.0',
    support: 'Contact Support',
    support_hint: 'Get help from our team',
    terms: 'Terms & Privacy',
    terms_hint: 'Our policies and terms',
    sign_out: 'Sign Out',
  },
};

export const translations = { fr: FR, en: EN };

export const getTranslation = (language: Language) => translations[language];
