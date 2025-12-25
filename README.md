# Seelisberg Movement History (static site)

This is a lightweight static website (no build step) to document the history of Maharishi’s Movement in Seelisberg.

## Edit content
- `data/events.json` — timeline entries
- `data/places.json` — places cards
- `data/archive.json` — archive cards

## Replace images
Put images into `assets/` and update the filenames in the JSON.

## Run locally
Open `index.html` in your browser.

If your browser blocks `fetch()` from local files, use a tiny local server:

- Python: `python -m http.server 8000`
- Then open: http://localhost:8000/

## Deploy (GitHub Pages)
1. Create a repo and upload all files/folders
2. Settings → Pages → Deploy from branch (root)
3. Visit the published URL
