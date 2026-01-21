# Airbnb Listings (AJAX + Bootstrap)

A simple demo page that loads the **first 50** Airbnb listings from a local JSON file using **JavaScript fetch + await** and renders them as Bootstrap cards.

## Live Demo
👉 https://code-blank01.github.io/web-dev-class/projects/airbnb_listings2/

## Features
- Loads listings from `airbnb_sf_listings_500.json` via `fetch()`
- Displays: name, description, amenities, host name + photo, price, thumbnail
- Creative additions:
  - Favorites (saved in localStorage)
  - Search + sorting (price/rating)
  - Copy listing link button

## How to run locally
Open `index.html` using a local server (recommended).

Example:
```bash
npx http-server