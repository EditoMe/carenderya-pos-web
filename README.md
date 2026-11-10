# KusinaHub    A Web-Based Carenderia Management

A working single-page POS for a carinderia, built with the course's **View
framework** in plain JavaScript (ES modules, strict MVC). Same functionality as
the team's React Native prototype: menu grid with real dish photos, live order
summary with tax/discount, checkout with cash validation, orders queue, sales
history, menu availability, and a PIN-gated admin area (photos, add / edit-price
/ remove products, PIN change). Data persists in `localStorage`.

## Run it

```bash
# from this folder — any static server works (ES modules need http(s), not file://)
npx serve .
# or: python -m http.server 8080
```

Then open `http://localhost:3000` (serve) / `http://localhost:8080` (python).
Default admin PIN: `1234`.

## Folder structure

```
carenderya-pos-web/
├── index.html
│   └── style.css               # all styling
├── js/
│   ├── model.js                # ONE exported state object + mutating functions
│   ├── controller.js           # wires views ↔ model (the only layer that imports both)
│   └── views/
│       ├── View.js             # base View class (render(data) + _bindHandlers)
│       ├── NavView.js          # Member 1 — left nav rail
│       ├── PosView.js          # Member 1 — POS terminal + order summary
│       ├── OrdersView.js       # Member 2 — orders queue + order detail
│       ├── CheckoutView.js     # Member 2 — payment form + validation error
│       ├── HistoryView.js      # Member 2 — sales history
│       ├── MenuView.js         # Member 3 — menu availability toggles
│       └── AdminView.js        # Member 3 — PIN gate + products + photos + PIN change
└── assets/images/dishes/       # Figma prototype dish photos
```

## MVC rules
- **Model** holds all data in one exported `state` object; functions mutate it
  and persist to `localStorage`. Never touches the DOM.
- **Views** extend `View`, build markup from the data they receive, and expose
  handler methods the controller subscribes to (`addHandlerXxx`). They never
  import the model.
- **Controller** imports the model and the views, and is the only layer that
  talks to both: view handler → controller function → model update →
  view re-render. No inline `onclick` anywhere.

## Deploy

Push this folder to a public GitHub repo and enable **Settings → Pages →
Deploy from branch → `/ (root)`**. The live link then works with no build step.
