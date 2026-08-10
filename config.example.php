<?php
// Copy this file to config.php and fill in your own values.
// config.php is git-ignored and must never be committed.
//
// Everything the site needs to know about itself lives here: database
// credentials, the public URLs, and where the map opens.

return [
    'db' => [
        'host' => 'localhost',
        'user' => 'image_map_user',
        'pass' => 'CHANGE_ME',
        'name' => 'image_map_db',
    ],

    'site' => [
        // Used for the page title, the meta description and the social cards.
        'title'       => 'My Postbox Map',
        'description' => 'A map of postboxes I have photographed',

        // Canonical address of the map, with trailing slash. Used for
        // <link rel="canonical">, og:url and twitter:url.
        'url'         => 'https://example.com/postboxes/',

        // Where marker photographs are served from. The image_url column in
        // the markers table holds a bare filename, appended to this.
        'image_base'  => '//cdn.example.com/postboxes/images/500w/',

        // Single image used for link previews.
        'social_image' => '//cdn.example.com/postboxes/images/500w/example.jpeg',

        // Leave empty to omit the Twitter card tags.
        'twitter'     => '@yourhandle',
    ],

    // Where the map opens before the user moves it.
    'map' => [
        'lat'  => 51.7520,
        'lng'  => -1.2577,
        'zoom' => 10,
    ],
];
