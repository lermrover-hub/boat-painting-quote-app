# Boat Painting Area & Quotation Calculator

Mobile-first PWA MVP for Ocean Rover Marina / boat yard staff to estimate boat painting area, manage rate cards, calculate costs, apply VAT, and generate quotation summaries.

## Features

- React + TypeScript + Vite + Tailwind CSS
- Offline-ready PWA with manifest and service worker
- Local storage persistence, no backend or login required
- Boat information, area calculator, rate card CRUD, cost calculator, VAT/settings, quotation preview
- Editable VAT, editable waste factor, default seed data, and sample boat calculation
- Print-friendly quotation view

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Open the local URL shown by Vite. On a phone connected to the same network, open the network URL shown by Vite and use the browser install option to add the app to the home screen.

## Build

```bash
npm run build
```

## Data

The MVP stores settings, rate card items, and saved calculations in browser local storage. Use the Settings screen to edit VAT and company defaults. Data remains available after refresh on the same browser/device.
