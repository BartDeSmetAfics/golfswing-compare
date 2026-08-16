export type Locale = "nl" | "en" | "fr";
export const DEFAULT_LOCALE: Locale = "nl";
export const LOCALES: Locale[] = ["nl", "en", "fr"];

const translations = {
  nl: {
    // Common
    back: "Terug",
    save: "Opslaan",
    saving: "Opslaan…",
    cancel: "Annuleer",
    edit: "Bewerken",
    delete: "Verwijder",
    deleting: "Verwijderen…",

    // Dashboard
    recordNew: "+ Nieuwe slag opnemen",
    yourSwings: "Jouw slagen",
    noSwings: "Nog geen slagen — neem je eerste hierboven op.",

    // Swing status
    statusReady: "klaar",
    statusFailed: "mislukt",
    statusProcessing: "verwerken…",

    // SwingList delete
    deleteConfirm: "Slag verwijderen?",

    // Profile
    editProfile: "Profiel bewerken",
    noName: "Geen naam ingesteld",
    name: "Naam",
    handicap: "Handicap",
    swings: "Slagen",
    analysed: "Geanalyseerd",
    memberSince: "Lid sinds",
    tipsForYou: "Tips voor jou",
    yourSwingsSection: "Jouw slagen",
    noSwingsYet: "Nog geen slagen.",
    changePhoto: "Wijzig",
    yourProfile: "Jouw profiel",

    // Profile tips
    tipFirstSwing: "Neem je eerste ijzer-swing op om te beginnen.",
    tipFewSwings: "Neem nog een paar slagen op om je voortgang bij te houden.",
    tipManySwings: "Je hebt {count} slagen geüpload — ga zo door om je verbetering te volgen.",
    tipNoHandicap: "Stel je handicap in zodat je je voortgang kunt bijhouden.",
    tipHighHandicap: "Focus op consistent balcontact voor je werkt aan de swing-beweging.",
    tipLowHandicap: "Op jouw niveau geeft het fijnstellen van de impact-positie de grootste winst.",
    tipReview: "Bekijk de frame-vergelijkingen en coaching-tips voor elke verwerkte swing.",
    tipAngles: "Film van achter en tegenover voor de meest nuttige analyse.",
    tipAddress: "Een stabiele adrespositie is het fundament van elke geweldige swing.",

    // Avatar cropper
    cropTitle: "Profielfoto bijsnijden",
    cropDrag: "Sleep om bij te snijden",
    cropZoom: "Zoom",
    cropConfirm: "Opslaan",

    // Settings
    settings: "Instellingen",
    changeEmail: "E-mailadres wijzigen",
    changePassword: "Wachtwoord wijzigen",
    language: "Taal",
    newEmail: "Nieuw e-mailadres",
    currentPassword: "Huidig wachtwoord",
    newPassword: "Nieuw wachtwoord",
    confirmPassword: "Bevestig wachtwoord",
    saveEmail: "E-mail opslaan",
    savePassword: "Wachtwoord opslaan",
    saved: "Opgeslagen!",
    wrongPassword: "Huidig wachtwoord klopt niet",
    emailInUse: "E-mailadres al in gebruik",
    passwordMismatch: "Wachtwoorden komen niet overeen",
    passwordTooShort: "Wachtwoord moet minimaal 8 tekens zijn",

    // Language names
    langNl: "Nederlands",
    langEn: "English",
    langFr: "Français",

    // Coaching
    getCoaching: "AI coaching feedback ophalen",
    analysing: "Analyseren met Claude…",
    topPriorities: "Topprioriteiten",
    phaseByPhase: "Fase voor fase",
    reanalyse: "Opnieuw analyseren",
    reanalysing: "Analyseren…",
    tip: "Tip",

    // Bottom nav
    navSwings: "Slagen",
    navExercises: "Oefeningen",
    navRecord: "Opnemen",
    navPros: "Pro's",
    navProfile: "Profiel",

    // Exercises page
    exercisesTitle: "Jouw oefeningen",
    exercisesLoading: "Oefeningen ophalen…",
    exercisesEmpty: "Neem eerst een paar slagen op en vraag AI coaching aan om gepersonaliseerde oefeningen te ontgrendelen.",
    exercisesError: "Kon oefeningen niet ophalen.",
    exerciseReps: "Herhalingen",
    exerciseWhy: "Waarom?",
    exercisesIntro: "Op basis van jouw recente coachingfeedback:",

    // Pros page
    prosTitle: "Pro golfers",
    prosEmpty: "Nog geen pro's beschikbaar.",
    proSignatureTraits: "Kenmerkende technieken",
    proTraitsCount: "kenmerken",
    proReferenceFrames: "Referentieframes",
    faceOnFrames: "Tegenover",
    dtlFrames: "Van achter",
    noFrames: "Nog geen frames beschikbaar.",

    proNotFound: "Pro niet gevonden.",

    // Swing detail
    faceOn: "🎯 Tegenover",
    downTheLine: "🎬 Van achter",
    stillProcessing: "Swing wordt nog verwerkt — kom zo terug.",
    addAngleFaceOn: "Voeg jouw tegenover video toe",
    addAngleDtl: "Voeg jouw van achter video toe",
    noProFramesFaceOn: "Geen tegenover referentieframes voor deze pro — nog niet geseeded.",
    noProFramesDtl: "Geen van-achter referentieframes voor deze pro — nog niet geseeded.",
    noUserFramesFaceOn: "Je hebt nog geen video geüpload van tegenover.",
    noUserFramesDtl: "Je hebt nog geen video geüpload van achter.",
    addVideo: "+ Video toevoegen →",
    swingNotFound: "Swing niet gevonden.",
    swingLoadError: "Kon de slag niet laden — probeer opnieuw.",
    tryAgain: "Opnieuw proberen",
  },

  en: {
    back: "Back",
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    deleting: "Deleting…",

    recordNew: "+ Record new swing",
    yourSwings: "Your swings",
    noSwings: "No swings yet — record your first one above.",

    statusReady: "ready",
    statusFailed: "failed",
    statusProcessing: "processing…",

    deleteConfirm: "Delete this swing?",

    editProfile: "Edit profile",
    noName: "No name set",
    name: "Name",
    handicap: "Handicap",
    swings: "Swings",
    analysed: "Analysed",
    memberSince: "Member since",
    tipsForYou: "Tips for you",
    yourSwingsSection: "Your swings",
    noSwingsYet: "No swings yet.",
    changePhoto: "Change",
    yourProfile: "Your profile",

    tipFirstSwing: "Record your first iron swing to get started.",
    tipFewSwings: "Record a few more swings to start seeing your progress over time.",
    tipManySwings: "You've uploaded {count} swings — keep it up to track your improvement.",
    tipNoHandicap: "Set your handicap so you can track progress relative to your level.",
    tipHighHandicap: "Focus on consistent ball contact before working on swing shape.",
    tipLowHandicap: "At your level, fine-tuning impact position gives the biggest gains.",
    tipReview: "Review the frame comparisons and coaching tips for each processed swing.",
    tipAngles: "Film from down-the-line and face-on angles for the most useful analysis.",
    tipAddress: "A stable address position is the foundation of every great swing.",

    cropTitle: "Crop profile photo",
    cropDrag: "Drag to crop",
    cropZoom: "Zoom",
    cropConfirm: "Save",

    settings: "Settings",
    changeEmail: "Change email address",
    changePassword: "Change password",
    language: "Language",
    newEmail: "New email address",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    saveEmail: "Save email",
    savePassword: "Save password",
    saved: "Saved!",
    wrongPassword: "Incorrect current password",
    emailInUse: "Email address already in use",
    passwordMismatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 8 characters",

    langNl: "Nederlands",
    langEn: "English",
    langFr: "Français",

    getCoaching: "Get AI coaching feedback",
    analysing: "Analysing with Claude…",
    topPriorities: "Top priorities",
    phaseByPhase: "Phase by phase",
    reanalyse: "Re-analyse",
    reanalysing: "Analysing…",
    tip: "Tip",

    // Bottom nav
    navSwings: "Swings",
    navExercises: "Exercises",
    navRecord: "Record",
    navPros: "Pros",
    navProfile: "Profile",

    // Exercises page
    exercisesTitle: "Your exercises",
    exercisesLoading: "Fetching exercises…",
    exercisesEmpty: "Record a few swings and get AI coaching first to unlock personalized exercises.",
    exercisesError: "Could not fetch exercises.",
    exerciseReps: "Reps",
    exerciseWhy: "Why?",
    exercisesIntro: "Based on your recent coaching feedback:",

    // Pros page
    prosTitle: "Pro golfers",
    prosEmpty: "No pros available yet.",
    proSignatureTraits: "Signature techniques",
    proTraitsCount: "traits",
    proReferenceFrames: "Reference frames",
    faceOnFrames: "Face-on",
    dtlFrames: "Down-the-line",
    noFrames: "No frames available yet.",

    proNotFound: "Pro not found.",

    faceOn: "🎯 Face-on",
    downTheLine: "🎬 Down-the-line",
    stillProcessing: "Swing is still processing — check back soon.",
    addAngleFaceOn: "Add your face-on video",
    addAngleDtl: "Add your down-the-line video",
    noProFramesFaceOn: "No face-on reference frames for this pro — not seeded yet.",
    noProFramesDtl: "No down-the-line reference frames for this pro — not seeded yet.",
    noUserFramesFaceOn: "You haven't uploaded a face-on video yet.",
    noUserFramesDtl: "You haven't uploaded a down-the-line video yet.",
    addVideo: "+ Add video →",
    swingNotFound: "Swing not found.",
    swingLoadError: "Could not load swing — please try again.",
    tryAgain: "Try again",
  },

  fr: {
    back: "Retour",
    save: "Enregistrer",
    saving: "Enregistrement…",
    cancel: "Annuler",
    edit: "Modifier",
    delete: "Supprimer",
    deleting: "Suppression…",

    recordNew: "+ Enregistrer un nouveau swing",
    yourSwings: "Vos swings",
    noSwings: "Aucun swing — enregistrez le premier ci-dessus.",

    statusReady: "prêt",
    statusFailed: "échoué",
    statusProcessing: "traitement…",

    deleteConfirm: "Supprimer ce swing ?",

    editProfile: "Modifier le profil",
    noName: "Aucun nom défini",
    name: "Nom",
    handicap: "Handicap",
    swings: "Swings",
    analysed: "Analysé",
    memberSince: "Membre depuis",
    tipsForYou: "Conseils pour vous",
    yourSwingsSection: "Vos swings",
    noSwingsYet: "Aucun swing.",
    changePhoto: "Modifier",
    yourProfile: "Votre profil",

    tipFirstSwing: "Enregistrez votre premier swing avec un fer pour commencer.",
    tipFewSwings: "Enregistrez quelques swings supplémentaires pour suivre votre progression.",
    tipManySwings: "Vous avez téléchargé {count} swings — continuez pour suivre vos progrès.",
    tipNoHandicap: "Définissez votre handicap pour suivre vos progrès selon votre niveau.",
    tipHighHandicap: "Concentrez-vous sur un contact régulier avant de travailler la forme du swing.",
    tipLowHandicap: "À votre niveau, peaufiner la position d'impact donne les meilleurs résultats.",
    tipReview: "Consultez les comparaisons de frames et les conseils pour chaque swing traité.",
    tipAngles: "Filmez de derrière et de face pour l'analyse la plus utile.",
    tipAddress: "Une position d'adresse stable est le fondement de chaque excellent swing.",

    cropTitle: "Recadrer la photo de profil",
    cropDrag: "Faites glisser pour recadrer",
    cropZoom: "Zoom",
    cropConfirm: "Enregistrer",

    settings: "Paramètres",
    changeEmail: "Modifier l'adresse e-mail",
    changePassword: "Modifier le mot de passe",
    language: "Langue",
    newEmail: "Nouvelle adresse e-mail",
    currentPassword: "Mot de passe actuel",
    newPassword: "Nouveau mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    saveEmail: "Enregistrer l'e-mail",
    savePassword: "Enregistrer le mot de passe",
    saved: "Enregistré !",
    wrongPassword: "Mot de passe actuel incorrect",
    emailInUse: "Adresse e-mail déjà utilisée",
    passwordMismatch: "Les mots de passe ne correspondent pas",
    passwordTooShort: "Le mot de passe doit comporter au moins 8 caractères",

    langNl: "Nederlands",
    langEn: "English",
    langFr: "Français",

    getCoaching: "Obtenir des conseils IA",
    analysing: "Analyse avec Claude…",
    topPriorities: "Priorités principales",
    phaseByPhase: "Phase par phase",
    reanalyse: "Ré-analyser",
    reanalysing: "Analyse…",
    tip: "Conseil",

    // Bottom nav
    navSwings: "Swings",
    navExercises: "Exercices",
    navRecord: "Enregistrer",
    navPros: "Pros",
    navProfile: "Profil",

    // Exercises page
    exercisesTitle: "Vos exercices",
    exercisesLoading: "Récupération des exercices…",
    exercisesEmpty: "Enregistrez quelques swings et obtenez des conseils IA pour débloquer vos exercices personnalisés.",
    exercisesError: "Impossible de récupérer les exercices.",
    exerciseReps: "Répétitions",
    exerciseWhy: "Pourquoi ?",
    exercisesIntro: "Basé sur vos derniers retours de coaching :",

    // Pros page
    prosTitle: "Golfeurs pros",
    prosEmpty: "Aucun pro disponible.",
    proSignatureTraits: "Techniques signature",
    proTraitsCount: "caractéristiques",
    proReferenceFrames: "Cadres de référence",
    faceOnFrames: "De face",
    dtlFrames: "De derrière",
    noFrames: "Aucun cadre disponible.",

    proNotFound: "Pro introuvable.",

    faceOn: "🎯 Face à",
    downTheLine: "🎬 De derrière",
    stillProcessing: "Le swing est en cours de traitement — revenez bientôt.",
    addAngleFaceOn: "Ajoutez votre vidéo de face",
    addAngleDtl: "Ajoutez votre vidéo de derrière",
    noProFramesFaceOn: "Pas de cadres de référence face à pour ce pro.",
    noProFramesDtl: "Pas de cadres de référence de derrière pour ce pro.",
    noUserFramesFaceOn: "Vous n'avez pas encore téléchargé une vidéo de face.",
    noUserFramesDtl: "Vous n'avez pas encore téléchargé une vidéo de derrière.",
    addVideo: "+ Ajouter une vidéo →",
    swingNotFound: "Swing introuvable.",
    swingLoadError: "Impossible de charger ce swing — veuillez réessayer.",
    tryAgain: "Réessayer",
  },
};

export type TranslationKey = keyof typeof translations.nl;
// Widen values to string so EN/FR variants are assignable to the NL-shaped type
export type Translations = { [K in TranslationKey]: string };

export function getT(locale: Locale): Translations {
  return translations[locale] ?? translations[DEFAULT_LOCALE];
}

export function localeToDateLocale(locale: Locale): string {
  return { nl: "nl-BE", en: "en-GB", fr: "fr-BE" }[locale];
}

export async function getServerLocale(): Promise<Locale> {
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const val = jar.get("locale")?.value;
  return (val === "nl" || val === "en" || val === "fr") ? val : DEFAULT_LOCALE;
}
