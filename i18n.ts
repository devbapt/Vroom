export type Language = 'fr' | 'en';

export interface Translations {
  post: {
    newPost: string;
    publish: string;
    publishing: string;
    photos: string;
    postType: string;
    vehicle: string;
    location: string;
    sessionData: string;
    descriptionSection: string;
    descriptionPlaceholder: string;
    // types
    type_track: string;
    type_road_trip: string;
    type_meet: string;
    type_daily: string;
    type_build: string;
    type_spotted: string;
    // fields
    power: string;
    acceleration: string;
    lapTime: string;
    avgSpeed: string;
    distance: string;
    duration: string;
    crew: string;
    city: string;
    people: string;
    cars: string;
    transmission: string;
    mods: string;
    budget: string;
    phase: string;
    model: string;
    rarity: string;
    // vehicle form
    brand: string;
    modelField: string;
    year: string;
    // photo
    addPhotos: string;
    addMore: string;
    // alerts
    photoRequired: string;
    photoRequiredMsg: string;
    vehicleRequired: string;
    vehicleRequiredMsg: string;
    errorTitle: string;
    errorMsg: string;
    errorGeneric: string;
  };
  garage: {
    addTitle: string;
    mainPhoto: string;
    addPhoto: string;
    photoFormat: string;
    replace: string;
    identity: string;
    brand: string;
    model: string;
    year: string;
    nickname: string;
    technical: string;
    power: string;
    acceleration: string;
    transmission: string;
    drivetrain: string;
    fuel: string;
    details: string;
    color: string;
    mileage: string;
    acquiredAt: string;
    status: string;
    notes: string;
    history: string;
    add: string;
    requiredHint: string;
    fuel_gasoline: string;
    fuel_diesel: string;
    fuel_hybrid: string;
    fuel_electric: string;
    permissionRequired: string;
    permissionMsg: string;
    errorMsg: string;
  };
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
  post: {
    newPost: 'NOUVEAU POST',
    publish: 'PUBLIER',
    publishing: '...',
    photos: 'PHOTOS',
    postType: 'TYPE DE POST',
    vehicle: 'VÉHICULE',
    location: 'LIEU',
    sessionData: 'DONNÉES SESSION',
    descriptionSection: 'DESCRIPTION (optionnel)',
    descriptionPlaceholder: 'Décris ta session, ton véhicule, l\'ambiance…',
    type_track: 'TRACK',
    type_road_trip: 'ROAD TRIP',
    type_meet: 'MEET',
    type_daily: 'DAILY',
    type_build: 'BUILD',
    type_spotted: 'SPOTTED',
    power: 'POWER (ch)',
    acceleration: '0–100 (s)',
    lapTime: 'MEILLEUR TOUR',
    avgSpeed: 'VIT. MOY. (km/h)',
    distance: 'DISTANCE',
    duration: 'DURÉE',
    crew: 'VOITURES',
    city: 'VILLE',
    people: 'PERSONNES',
    cars: 'VOITURES',
    transmission: 'TRANSMISSION',
    mods: 'MODS',
    budget: 'BUDGET',
    phase: 'PHASE',
    model: 'MODÈLE',
    rarity: 'RARETÉ',
    brand: 'MARQUE',
    modelField: 'MODÈLE',
    year: 'ANNÉE',
    addPhotos: 'Ajouter des photos',
    addMore: 'Ajouter',
    photoRequired: 'Photo requise',
    photoRequiredMsg: 'Ajoute au moins une photo pour publier.',
    vehicleRequired: 'Véhicule requis',
    vehicleRequiredMsg: 'Renseigne la marque de ton véhicule.',
    errorTitle: 'Erreur',
    errorMsg: 'Impossible de publier le post.',
    errorGeneric: 'Une erreur est survenue lors de la publication.',
  },
  garage: {
    addTitle: 'AJOUTER AU GARAGE',
    mainPhoto: 'PHOTO PRINCIPALE *',
    addPhoto: 'Ajouter une photo',
    photoFormat: 'Format 16:9 recommandé',
    replace: 'Remplacer',
    identity: 'IDENTITÉ',
    brand: 'MARQUE *',
    model: 'MODÈLE *',
    year: 'ANNÉE *',
    nickname: 'SURNOM (optionnel)',
    technical: 'CARACTÉRISTIQUES TECHNIQUES',
    power: 'POWER',
    acceleration: '0–100 (s)',
    transmission: 'TRANSMISSION',
    drivetrain: 'TRANSMISSION DE PUISSANCE',
    fuel: 'CARBURANT',
    details: 'DÉTAILS OPTIONNELS',
    color: 'COULEUR',
    mileage: 'KILOMÉTRAGE',
    acquiredAt: 'DATE D\'ACQUISITION',
    status: 'STATUT',
    notes: 'NOTES',
    history: 'HISTORIQUE / ANECDOTES',
    add: 'AJOUTER AU GARAGE',
    requiredHint: 'Photo, marque, modèle et année requis',
    fuel_gasoline: 'Essence',
    fuel_diesel: 'Diesel',
    fuel_hybrid: 'Hybride',
    fuel_electric: 'Électrique',
    permissionRequired: 'Permission requise',
    permissionMsg: 'Accès à la galerie nécessaire.',
    errorMsg: 'Impossible d\'ajouter le véhicule.',
  },
  profile: {
    followers: 'Abonnés',
    events: 'Événements',
    groups: 'Groupes',
    editProfile: 'Modifier le profil',
    share: 'Partager',
    events_participations: 'Événements · Participations',
    cars_garage: 'Voitures · Garage',
    trackdays: 'Sorties · Track days',
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
  post: {
    newPost: 'NEW POST',
    publish: 'PUBLISH',
    publishing: '...',
    photos: 'PHOTOS',
    postType: 'POST TYPE',
    vehicle: 'VEHICLE',
    location: 'LOCATION',
    sessionData: 'SESSION DATA',
    descriptionSection: 'DESCRIPTION (optional)',
    descriptionPlaceholder: 'Describe your session, your vehicle, the vibe…',
    type_track: 'TRACK',
    type_road_trip: 'ROAD TRIP',
    type_meet: 'MEET',
    type_daily: 'DAILY',
    type_build: 'BUILD',
    type_spotted: 'SPOTTED',
    power: 'POWER (hp)',
    acceleration: '0–100 (s)',
    lapTime: 'LAP TIME',
    avgSpeed: 'AVG SPEED (km/h)',
    distance: 'DISTANCE',
    duration: 'DURATION',
    crew: 'CREW (cars)',
    city: 'CITY',
    people: 'PEOPLE',
    cars: 'CARS',
    transmission: 'TRANSMISSION',
    mods: 'MODS',
    budget: 'BUDGET',
    phase: 'PHASE',
    model: 'MODEL',
    rarity: 'RARITY',
    brand: 'BRAND',
    modelField: 'MODEL',
    year: 'YEAR',
    addPhotos: 'Add photos',
    addMore: 'Add',
    photoRequired: 'Photo required',
    photoRequiredMsg: 'Add at least one photo to publish.',
    vehicleRequired: 'Vehicle required',
    vehicleRequiredMsg: 'Enter your vehicle brand.',
    errorTitle: 'Error',
    errorMsg: 'Unable to publish the post.',
    errorGeneric: 'An error occurred while publishing.',
  },
  garage: {
    addTitle: 'ADD TO GARAGE',
    mainPhoto: 'MAIN PHOTO *',
    addPhoto: 'Add a photo',
    photoFormat: '16:9 format recommended',
    replace: 'Replace',
    identity: 'IDENTITY',
    brand: 'BRAND *',
    model: 'MODEL *',
    year: 'YEAR *',
    nickname: 'NICKNAME (optional)',
    technical: 'TECHNICAL SPECS',
    power: 'POWER',
    acceleration: '0–100 (s)',
    transmission: 'TRANSMISSION',
    drivetrain: 'DRIVETRAIN',
    fuel: 'FUEL',
    details: 'OPTIONAL DETAILS',
    color: 'COLOR',
    mileage: 'MILEAGE',
    acquiredAt: 'ACQUISITION DATE',
    status: 'STATUS',
    notes: 'NOTES',
    history: 'HISTORY / ANECDOTES',
    add: 'ADD TO GARAGE',
    requiredHint: 'Photo, brand, model and year required',
    fuel_gasoline: 'Gasoline',
    fuel_diesel: 'Diesel',
    fuel_hybrid: 'Hybrid',
    fuel_electric: 'Electric',
    permissionRequired: 'Permission required',
    permissionMsg: 'Gallery access needed.',
    errorMsg: 'Unable to add the vehicle.',
  },
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
