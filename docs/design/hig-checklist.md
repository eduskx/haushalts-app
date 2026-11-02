# HIG-Checkliste für den Reviewer

Prüfe UI-Änderungen gegen diese Regeln und nenne im Urteil die Regel-ID. Nur die betroffenen Abschnitte prüfen. Die Belege stehen in [research.md](research.md).

**Stufe:** `Muss` blockiert den Merge. `Soll` geht als Hinweis ins Urteil.

**Prüfweg:**
- `Code`: im Diff lesbar oder per Suche prüfbar
- `Browser`: per Playwright in iPhone-Größe messbar
- `iPhone`: nur auf dem echten Gerät prüfbar, gehört in die Release-Checkliste. Der Reviewer meldet es als offen und gibt es nicht frei.

**Herkunft:** `Apple` aus der HIG. `WCAG` aus WCAG 2.2. `Quelle` aus Drittquelle. `Projekt` hat dieses Projekt festgelegt, Apple nennt dazu keinen Wert. Wer eine `Projekt`-Regel ändert, ändert nur diese Datei.

**Einheiten:** 1 pt aus der HIG entspricht auf dem iPhone 1 CSS px. Prüfe bei Standard-Textgröße.

**Testbreiten:** 320, 390 und 440 px Breite. 320 x 693 ist der schmalste Fall (Display-Zoom).

## Navigation

| ID | Regel | Wert | Stufe | Prüfweg | Herkunft |
|---|---|---|---|---|---|
| NAV-1 | Anzahl Tabs | 3 bis 5 | Muss | Code | Apple für höchstens 5, Projekt für mindestens 3 |
| NAV-2 | Tabs führen zu Bereichen und lösen keine Aktion aus | Kein Tab "Hinzufügen" | Muss | Code | Apple |
| NAV-3 | Tab Bar bleibt beim Bereichswechsel sichtbar, außer in modalen Ansichten | | Muss | Browser | Apple |
| NAV-4 | Tab nie deaktiviert oder ausgeblendet. Leerer Bereich erklärt den Grund | Auch vor dem Einzug | Muss | Code | Apple |
| NAV-5 | Tab-Label ist ein einzelnes Wort | | Soll | Code | Apple |
| NAV-6 | Badge nur für kritische Information | Kein Badge für "neues Foto" | Muss | Code | Apple |
| NAV-7 | Jede Unterseite hat einen sichtbaren Zurück-Button | | Muss | Browser | Projekt |
| NAV-8 | Keine Web-Nachbildung von Tab-Bar-Minimieren | | Soll | Code | Projekt |

## Sheets

| ID | Regel | Wert | Stufe | Prüfweg | Herkunft |
|---|---|---|---|---|---|
| SHT-1 | Höchstens ein Sheet zur selben Zeit | | Muss | Browser | Apple |
| SHT-2 | Größen: Medium etwa halbe Höhe, Large voll | 45 bis 55 % der Viewport-Höhe für Medium | Muss | Browser | Apple, Toleranz Projekt |
| SHT-3 | Grabber in jedem Sheet mit mehreren Größen, per Tippen bedienbar, mit Screenreader-Name | | Muss | Browser | Apple |
| SHT-4 | Abbrechen links, Fertig rechts. Fertig nie allein. Zurück schließt nie | | Muss | Browser | Apple |
| SHT-5 | Wischen nach unten schließt. Bei ungesicherten Änderungen kommt erst eine Rückfrage | | Muss | Browser | Apple |
| SHT-6 | Lange oder mehrstufige Abläufe als Vollbild statt als Sheet | Charakter-Editor, Einzug | Soll | Code | Apple |
| SHT-7 | Sheet mit Texteingabe bleibt bei offener Tastatur bedienbar | | Muss | iPhone | Projekt |

## Listen

| ID | Regel | Wert | Stufe | Prüfweg | Herkunft |
|---|---|---|---|---|---|
| LST-1 | Zeilenhöhe | mindestens 44 px, wächst mit der Schrift | Muss | Browser | Projekt, aus TGT-1 |
| LST-2 | Gruppen mit Header oder Abstand trennen | | Soll | Browser | Apple |
| LST-3 | Chevron nur bei Zeilen, die zu einer Unterseite führen | | Muss | Code | Apple |
| LST-4 | Abhaken wirkt beim Tippen sofort, auch offline | sichtbar unter 100 ms | Muss | Browser | Projekt |
| LST-5 | Jede Aktion aus einer Wischgeste geht auch ohne Wischen | | Muss | Code | Projekt |
| LST-6 | Innenradius folgt der Formel: äußerer Radius minus Innenabstand | Keine freien Radien | Soll | Code | Apple |

## Touch-Ziele

| ID | Regel | Wert | Stufe | Prüfweg | Herkunft |
|---|---|---|---|---|---|
| TGT-1 | Tippbare Fläche | mindestens 44 x 44 px | Muss | Browser | Apple |
| TGT-2 | Ausnahme für kleine Ziele, im PR begründet | nie unter 28 x 28 px | Muss | Browser | Apple |
| TGT-3 | Abstand um Elemente mit sichtbarem Rahmen oder Fläche | etwa 12 px | Soll | Browser | Apple |
| TGT-4 | Abstand um Elemente ohne sichtbaren Rahmen | etwa 24 px | Soll | Browser | Apple |
| TGT-5 | Haupthandlung liegt in der unteren Bildschirmhälfte | | Soll | Browser | Projekt |

## Layout und Safe Areas

| ID | Regel | Wert | Stufe | Prüfweg | Herkunft |
|---|---|---|---|---|---|
| SAF-1 | Viewport-Meta enthält `viewport-fit=cover` | | Muss | Code | Quelle |
| SAF-2 | Oben, unten und seitlich `env(safe-area-inset-*)` mit Fallback | Keine festen 34 oder 62 | Muss | Code | Apple für die Pflicht |
| SAF-3 | Volle Höhen nutzen `dvh` oder `svh` | Kein `100vh` | Muss | Code | Projekt |
| SAF-4 | Hintergrund läuft unter die Leisten, Inhalt und Bedienelemente nicht | | Muss | iPhone | Apple |
| SAF-5 | Keine waagerechte Seitenscroll-Leiste | bei 320 px Breite | Muss | Browser | Projekt |
| SAF-6 | Tastatur öffnen und schließen verschiebt keine fixierten Leisten | | Muss | iPhone | Quelle |
| SAF-7 | Statusleiste über `theme-color` in beiden Modi, nicht über `apple-mobile-web-app-status-bar-style` allein | | Soll | Code | Quelle |

## Schrift und Dynamic Type

| ID | Regel | Wert | Stufe | Prüfweg | Herkunft |
|---|---|---|---|---|---|
| TYP-1 | Fließtext im Standard | 17 px, Zeilenhöhe 22 px, bei iOS-Standardgröße | Muss | Browser | Apple |
| TYP-2 | Kleinste Schrift | 11 px | Muss | Browser | Apple |
| TYP-3 | Schriftgrößen in `rem` oder `em`, `html` nutzt unter `@supports` `font: -apple-system-body` | Kein `font-size` in `px` | Muss | Code | Quelle |
| TYP-4 | Layout übersteht 200 % Text ohne abgeschnittene Titel, Tabs und Zahlen | | Muss | Browser | Apple |
| TYP-5 | Schnitte nur Regular bis Bold | `font-weight` 400 bis 800 | Muss | Code | Apple |
| TYP-6 | Stack über Token aus dem Theme, in diesem Muster: `ui-rounded`, selbst gehostete Ersatzschrift, `system-ui`, `sans-serif` | | Muss | Code | Projekt |
| TYP-7 | Keine SF-Schriftdateien im Repo | Suche nach `SF-Pro`, `SFPro`, `SF Rounded` | Muss | Code | Apple |
| TYP-8 | Text und Abstände nutzen die Größenskala: 34, 28, 22, 20, 17, 16, 15, 13, 12, 11 | geteilt durch 17 in `rem` | Soll | Code | Apple |
| TYP-9 | Eingabefelder mit mindestens 16 px, sonst zoomt iOS beim Fokus | | Muss | Browser | Projekt, nicht in der Recherche belegt, auf dem iPhone bestätigen |

## Kontrast und Farbe

| ID | Regel | Wert | Stufe | Prüfweg | Herkunft |
|---|---|---|---|---|---|
| CLR-1 | Text gegen Hintergrund in beiden Modi | mindestens 4,5:1, auch bei großem Text | Muss | Browser (axe) | Apple, Verschärfung Projekt |
| CLR-2 | Kleiner Text in eigenen Farben | 7:1 als Ziel | Soll | Browser | Apple |
| CLR-3 | Rand und Zustand von Bedienelementen | mindestens 3:1 | Muss | Browser | WCAG 1.4.11, nicht in der Recherche belegt |
| CLR-4 | Information nie nur durch Farbe | Häkchen zusätzlich zur Färbung | Muss | Code | Projekt |
| CLR-5 | Farben nur über Tokens. In `packages/` keine Farbwerte | Suche nach `#`, `rgb(`, `hsl(` außerhalb der Theme-Datei | Muss | Code | Projekt |
| CLR-6 | Rot ohne Fehlerbezug unterbleibt | Überfällig ist kein Fehler | Muss | Code | Projekt |
| CLR-7 | `prefers-contrast: more` hebt die Kontraste, sofern unterstützt | | Soll | iPhone | Apple |

## Bewegung

| ID | Regel | Wert | Stufe | Prüfweg | Herkunft |
|---|---|---|---|---|---|
| MOT-1 | Jede `animation` und jeder Übergang über Bewegung hat einen Zweig für `prefers-reduced-motion: reduce` | Loops stoppen, Wege werden Fades | Muss | Code | Apple |
| MOT-2 | Animation sperrt keine Eingabe | Abhaken, Tabs, Sheets | Muss | Browser | Apple |
| MOT-3 | Bewegung ist nie der einzige Informationsträger | | Muss | Code | Apple |
| MOT-4 | Kein Extra-Motion bei häufigen Aktionen | Abhaken höchstens 200 ms | Muss | Code | Apple, Wert Projekt |
| MOT-5 | Haptik nur als Bonus. Kein Code setzt sie voraus | Keine Vibration API als Abhängigkeit | Muss | Code | Quelle |
| MOT-6 | Charakter-Loops laufen nur im sichtbaren Bereich und pausieren bei Reduced Motion | | Soll | Browser | Projekt |

## Glas und Dark Mode

| ID | Regel | Wert | Stufe | Prüfweg | Herkunft |
|---|---|---|---|---|---|
| DRK-1 | Glas nur für Tab Bar und Kopfzeile | Kein Blur auf Karten | Soll | Code | Apple, Projekt |
| DRK-2 | Keine Lichtbrechung über SVG-Filter als `backdrop-filter` | `backdrop-filter: url(` verboten | Muss | Code | Quelle |
| DRK-3 | Leistentext erreicht 4,5:1 auch ohne Blur, auf hellem und dunklem Inhalt | Die App kann Reduce Transparency nicht lesen | Muss | Browser | Quelle, Projekt |
| DRK-4 | Der Modus folgt dem System | Kein App-Schalter | Muss | Code | Apple |
| DRK-5 | Tokens für zwei Hintergründe (Base, Elevated) und vier Textstufen | Sheets und Popover auf Elevated | Muss | Code | Apple |
| DRK-6 | Illustrationen und Charaktere haben eine Dark-Variante oder wirken auf beiden Hintergründen | | Muss | Browser | Projekt |
| DRK-7 | Dunkelmodus ist keine Farbinversion | | Muss | Code | Apple |

## Icons und Lizenzen

| ID | Regel | Wert | Stufe | Prüfweg | Herkunft |
|---|---|---|---|---|---|
| ICN-1 | Keine SF Symbols, weder als Datei noch als Export | | Muss | Code | Quelle |
| ICN-2 | Jede Schrift und jedes Icon-Set hat eine Lizenzdatei im Repo | Lizenz vorab lesen | Muss | Code | Projekt |
| ICN-3 | Schriften selbst gehostet, keine Anfrage an Google Fonts | Suche nach `fonts.googleapis` | Muss | Code | Projekt |
| ICN-4 | Tab-Icons einheitlich, aktiver Tab gefüllt | | Soll | Browser | Apple |
| ICN-5 | Reine Icon-Buttons haben einen Screenreader-Namen | | Muss | Browser (axe) | Projekt |

## PWA

| ID | Regel | Wert | Stufe | Prüfweg | Herkunft |
|---|---|---|---|---|---|
| PWA-1 | Kein Verlass auf `beforeinstallprompt`. Installationsanleitung ist bebildert | | Muss | Code | Quelle |
| PWA-2 | Push-Erlaubnis nur nach einer Nutzergeste und nach dem ersten Nutzen | | Muss | Code | Projekt |
| PWA-3 | Lokale Daten dürfen verschwinden, Supabase bleibt die Quelle | | Muss | Code | Quelle |
| PWA-4 | Keine Abhängigkeit von Widgets oder Background Sync | | Muss | Code | Quelle |
| PWA-5 | Fotos über `<input type="file">` | | Muss | Code | Plan |
| PWA-6 | Das Pairing funktioniert per Code in der App, Link und QR sind Zubringer | | Muss | iPhone | Projekt |

## Bindung und Sprache

Diese Regeln setzen die Prinzipien 1, 2, 4 und 7 um. Geschmacksfragen zur Niedlichkeit prüfst du nicht. Sie liegen beim Nutzer.

| ID | Regel | Wert | Stufe | Prüfweg | Herkunft |
|---|---|---|---|---|---|
| BND-1 | Keine Summe, Quote oder Rangfolge pro Person, auch nicht in einer API oder Abfrage | | Muss | Code | Projekt |
| BND-2 | Keine Streaks, kein Verlust, kein Rückgang | Suche nach `streak`, `decay`, `penalty` | Muss | Code | Projekt |
| BND-3 | Gamification pro Person einzeln abschaltbar | | Muss | Code | Projekt |
| BND-4 | Benachrichtigungen neutral und ohne Schuldgefühle, kein Maskottchen als Mahner | Mahnworte: "vergessen", "schon wieder", "endlich" | Muss | Code | Projekt |
| BND-5 | Keine Werbung in Listen, Partner-Funktionen hinter keiner Bezahlschranke für nur eine Person | | Muss | Code | Projekt |
| BND-6 | Alle Texte aus den Sprachdateien des Moduls, Deutsch mit "du" | | Muss | Code | Plan |
| BND-7 | Texte ohne Babysprache und ohne Ausrufezeichen-Lob | | Soll | Code | Projekt |

## Vor dem Release

Für die Regeln mit Prüfweg `iPhone` gilt die Testliste am Ende von [research.md](research.md). Dort stehen auch die offenen Punkte, die diese Werte noch ändern können: Safe-Area-Fehler unter iOS 26, EU-Status und iOS 27.
