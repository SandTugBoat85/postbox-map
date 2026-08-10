<?php
$configPath = __DIR__ . '/config.php';
$config = is_readable($configPath) ? require $configPath : [];

$site = ($config['site'] ?? []) + [
    'title'        => 'Postbox Map',
    'description'  => 'A map of postboxes',
    'url'          => '',
    'image_base'   => '',
    'social_image' => '',
    'twitter'      => '',
];
$mapStart = ($config['map'] ?? []) + ['lat' => 51.7520, 'lng' => -1.2577, 'zoom' => 10];

// Everything interpolated into the markup goes through this.
$e = fn($v) => htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8');

// Handed to app.js. The HEX flags stop any value closing the script element.
$clientConfig = json_encode(
    ['imageBase' => $site['image_base'], 'map' => $mapStart],
    JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES
);
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <title><?= $e($site['title']) ?></title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="title" content="<?= $e($site['title']) ?>">
    <meta name="description" content="<?= $e($site['description']) ?>">
    <link rel="icon" href="icons/postbox-pin-red.svg" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css" />

    <!-- Facebook and Twitter integration -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="<?= $e($site['title']) ?>" />
    <meta property="og:image" content="<?= $e($site['social_image']) ?>" />
    <meta property="og:url" content="<?= $e($site['url']) ?>" />
    <meta property="og:site_name" content="<?= $e($site['title']) ?>" />
    <meta property="og:description" content="<?= $e($site['description']) ?>" />
<?php if ($site['twitter'] !== ''): ?>
    <meta name="twitter:title" content="<?= $e($site['title']) ?>" />
    <meta name="twitter:image" content="<?= $e($site['social_image']) ?>" />
    <meta name="twitter:url" content="<?= $e($site['url']) ?>" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:description" content="<?= $e($site['description']) ?>" />
    <meta name="twitter:site" content="<?= $e($site['twitter']) ?>">
    <meta name="twitter:creator" content="<?= $e($site['twitter']) ?>">
<?php endif; ?>
    <link rel="canonical" href="<?= $e($site['url']) ?>" />
    <meta name="theme-color" content="#da202a" />
    <link rel="stylesheet" href="styles.css" />
    <script>window.POSTBOX_CONFIG = <?= $clientConfig ?>;</script>
</head>

<body>
    <div id="map"></div>

    <form class="search" id="search-form" role="search" autocomplete="off" data-busy="false">
        <div class="search__field">
            <svg class="search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.6-3.6" />
            </svg>
            <input class="search__input" type="search" id="search-input" placeholder="Search a postcode"
                aria-label="Search by postcode" enterkeyhint="search" spellcheck="false" />
            <button class="search__clear" type="button" id="search-clear" aria-label="Clear search" hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"
                    aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                </svg>
            </button>
            <button class="search__go" type="submit" id="search-submit">
                <span class="search__go-label">Go</span>
                <span class="search__spinner" aria-hidden="true"></span>
            </button>
        </div>
        <p class="search__status" id="search-status" role="status" aria-live="polite" hidden></p>
    </form>

    <button class="settings-button" id="settings-open" type="button" aria-label="Map settings"
        aria-haspopup="dialog" aria-expanded="false">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
            stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    </button>

    <div class="modal" id="settings-modal" hidden>
        <div class="modal__backdrop" data-close-modal></div>
        <div class="modal__panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <header class="modal__header">
                <h2 class="modal__title" id="settings-title">Map settings</h2>
                <button class="modal__close" type="button" id="settings-close" aria-label="Close settings">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                        stroke-linecap="round" aria-hidden="true">
                        <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                </button>
            </header>
            <div class="modal__body">
                <div class="setting">
                    <div>
                        <label class="setting__label" for="cluster-toggle">Group nearby markers</label>
                        <p class="setting__hint">Combine postboxes into clusters that split apart as you zoom in.</p>
                    </div>
                    <span class="switch">
                        <input type="checkbox" id="cluster-toggle" checked />
                        <span class="switch__track"></span>
                    </span>
                </div>
            </div>
            <footer class="modal__footer" id="marker-summary">Loading postboxes&hellip;</footer>
        </div>
    </div>

    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js"></script>
    <script src="app.js"></script>
</body>

</html>
