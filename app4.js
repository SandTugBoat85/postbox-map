// Version 4.1
let map;
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

        let popupContent = "";
        if (marker.image_url) {
          popupContent += `<img src="//cdn.wiblin.net/postboxes/images/500w/${marker.image_url}" width="200" alt="Image of ${marker.ref}" />`;
        }
        popupContent += "<p>";
        if (marker.ref) {
          popupContent += `<b>Ref:</b> ${marker.ref}<br>`;
        }
        if (marker.date) {
          popupContent += `<b>Date:</b> ${marker.date}<br>`;
        }
        if (marker.crediturl && marker.creditname) {
          popupContent += `<b>Credit:<b/> <a href="//${marker.crediturl}" target="_blank">${marker.creditname}</a>`;
        }
        popupContent += "</p>";

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
      markerClusterGroup.eachLayer((layer) => {
        map.addLayer(layer);
      });
      map.removeLayer(markerClusterGroup);
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

