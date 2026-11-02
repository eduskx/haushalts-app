# Design-Prinzipien

Prüfe jede Design- und Produktentscheidung gegen diese sieben Prinzipien. Fällt eine Prüffrage durch, ändere den Entwurf oder lege dem Nutzer die Abweichung vor. Die Belege stehen in [research.md](research.md), die messbaren Regeln in [hig-checklist.md](hig-checklist.md).

Stehen zwei Prinzipien im Streit, gewinnt das mit der kleineren Nummer.

## 1. Zusammen, nie gegeneinander

Die App vergleicht zwei Menschen nicht. Sie zeigt, was geschehen ist, und rechnet es niemandem vor.

- **Prüffrage:** Kann jemand aus diesem Screen oder dieser Abfrage eine Summe, Quote oder Rangfolge pro Person ablesen?
- **Besteht:** "Mika hat die Milch gekauft" im Verlauf. Ein Tier, das für beide wächst.
- **Fällt durch:** Wochenbilanz je Person, Rangliste, Punkte gegen Gefälligkeiten, "Du hast 3 Aufgaben weniger erledigt".
- **Beleg:** Scorekeeping geht in einer deutschen Panelstudie mit sinkender Zufriedenheit einher (korrelativ, eine Studie zu Chore-Apps fehlt).

## 2. Auslassen kostet nichts

Nach einer Pause ist alles noch da. Fortschritt wächst und schrumpft nie.

- **Prüffrage:** Was sieht ein Paar, das 14 Tage nicht in der App war? Hat sich irgendetwas verschlechtert?
- **Besteht:** Nach der Pause wartet eine kleine Überraschung. Überfällige Aufgaben rutschen in der Liste nach oben, ohne Rot und ohne Zähler.
- **Fällt durch:** Streaks, Paar-Streaks, verstaubte Räume, ein trauriges Tier, "Du warst lange nicht hier".
- **Beleg:** Finch und Neko Atsume gegen die Duolingo-Kritik. Web-Push läuft auf iOS laut Berichten teils still ab, ein Streak würde also auch technisch scheitern.

## 3. Erst nützlich, dann niedlich

Im Supermarkt, einhändig und bei schlechtem Empfang, zählt nur die Liste. Niedlichkeit wartet, bis du Zeit hast.

- **Prüffrage:** Lässt sich die Haupthandlung dieses Screens mit einem Daumen, ohne Warten auf eine Animation und offline erledigen?
- **Besteht:** Abhaken wirkt sofort, die nächste Zeile ist sofort tippbar.
- **Fällt durch:** Eine Feier-Animation sperrt die Liste. Der Charakter steht zwischen dir und der Einkaufsliste.
- **Beleg:** Apple verlangt nicht blockierende Animation und kein Extra-Motion bei häufigen Aktionen. Bei Paired wirken Inhalte, die ausgehen, gegen die Bindung, Einkauf geht nie aus.

## 4. Niedlich für Erwachsene

Die Figur tut Alltägliches, der Text redet wie ein Mensch. Niemand wird betreut oder gelobt wie ein Kind.

- **Prüffrage:** Würdest du diesen Satz so zu einer erwachsenen Person sagen? Tut die Figur gerade etwas aus eurem echten Alltag?
- **Besteht:** "Noch zwei Dinge für heute. Oder morgen." Die Figur hält die Einkaufstasche oder eine Tasse.
- **Fällt durch:** "Yay, super gemacht!", Babysprache, Figur allein mit riesigen Augen, Konfetti für Müll rausbringen.
- **Beleg:** Dies ist eine Hypothese. Die Forschung erklärt Niedlichkeit, nicht die Grenze zum Kindischen. Deshalb entscheidet der Nutzer an zwei Gates und Paare im Test. Agenten dürfen hier nichts freigeben.

## 5. Auch die Arbeit im Kopf zählt

Wer plant und erinnert, arbeitet. Die App macht das sichtbar, statt nur das Erledigen zu sehen.

- **Prüffrage:** Lässt sich "Termin im Blick behalten" oder "Essen für die Woche planen" als Aufgabe mit Besitzer anlegen, genauso leicht wie "Bad putzen"?
- **Besteht:** Eine Aufgabe umfasst Planen, Erinnern und Tun und gehört einer Person, bis sie sie abgibt.
- **Fällt durch:** Die App erinnert immer dieselbe Person daran, die andere zu erinnern.
- **Beleg:** Daminger 2019 zu kognitiver Arbeit, Rodskys Fair Play (Interviews, kein Peer-Review).

## 6. Wie iOS benehmen, nicht wie iOS verkleiden

Tab Bar, Sheets, Größen und Gesten folgen Apples Gewohnheiten. Was Safari nicht kann, baust du einfacher und ehrlich.

- **Prüffrage:** Weiß eine iPhone-Nutzerin ohne Erklärung, wie sich das bedienen lässt? Täuscht dieser Screen einen Systemeffekt vor, der nicht funktioniert?
- **Besteht:** Blur mit Kontur als Glas-Annäherung, eigene Icons, `ui-serif` und `system-ui` als Systemverweise.
- **Fällt durch:** SF Symbols oder gebündelte SF-Dateien, nachgebaute Lichtbrechung, Tabs als Aktionen, Abhängigkeit von Haptik.
- **Beleg:** HIG, und die PWA-Grenzen in research.md.

## 7. Geht allein und geht ohne Push

Person 1 kann starten, bevor Person 2 da ist. Die App bleibt nützlich, wenn eine Benachrichtigung nie ankommt, und bleibt meist still.

- **Prüffrage:** Was sieht Person 1, solange Person 2 fehlt? Was geht verloren, wenn dieser Push nie ankommt? Wäre die Nachricht in Ordnung, käme sie direkt vom Partner?
- **Besteht:** Charakter einrichten ist sofort möglich, die Einladung bleibt in Home und Profil erreichbar. Push ergänzt, was du beim Öffnen sowieso siehst.
- **Fällt durch:** Leerer Wartebildschirm, Erinnerungen im Namen des Partners, Push-Erlaubnis vor dem ersten Nutzen.
- **Beleg:** Cupla-Kritik zu Reminder-Abhängigkeit, Push nur für installierte Web-Apps, kein Install-Prompt auf iOS.
