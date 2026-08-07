# Postbox Map

A Leaflet map of UK postboxes that have been visited and photographed
("bagged"). Live at <https://www.wiblin.uk/postboxes/>.

Each marker is a postbox. Clicking one opens a popup with the photograph, the
Royal Mail box reference, the date it was bagged, and a credit link.

## Stack

Deliberately plain — no build step, no package manager, no framework.

- **Frontend:** vanilla JavaScript with [Leaflet](https://leafletjs.com/) 1.7.1
  and [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster)
  1.4.1, both loaded from unpkg. Tiles from OpenStreetMap.
- **Backend:** a single PHP endpoint reading from MySQL.
- **Photos:** served from `cdn.wiblin.net`, not from this repository.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page shell, styles, postcode search form, clustering toggle |
| `app.js` | Map setup, marker rendering, popups, postcode search |
| `get_markers.php` | The only endpoint the frontend calls; returns markers as JSON |
| `config.example.php` | Template for database credentials |
| `schema.sql` | Table definition and a couple of example rows |
| `icons/` | Red and green map pins |

Not tracked in git, but present in a working deployment:

- `config.php` — real credentials, created from `config.example.php`
- `images/` — local copies of the photographs (the site loads them from the CDN)
- `csv/` — scratch tooling used to gather postbox locations, described below

## Setup

1. Create the database and table:

   ```sh
   mysql -u root -p -e "CREATE DATABASE image_map_db \
     CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
   mysql -u root -p image_map_db < schema.sql
   ```

2. Create the application user. Grant it access to this database only, and use
   a real password:

   ```sql
   CREATE USER 'image_map_user'@'localhost' IDENTIFIED BY 'a-real-password';
   GRANT SELECT, INSERT, UPDATE, DELETE ON image_map_db.* TO 'image_map_user'@'localhost';
   ```

3. Copy the config template and fill in the same credentials:

   ```sh
   cp config.example.php config.php
   ```

   `config.php` is git-ignored and must stay that way. It returns an array and
   prints nothing, so requesting it over HTTP yields an empty response — but it
   still sits inside the document root, so it is only as private as your PHP
   handler is reliable. Moving it above the web root and adjusting the
   `require` in `get_markers.php` is the sturdier arrangement.

4. Serve the directory with PHP available. There is nothing to build.

MySQL should listen on `127.0.0.1` only; nothing here needs it exposed.

## How markers work

`get_markers.php` returns every row as JSON. `app.js` draws each one into a
marker cluster group and picks the pin colour from whether the row has a date:

- **Green** — bagged. Has a `date`, and usually an `image_url`.
- **Red** — a known location that has not been visited yet.

**A quirk worth knowing:** the query in `get_markers.php` filters on
`WHERE date > '1970-01-01'`, so rows without a date never reach the browser.
Every marker the map receives therefore has a date and renders green, and the
red pin is currently unreachable. The `markers` table does hold unvisited
locations — they simply are not published. Dropping the `WHERE` clause would
put them on the map in red.

The **Toggle Clustering** button switches between clustered and individual
markers. The search box geocodes a UK postcode through
[postcodes.io](https://postcodes.io/) and recentres the map.

## Where the data came from

The `csv/` directory holds one-off scripts used to assemble the postbox list.
They are not part of the running site and are not tracked in git, but they
document the provenance:

- Overpass API queries for `amenity=post_box` within a named county or a
  postcode-district bounding box, output as JSON, CSV or an HTML table.
- `convert.php`, which reprojects Royal Mail eastings and northings from
  OSGB36 (EPSG:27700) to WGS84 latitude/longitude (EPSG:4326) using
  [proj4php](https://github.com/proj4php/proj4php).

### Data licensing

The MIT license below covers the code in this repository. It does not, and
cannot, relicense the underlying location data:

- Coordinates derived from OpenStreetMap are
  © OpenStreetMap contributors, available under the
  [Open Database License](https://www.openstreetmap.org/copyright) (ODbL).
  Reusing them carries attribution and share-alike obligations.
- Box references and collection times originate from Royal Mail data. Check
  their terms before redistributing.
- The photographs are © Kevin Wiblin and are not covered by the MIT license.

## Known rough edges

- Leaflet is pinned to 1.7.1 from a CDN with no integrity hash.
- `get_markers.php` returns the whole table on every request. Fine at a few
  hundred markers; it would want paging or bounding-box filtering well before
  a few thousand.

## License

[MIT](LICENSE) — see the data licensing note above for the important caveat.
