# ADR 0002: PWA mit Vite statt Next.js oder Expo

**Status:** angenommen, 2026-11-02

**Kontext:** iPhone zuerst, Android später, vorerst kein App Store, Entwicklung auf Windows ohne Mac.

**Entscheidung:** PWA mit Vite, React Router und `vite-plugin-pwa`. Für den App Store verpackt später Capacitor denselben statischen Build.

**Gründe:**
- Die App liegt komplett hinter dem Login und braucht weder SEO noch Server-Rendering.
- Module können Routen als Daten beisteuern.
- Der Browser spricht direkt mit Supabase, abgesichert durch RLS. Serverlogik liegt in Edge Functions.
- Expo würde auf Windows für iOS einen Cloud-Build erfordern und die Oberfläche binden.

**Folgen:** Push geht auf iOS erst nach Homescreen-Installation, ab iOS 16.4. Es gibt keinen Background Sync. Playwright WebKit ersetzt kein iOS-Safari, deshalb gehört zu jedem Release ein kurzer Handtest auf dem iPhone.
