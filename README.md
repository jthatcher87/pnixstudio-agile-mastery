# PNiXStudio Agile & Scrum Mastery

Seven-module interactive course with diagrams, flip cards, metrics charts, certification practice, and a five-scenario anti-pattern diagnostic.

## GitHub Pages

Push this repository to GitHub using the main branch. In Settings > Pages > Build and deployment, select GitHub Actions. Run the Deploy course to GitHub Pages workflow from Actions. Subsequent pushes to main deploy automatically.

The workflow publishes only site/. Relative asset paths and PWA scope support repository-based GitHub Pages URLs.

## Local preview

Run `python -m http.server 8766 --directory site` from the repository.

The app includes locally bundled scripts, fonts, video, a still-image fallback, and an offline service worker. Progress is stored in this browser. No API key, database or build step is required.

## Assets

The background derives from the supplied Adobe Stock video. The original large MOV is not included. Third-party libraries and icons retain their respective licenses. No blanket license is applied to this repository.
