export const de = {
  "app.name": "Haushalts-App",
  "app.shortName": "Haushalt",
  "home.title": "Willkommen",
  "home.intro": "Hier entsteht eure Haushalts-App.",
  "notFound.title": "Seite nicht gefunden",
  "notFound.body": "Diese Adresse gibt es nicht.",
  "notFound.back": "Zur Startseite",
} as const;

export type TextKey = keyof typeof de;
