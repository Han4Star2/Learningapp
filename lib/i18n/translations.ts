export type Lang = "de" | "en";

export const translations = {
  de: {
    // Sidebar nav
    dashboard:    "Dashboard",
    upload:       "Hochladen",
    create:       "Erstellen",
    teachers:     "Lehrer",
    subjects:     "Fächer",
    logout:       "Abmelden",

    // Settings panel
    settings:     "Einstellungen",
    language:     "Sprache",
    appearance:   "Darstellung",
    color:        "Akzentfarbe",
    light:        "Hell",
    dark:         "Dunkel",

    // Color names
    colorBlue:    "Blau",
    colorPurple:  "Lila",
    colorGreen:   "Grün",
    colorOrange:  "Orange",

    // Upload page
    uploadTitle:       "Hochladen",
    uploadSubtitle:    "Was möchtest du hochladen?",
    uploadNotes:       "Hefteinträge",
    uploadExam:        "Prüfung",
    uploadNotesBadge:  "Pro Bild",
    uploadExamBadge:   "KI-Analyse",
    uploadNotesDesc:   "Mehrere Fotos — jedes Bild wird ein eigener Eintrag mit individuellem Fach und Datum.",
    uploadExamDesc:    "Mehrere Fotos einer Prüfung — geteiltes Fach, Lehrer und Datum. Die KI erkennt das Datum automatisch.",

    // Dashboard
    dashboardTitle:    "Dashboard",
    dashboardSubtitle: "Deine Fächer, Dokumente und generiertes Lernmaterial.",
    newSubject:        "Neues Fach",
  },
  en: {
    // Sidebar nav
    dashboard:    "Dashboard",
    upload:       "Upload",
    create:       "Create",
    teachers:     "Teachers",
    subjects:     "Subjects",
    logout:       "Log out",

    // Settings panel
    settings:     "Settings",
    language:     "Language",
    appearance:   "Appearance",
    color:        "Accent colour",
    light:        "Light",
    dark:         "Dark",

    // Color names
    colorBlue:    "Blue",
    colorPurple:  "Purple",
    colorGreen:   "Green",
    colorOrange:  "Orange",

    // Upload page
    uploadTitle:       "Upload",
    uploadSubtitle:    "What do you want to upload?",
    uploadNotes:       "Notebook entries",
    uploadExam:        "Exam",
    uploadNotesBadge:  "Per image",
    uploadExamBadge:   "AI analysis",
    uploadNotesDesc:   "Multiple photos — each image becomes a separate entry with its own subject and date.",
    uploadExamDesc:    "Multiple photos of one exam — shared subject, teacher and date. AI auto-detects the date.",

    // Dashboard
    dashboardTitle:    "Dashboard",
    dashboardSubtitle: "Your subjects, documents and generated study material.",
    newSubject:        "New subject",
  },
} as const;

export type TranslationKey = keyof typeof translations["en"];
