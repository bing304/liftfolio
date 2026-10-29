# Liftfolio

Minimalistischer Kraft-Tracker: Sätze eintragen, Kraft als Chart sehen, nur mit dir selbst vergleichen. Kein Abo, kein Konto, keine Werbung, alle Daten auf dem Gerät.

- App: `src/app.html` (eine Datei, Vanilla JS, eigene SVG-Charts)
- iOS: Capacitor 8 (Swift Package Manager), nur iPhone
- Build und Upload: Codemagic (`codemagic.yaml`), ohne eigenen Mac

Lokal bauen (Node 22+):

```
npm install
npm run build        # src/app.html -> www/ (Schrift lokal, offline)
npx cap sync ios     # www/ ins iOS-Projekt kopieren
```

Schrift: Manrope, SIL Open Font License (`www/fonts/OFL.txt`).

## Web-App zum Testen (passwortgeschützt)

Liegt unter `docs/app/` und ist über GitHub Pages erreichbar: `https://bing304.github.io/liftfolio/app/`.
Die App-Seite ist mit AES-256 verschlüsselt, das Passwort steht nirgends im Repo. Nach Änderungen an `src/app.html` neu bauen:

```
LF_WEB_PASSWORD='…' npm run webapp
```

Hinweis: Das schützt nur die laufende Testversion, nicht den Quellcode (das Repo ist öffentlich).

