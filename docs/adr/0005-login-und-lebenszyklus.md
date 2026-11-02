# ADR 0005: Passwort-Login, Freischaltung beim Einzug, 30 Tage nach Auszug

**Status:** angenommen, 2026-11-02

**Login:** E-Mail und Passwort. Magic Links öffnen auf iOS Safari statt der installierten PWA, deren Speicher getrennt ist. OTP braucht eigenen Mailversand und damit eine Domain und bleibt später einsteckbar.

**Vor dem Einzug:** Man sieht nur den eigenen Charakter. Alles andere wird mit dem Einzug freigeschaltet. Dadurch gibt es keine Daten zusammenzuführen.

**Auszug:** Jedes Mitglied kann allein ausziehen. Die gemeinsamen Daten und Fotos bleiben 30 Tage nur lesbar, damit man sie sichern oder wieder einziehen kann. Danach löscht ein geplanter Job sie endgültig, einschließlich der Dateien im Storage.

**Folgen:** Das Einfrieren ist ein Zustand von `spaces`, den die Policies aller Module über den RLS-Vertrag beachten. Eine offene Registrierung bräuchte zusätzlich Datenschutzerklärung, Impressum, Kontolöschung und Datenexport.
