// Version 4.2
let map;

const IMAGE_BASE = "//cdn.wiblin.net/postboxes/images/500w/";

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

  fetch("get_markers.php")
    .then((response) => response.json())
    .then((markers) => {
      markers.forEach((marker) => {
        const latLng = L.latLng(marker.latitude, marker.longitude);

        const popupContent = buildPopup(marker);

        const markerIcon = marker.date ? greenMarkerIcon : redMarkerIcon;
        const clusteredMarker = L.marker(latLng, { icon: markerIcon }).bindPopup(popupContent);

        markersArray.push(clusteredMarker);
        markerClusterGroup.addLayer(clusteredMarker);
      });

      map.addLayer(markerClusterGroup);
    });

  document.getElementById("toggle-clustering").addEventListener("click", toggleClustering);

  let clusteringEnabled = true;

  function toggleClustering() {
    clusteringEnabled = !clusteringEnabled;

    if (clusteringEnabled) {
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
});

function searchPostcode(postcode) {
  const url = `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.status === 200) {
        const result = data.result;
        const latLng = L.latLng(result.latitude, result.longitude);

        map.setView(latLng, 16);
      } else {
        alert("Postcode not found. Please try again.");
      }
    })
    .catch((error) => {
      console.error("Error fetching postcode data:", error);
      alert("An error occurred while searching for the postcode. Please try again.");
    });
}

document.getElementById("search-form").addEventListener("submit", (event) => {
  event.preventDefault();

  const postcode = document.getElementById("search-input").value.trim();
  if (postcode) {
    searchPostcode(postcode);
  }
});
