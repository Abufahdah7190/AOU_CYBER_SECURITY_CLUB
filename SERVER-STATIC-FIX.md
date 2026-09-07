# Server static-file fix

The Express server now:
- Resolves the frontend directory from the actual deployed file layout.
- Serves static assets before any fallback.
- Serves direct `.html` navigation explicitly (including `/profile.html`).
- Returns a real 404 for missing asset-like URLs instead of `index.html`.
- Keeps `/api/*` routes outside the frontend catch-all.

On Render, deploy the repository as the Node web service defined in `render.yaml`.
Do not add a separate `/* -> /index.html` rewrite in front of this service.
