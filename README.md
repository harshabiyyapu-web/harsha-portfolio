# Harsha Biyyapu — Portfolio

A responsive portfolio with an on-demand GeoPulse live preview, interactive physics skills, photo gallery, certificate viewer, and consent-based Meta Pixel analytics.

The design uses bold condensed type (Anton) with Inter Tight, rounded colour panels on black, outlined pills, sticker illustrations (`assets/stickers/`), and springy motion. `motion.js` drives Lenis smooth scrolling and GSAP (ScrollTrigger, SplitText, Draggable, Inertia) effects; all of it reverts when the footer Motion toggle is off or the visitor prefers reduced motion. Libraries are self-hosted in `assets/vendor/`.

## Local preview

```sh
npm install
npm start
```

Open http://localhost:4173.

## Validate and build

```sh
npm run check
npm run build
```

Static output is written to `dist/`. Hosting configuration for ChatGPT Sites lives in `.openai/hosting.json`.

## Content

Personal photos are in `assets/gallery/`; captions and slideshow settings are in `app.js`. GeoPulse opens in an embedded viewer with a direct-site fallback. External websites may restrict embedded authentication or navigation.

Meta Pixel `4665609720376690` loads only after analytics consent. Tracking is disabled on localhost and respects Global Privacy Control / Do Not Track. No Conversions API or advanced matching is configured.

Personal photographs, certificates, and project media belong to their respective owners. Institutional logos are used for identification. Font and library licenses are retained under `assets/licenses/`.
