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
    showMore: string;
    showLess: string;
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
  map: {
    filterAll: string;
    filterEvents: string;
    filterRoutes: string;
    typeEvent: string;
    typeRoute: string;
    newPoint: string;
    titleField: string;
    titlePlaceholder: string;
    descriptionField: string;
    descriptionPlaceholder: string;
    eventDate: string;
    eventDatePlaceholder: string;
    photoOptional: string;
    useCurrentLocation: string;
    pickOnMap: string;
    publish: string;
    publishing: string;
    getDirections: string;
    openInGoogleMaps: string;
    openInWaze: string;
    deletePoint: string;
    deleteConfirmTitle: string;
    deleteConfirmMsg: string;
    cancel: string;
    delete: string;
    permissionTitle: string;
    permissionMsg: string;
    titleRequired: string;
    titleRequiredMsg: string;
    locationRequired: string;
    locationRequiredMsg: string;
    errorTitle: string;
    errorMsg: string;
    by: string;
    emptyHint: string;
    searchAddress: string;
    addressPlaceholder: string;
    noResults: string;
    iAttend: string;
    cancelAttendance: string;
    attendeesCount: string;
    myRoutes: string;
    recordRoute: string;
    startRecording: string;
    stopRecording: string;
    recordingWarning: string;
    recordingInProgress: string;
    saveRoute: string;
    routeNamePlaceholder: string;
    publishRoute: string;
    distanceLabel: string;
    durationLabel: string;
    addWaypointHint: string;
    undoLastPoint: string;
    clearWaypoints: string;
    favoriteRoute: string;
    unfavoriteRoute: string;
    recordedRoutesTab: string;
    publishedRoutesTab: string;
    favoriteRoutesTab: string;
    noSavedRoutes: string;
    noPublishedRoutes: string;
    noFavoriteRoutes: string;
  };
  activity: {
    title: string;
    liked_your_post: string;
    commented_on_your_post: string;
    started_following_you: string;
    empty_title: string;
    empty_subtitle: string;
    just_now: string;
    minutes_suffix: string;
    hours_suffix: string;
    days_suffix: string;
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
    showMore: 'Voir plus',
    showLess: 'Voir moins',
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
  map: {
    filterAll: 'Tous',
    filterEvents: 'Événements',
    filterRoutes: 'Routes',
    typeEvent: 'Événement',
    typeRoute: 'Route sympa',
    newPoint: 'Nouveau point',
    titleField: 'TITRE *',
    titlePlaceholder: 'Cars & Coffee, Col de Turini…',
    descriptionField: 'DESCRIPTION (optionnel)',
    descriptionPlaceholder: 'Décris le lieu, l\'ambiance, ce qu\'il faut savoir…',
    eventDate: 'DATE (optionnel)',
    eventDatePlaceholder: '15/08/2026, tous les samedis…',
    photoOptional: 'PHOTO (optionnel)',
    useCurrentLocation: 'Ma position actuelle',
    pickOnMap: 'Choisir sur la carte',
    publish: 'PUBLIER LE POINT',
    publishing: '...',
    getDirections: 'Itinéraire',
    openInGoogleMaps: 'Ouvrir dans Google Maps',
    openInWaze: 'Ouvrir dans Waze',
    deletePoint: 'Supprimer',
    deleteConfirmTitle: 'Supprimer ce point ?',
    deleteConfirmMsg: 'Cette action est définitive.',
    cancel: 'Annuler',
    delete: 'Supprimer',
    permissionTitle: 'Localisation désactivée',
    permissionMsg: 'Active la localisation dans les réglages pour voir les points près de toi.',
    titleRequired: 'Titre requis',
    titleRequiredMsg: 'Donne un titre à ton point.',
    locationRequired: 'Position requise',
    locationRequiredMsg: 'Active ta position ou choisis un point sur la carte.',
    errorTitle: 'Erreur',
    errorMsg: 'Impossible de publier ce point.',
    by: 'par',
    emptyHint: 'Aucun point pour l\'instant — sois le premier à en ajouter un !',
    searchAddress: 'Adresse',
    addressPlaceholder: 'Rechercher une adresse…',
    noResults: 'Aucun résultat pour cette adresse.',
    iAttend: 'Je participe',
    cancelAttendance: 'Annuler ma participation',
    attendeesCount: 'participant(s)',
    myRoutes: 'Mes itinéraires',
    recordRoute: 'Enregistrer un trajet',
    startRecording: 'Démarrer',
    stopRecording: 'Arrêter',
    recordingWarning: 'Garde l\'application ouverte et l\'écran allumé pendant tout le trajet pour un enregistrement fiable.',
    recordingInProgress: 'Enregistrement en cours…',
    saveRoute: 'Enregistrer',
    routeNamePlaceholder: 'Nom du trajet',
    publishRoute: 'Publier sur la carte',
    distanceLabel: 'Distance',
    durationLabel: 'Durée',
    addWaypointHint: 'Touche la carte pour ajouter des points, dans l\'ordre du trajet.',
    undoLastPoint: 'Annuler le dernier point',
    clearWaypoints: 'Effacer',
    favoriteRoute: 'Ajouter aux favoris',
    unfavoriteRoute: 'Retirer des favoris',
    recordedRoutesTab: 'Enregistrés',
    publishedRoutesTab: 'Publiés',
    favoriteRoutesTab: 'Favoris',
    noSavedRoutes: 'Aucun trajet enregistré pour l\'instant.',
    noPublishedRoutes: 'Aucun itinéraire publié pour l\'instant.',
    noFavoriteRoutes: 'Aucun itinéraire en favori pour l\'instant.',
  },
  activity: {
    title: 'Activité',
    liked_your_post: 'a aimé ta publication',
    commented_on_your_post: 'a commenté ta publication',
    started_following_you: 's\'est abonné(e) à toi',
    empty_title: 'Aucune activité pour le moment',
    empty_subtitle: 'Les likes, commentaires et nouveaux abonnés apparaîtront ici',
    just_now: 'à l\'instant',
    minutes_suffix: 'min',
    hours_suffix: 'h',
    days_suffix: 'j',
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
    showMore: 'Show more',
    showLess: 'Show less',
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
  map: {
    filterAll: 'All',
    filterEvents: 'Events',
    filterRoutes: 'Routes',
    typeEvent: 'Event',
    typeRoute: 'Nice route',
    newPoint: 'New point',
    titleField: 'TITLE *',
    titlePlaceholder: 'Cars & Coffee, mountain pass…',
    descriptionField: 'DESCRIPTION (optional)',
    descriptionPlaceholder: 'Describe the place, the vibe, what to know…',
    eventDate: 'DATE (optional)',
    eventDatePlaceholder: 'Aug 15 2026, every Saturday…',
    photoOptional: 'PHOTO (optional)',
    useCurrentLocation: 'My current location',
    pickOnMap: 'Pick on map',
    publish: 'PUBLISH POINT',
    publishing: '...',
    getDirections: 'Get directions',
    openInGoogleMaps: 'Open in Google Maps',
    openInWaze: 'Open in Waze',
    deletePoint: 'Delete',
    deleteConfirmTitle: 'Delete this point?',
    deleteConfirmMsg: 'This action is permanent.',
    cancel: 'Cancel',
    delete: 'Delete',
    permissionTitle: 'Location disabled',
    permissionMsg: 'Enable location in settings to see points near you.',
    titleRequired: 'Title required',
    titleRequiredMsg: 'Give your point a title.',
    locationRequired: 'Location required',
    locationRequiredMsg: 'Enable your location or pick a point on the map.',
    errorTitle: 'Error',
    errorMsg: 'Unable to publish this point.',
    by: 'by',
    emptyHint: 'No points yet — be the first to add one!',
    searchAddress: 'Address',
    addressPlaceholder: 'Search an address…',
    noResults: 'No results for this address.',
    iAttend: 'I\'m attending',
    cancelAttendance: 'Cancel attendance',
    attendeesCount: 'attendee(s)',
    myRoutes: 'My routes',
    recordRoute: 'Record a route',
    startRecording: 'Start',
    stopRecording: 'Stop',
    recordingWarning: 'Keep the app open and your screen on for the whole ride for a reliable recording.',
    recordingInProgress: 'Recording in progress…',
    saveRoute: 'Save',
    routeNamePlaceholder: 'Route name',
    publishRoute: 'Publish to the map',
    distanceLabel: 'Distance',
    durationLabel: 'Duration',
    addWaypointHint: 'Tap the map to add points, in the order of the route.',
    undoLastPoint: 'Undo last point',
    clearWaypoints: 'Clear',
    favoriteRoute: 'Add to favorites',
    unfavoriteRoute: 'Remove from favorites',
    recordedRoutesTab: 'Recorded',
    publishedRoutesTab: 'Published',
    favoriteRoutesTab: 'Favorites',
    noSavedRoutes: 'No recorded route yet.',
    noPublishedRoutes: 'No published route yet.',
    noFavoriteRoutes: 'No favorite route yet.',
  },
  activity: {
    title: 'Activity',
    liked_your_post: 'liked your post',
    commented_on_your_post: 'commented on your post',
    started_following_you: 'started following you',
    empty_title: 'No activity yet',
    empty_subtitle: 'Likes, comments and new followers will show up here',
    just_now: 'just now',
    minutes_suffix: 'm',
    hours_suffix: 'h',
    days_suffix: 'd',
  },
};

export const translations = { fr: FR, en: EN };

export const getTranslation = (language: Language) => translations[language];
