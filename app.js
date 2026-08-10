// Version 4.3
let map;

const IMAGE_BASE = "//cdn.wiblin.net/postboxes/images/500w/";
const CLUSTER_PREFERENCE_KEY = "postboxes:cluster";

// localStorage throws in Safari private browsing and wherever storage is
// blocked, so reads and writes are guarded and fall back to the default.
function readClusterPreference() {
  try {
    const stored = window.localStorage.getItem(CLUSTER_PREFERENCE_KEY);
    return stored === null ? null : stored === "true";
  } catch (error) {
    return null;
  }
}

function writeClusterPreference(enabled) {
  try {
    window.localStorage.setItem(CLUSTER_PREFERENCE_KEY, String(enabled));
  } catch (error) {
    // The preference just will not persist; nothing else to do.
  }
}

// Only http(s) links are allowed out of the credit field. crediturl is stored
// without a scheme ("twitter.com/KevinWiblin"), so it is resolved against the
// current page as a protocol-relative URL.
function creditLinkHref(crediturl) {
  try {
    const url = new URL(`//${crediturl}`, window.location.href);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch (error) {
    return null;
  }
}

// Popups are assembled from DOM nodes rather than concatenated HTML, so
// database values are always inserted as text and can never become markup.
function buildPopup(marker) {
  const popup = document.createElement("div");

  if (marker.image_url) {
    const image = document.createElement("img");
    image.src = IMAGE_BASE + encodeURIComponent(marker.image_url);
    image.width = 200;
    image.alt = marker.ref ? `Image of ${marker.ref}` : "Image of a postbox";
    popup.appendChild(image);
  }

  const details = document.createElement("p");

  const addField = (label, value) => {
    const name = document.createElement("b");
    name.textContent = `${label}:`;
    details.appendChild(name);
    details.appendChild(document.createTextNode(` ${value}`));
    details.appendChild(document.createElement("br"));
  };

  if (marker.ref) {
    addField("Ref", marker.ref);
  }
  if (marker.date) {
    addField("Date", marker.date);
  }

  const creditHref = marker.crediturl ? creditLinkHref(marker.crediturl) : null;
  if (creditHref && marker.creditname) {
    const name = document.createElement("b");
    name.textContent = "Credit:";
    details.appendChild(name);

    const link = document.createElement("a");
    link.href = creditHref;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = marker.creditname;

    details.appendChild(document.createTextNode(" "));
    details.appendChild(link);
  }

  popup.appendChild(details);

  return popup;
}
document.addEventListener("DOMContentLoaded", function () {
  map = L.map("map").setView([51.7520, -1.2577], 10);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  const redMarkerIcon = L.icon({
    iconUrl: 'icons/postbox-pin-red.svg',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  });

  const greenMarkerIcon = L.icon({
    iconUrl: 'icons/postbox-pin-green.svg',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -41],
  });

  const markerClusterGroup = L.markerClusterGroup();
  const markersArray = [];

  const clusterToggle = document.getElementById("cluster-toggle");
  const markerSummary = document.getElementById("marker-summary");

  // Restore the saved choice before any markers arrive, so the first render
  // already matches it rather than visibly re-arranging.
  const storedPreference = readClusterPreference();
  if (storedPreference !== null) {
    clusterToggle.checked = storedPreference;
  }

  clusterToggle.addEventListener("change", () => {
    applyClustering(clusterToggle.checked);
    writeClusterPreference(clusterToggle.checked);
  });

  fetch("get_markers.php")
    .then((response) => response.json())
    .then((markers) => {
      markers.forEach((marker) => {
        const latLng = L.latLng(marker.latitude, marker.longitude);

        const popupContent = buildPopup(marker);

        const markerIcon = marker.date ? redMarkerIcon : greenMarkerIcon;
        const clusteredMarker = L.marker(latLng, { icon: markerIcon }).bindPopup(popupContent);

        markersArray.push(clusteredMarker);
      });

      // applyClustering is the only place markers are attached, so they are
      // never added to the cluster group twice. That matters before the group
      // is on the map, where markercluster queues additions without a
      // duplicate check.
      applyClustering(clusterToggle.checked);
      showSummary(markers.length);
    })
    .catch((error) => {
      console.error("Could not load markers:", error);
      markerSummary.textContent = "Could not load postboxes.";
    });

  function applyClustering(enabled) {
    if (enabled) {
      markersArray.forEach((marker) => {
        map.removeLayer(marker);
        markerClusterGroup.addLayer(marker);
      });
      map.addLayer(markerClusterGroup);
    } else {
      map.removeLayer(markerClusterGroup);
      markersArray.forEach((marker) => {
        map.addLayer(marker);
      });
    }
  }

  function showSummary(count) {
    markerSummary.textContent = "";
    const total = document.createElement("b");
    total.textContent = String(count);
    markerSummary.appendChild(total);
    markerSummary.appendChild(
      document.createTextNode(count === 1 ? " postbox bagged" : " postboxes bagged")
    );
  }
});

/* ------------------------------------------------------------------ search */

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchClear = document.getElementById("search-clear");
const searchSubmit = document.getElementById("search-submit");
const searchStatus = document.getElementById("search-status");

// Feedback appears inline beneath the field instead of in a blocking alert().
// The element is aria-live, so screen readers announce it without a focus move.
function setSearchStatus(message, tone) {
  if (!message) {
    searchStatus.hidden = true;
    searchStatus.textContent = "";
    searchStatus.removeAttribute("data-tone");
    return;
  }

  searchStatus.textContent = message;
  searchStatus.dataset.tone = tone;
  searchStatus.hidden = false;
}

function setSearchBusy(busy) {
  searchForm.dataset.busy = String(busy);
  searchSubmit.disabled = busy;
}

function searchPostcode(postcode) {
  setSearchBusy(true);
  setSearchStatus("");

  fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.status === 200 && data.result) {
        map.setView(L.latLng(data.result.latitude, data.result.longitude), 16);
        setSearchStatus(`Showing ${data.result.postcode}`, "success");
      } else {
        setSearchStatus("No match for that postcode.", "error");
      }
    })
    .catch((error) => {
      console.error("Error fetching postcode data:", error);
      setSearchStatus("Could not reach the postcode service.", "error");
    })
    .finally(() => setSearchBusy(false));
}

searchInput.addEventListener("input", () => {
  searchClear.hidden = searchInput.value === "";
  if (searchStatus.dataset.tone === "error") {
    setSearchStatus("");
  }
});

searchClear.addEventListener("click", () => {
  searchInput.value = "";
  searchClear.hidden = true;
  setSearchStatus("");
  searchInput.focus();
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const postcode = searchInput.value.trim();
  if (postcode) {
    searchPostcode(postcode);
  }
});

/* ---------------------------------------------------------------- settings */

const settingsModal = document.getElementById("settings-modal");
const settingsOpenButton = document.getElementById("settings-open");
const settingsCloseButton = document.getElementById("settings-close");

function focusableInModal() {
  return settingsModal.querySelectorAll(".modal__panel button, .modal__panel input");
}

// Tab and Shift+Tab wrap within the dialog so focus cannot wander onto the map
// behind it while the modal is open.
function onModalKeydown(event) {
  if (event.key === "Escape") {
    closeSettings();
    return;
  }

  if (event.key !== "Tab") {
    return;
  }

  const focusable = focusableInModal();
  if (focusable.length === 0) {
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function openSettings() {
  settingsModal.hidden = false;
  settingsOpenButton.setAttribute("aria-expanded", "true");
  settingsCloseButton.focus();
  document.addEventListener("keydown", onModalKeydown);
}

function closeSettings() {
  settingsModal.hidden = true;
  settingsOpenButton.setAttribute("aria-expanded", "false");
  document.removeEventListener("keydown", onModalKeydown);
  settingsOpenButton.focus();
}

settingsOpenButton.addEventListener("click", openSettings);
settingsCloseButton.addEventListener("click", closeSettings);

settingsModal.addEventListener("click", (event) => {
  if (event.target.hasAttribute("data-close-modal")) {
    closeSettings();
  }
});
