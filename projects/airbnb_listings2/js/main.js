function MainModule(listingsID = "#listings") {
  const me = {};

  const listingsElement = document.querySelector(listingsID);
  const statusEl = document.querySelector("#status");
  const searchInput = document.querySelector("#searchInput");
  const sortSelect = document.querySelector("#sortSelect");
  const favOnly = document.querySelector("#favOnly");

  let allListings = [];
  let favorites = loadFavorites(); // { [id]: true }

  function loadFavorites() {
    try {
      return JSON.parse(localStorage.getItem("airbnb_favorites") || "{}");
    } catch (e) {
      return {};
    }
  }

  function saveFavorites() {
    localStorage.setItem("airbnb_favorites", JSON.stringify(favorites));
  }

  function parseAmenities(listing) {
    // In this dataset, amenities is a JSON string like '["Wifi","Kitchen", ...]'
    // so we need JSON.parse
    try {
      const a = JSON.parse(listing.amenities || "[]");
      return Array.isArray(a) ? a : [];
    } catch (e) {
      return [];
    }
  }

  function parsePrice(priceStr) {
    // "$187.00" -> 187
    const n = Number(String(priceStr || "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function truncate(text, max = 160) {
    const t = String(text ?? "").trim();
    if (!t) return "";
    return t.length > max ? t.slice(0, max).trim() + "…" : t;
  }

  function getBadge(label) {
    return `<span class="badge rounded-pill text-bg-light amenity-badge">${escapeHtml(
      label
    )}</span>`;
  }

  function getListingCode(listing) {
    const name = escapeHtml(listing.name || "Untitled listing");
    const hostName = escapeHtml(listing.host_name || "Unknown host");
    const hostThumb = listing.host_thumbnail_url || "";
    const picture = listing.picture_url || "";
    const price = escapeHtml(listing.price || "");
    const url = listing.listing_url || "#";
    const neighborhood = escapeHtml(listing.neighbourhood_cleansed || listing.neighbourhood || "");

    const rating = listing.review_scores_rating;
    const ratingHtml =
      rating != null
        ? `<span class="badge text-bg-warning rating-badge">⭐ ${Number(rating).toFixed(1)}</span>`
        : "";

    const isSuperhost = listing.host_is_superhost === "t" || listing.host_is_superhost === true;
    const superhostHtml = isSuperhost
      ? `<span class="badge text-bg-success ms-2">Superhost</span>`
      : "";

    const amenities = parseAmenities(listing);
    const topAmenities = amenities.slice(0, 6);
    const remaining = Math.max(0, amenities.length - topAmenities.length);

    const amenityHtml = topAmenities.map(getBadge).join(" ");
    const moreHtml =
      remaining > 0
        ? `<span class="badge rounded-pill text-bg-secondary">+${remaining} more</span>`
        : "";

    const desc = truncate(listing.description, 180);
    const descHtml = desc ? `<p class="card-text text-muted">${escapeHtml(desc)}</p>` : "";

    const id = listing.id;
    const isFav = !!favorites[id];

    return `<div class="col-12 col-md-6 col-lg-4">
      <div class="listing card h-100 shadow-sm">
        <img src="${escapeHtml(picture)}" class="card-img-top listing-thumb" alt="${name}" loading="lazy" />

        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <h5 class="card-title m-0">${name}</h5>
            <button
              class="btn btn-sm ${isFav ? "btn-danger" : "btn-outline-danger"} fav-btn"
              data-id="${escapeHtml(id)}"
              title="Toggle favorite"
              aria-label="Toggle favorite"
              type="button"
            >${isFav ? "♥" : "♡"}</button>
          </div>

          <div class="mt-2 d-flex align-items-center justify-content-between">
            <div class="price fw-semibold">${price}<span class="text-muted"> / night</span></div>
            <div class="d-flex align-items-center">
              ${ratingHtml}
              ${superhostHtml}
            </div>
          </div>

          ${neighborhood ? `<div class="small text-muted mt-1">📍 ${neighborhood}</div>` : ""}

          <div class="host d-flex align-items-center gap-2 mt-3">
            <img class="host-avatar" src="${escapeHtml(hostThumb)}" alt="${hostName}" loading="lazy" />
            <div class="small">
              <div class="text-muted">Host</div>
              <div class="fw-semibold">${hostName}</div>
            </div>
          </div>

          <div class="mt-3">
            ${descHtml}
          </div>

          <div class="amenities mt-auto pt-2">
            <div class="small text-muted mb-1">Amenities</div>
            <div class="d-flex flex-wrap gap-1">
              ${amenityHtml}
              ${moreHtml}
            </div>
          </div>

          <div class="mt-3 d-flex gap-2">
            <a class="btn btn-primary btn-sm" href="${escapeHtml(url)}" target="_blank" rel="noopener">Open on Airbnb</a>
            <button class="btn btn-outline-secondary btn-sm copy-btn" data-url="${escapeHtml(url)}" type="button">Copy link</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  function applyFiltersAndRender() {
    const q = (searchInput?.value || "").trim().toLowerCase();
    const sortMode = sortSelect?.value || "default";
    const favOnlyMode = !!favOnly?.checked;

    let filtered = allListings.slice(0, 50);

    if (q) {
      filtered = filtered.filter((l) => {
        const hay = [
          l.name,
          l.host_name,
          l.neighbourhood_cleansed,
          l.neighbourhood,
          l.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    if (favOnlyMode) {
      filtered = filtered.filter((l) => favorites[l.id]);
    }

    if (sortMode === "priceAsc" || sortMode === "priceDesc") {
      filtered.sort((a, b) => {
        const pa = parsePrice(a.price) ?? 0;
        const pb = parsePrice(b.price) ?? 0;
        return sortMode === "priceAsc" ? pa - pb : pb - pa;
      });
    } else if (sortMode === "ratingDesc") {
      filtered.sort((a, b) => (b.review_scores_rating ?? -1) - (a.review_scores_rating ?? -1));
    }

    listingsElement.innerHTML = filtered.map(getListingCode).join("\n");

    // attach button handlers (delegation)
    listingsElement.querySelectorAll(".fav-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        favorites[id] = !favorites[id];
        saveFavorites();
        applyFiltersAndRender();
      });
    });

    listingsElement.querySelectorAll(".copy-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const url = btn.getAttribute("data-url");
        try {
          await navigator.clipboard.writeText(url);
          btn.textContent = "Copied!";
          setTimeout(() => (btn.textContent = "Copy link"), 900);
        } catch (e) {
          alert("Could not copy. Your browser blocked clipboard access.");
        }
      });
    });

    statusEl.textContent = `Showing ${filtered.length} listing(s)`;
  }

  async function loadData() {
    try {
      statusEl.textContent = "Loading JSON…";
      const res = await fetch("./airbnb_sf_listings_500.json");
      const listings = await res.json();

      allListings = Array.isArray(listings) ? listings : [];
      applyFiltersAndRender();

      // wire UI events
      searchInput?.addEventListener("input", applyFiltersAndRender);
      sortSelect?.addEventListener("change", applyFiltersAndRender);
      favOnly?.addEventListener("change", applyFiltersAndRender);
    } catch (err) {
      console.error(err);
      statusEl.textContent =
        "Failed to load the JSON. Make sure airbnb_sf_listings_500.json is in the same folder as index.html.";
    }
  }

  me.loadData = loadData;
  return me;
}

const main = MainModule();
main.loadData();