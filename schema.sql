-- Schema for the postbox map, with a few illustrative rows.
--
--   mysql -u root -p -e "CREATE DATABASE image_map_db
--     CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
--   mysql -u root -p image_map_db < schema.sql
--
-- Then create the application user and grant it access to this database only:
--
--   CREATE USER 'image_map_user'@'localhost' IDENTIFIED BY 'a-real-password';
--   GRANT SELECT, INSERT, UPDATE, DELETE ON image_map_db.* TO 'image_map_user'@'localhost';

DROP TABLE IF EXISTS `markers`;

CREATE TABLE `markers` (
  -- float(10,6) matches the live table. DECIMAL(9,6) would be the better
  -- choice for new installs: FLOAT(M,D) is deprecated as of MySQL 8.0.17.
  `id`         int unsigned NOT NULL AUTO_INCREMENT,
  `latitude`   float(10,6)  NOT NULL,
  `longitude`  float(10,6)  NOT NULL,

  -- Filename only. app.js prefixes it with the CDN path
  -- (//cdn.wiblin.net/postboxes/images/500w/). Empty or NULL means no photo.
  `image_url`  varchar(255) DEFAULT NULL,

  -- Date the box was visited and photographed. NULL means it is a known
  -- location that has not been bagged yet. See the note in README.md about
  -- how get_markers.php filters on this column.
  `date`       date         DEFAULT NULL,

  `creditname` varchar(250) DEFAULT NULL,
  `crediturl`  varchar(255) DEFAULT NULL,

  -- Royal Mail box reference, e.g. "OX4 216". Unique where present.
  `ref`        varchar(100) DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `ref` (`ref`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Example rows.
--
-- The first is a bagged box: it has a date and a photo, so app.js renders it
-- with the red pin and the popup shows the image and credit.
--
-- The second is a known but unvisited location: no date, no photo. app.js has
-- a green pin for this case, though get_markers.php does not currently return
-- such rows -- see README.md.

INSERT INTO `markers`
  (`latitude`, `longitude`, `image_url`, `date`, `creditname`, `crediturl`, `ref`)
VALUES
  (51.752743, -1.256672, 'IMG_0001.jpeg', '2023-04-01',
   'Kevin Wiblin', 'twitter.com/KevinWiblin', 'OX1 100'),
  (51.737602, -1.252220, NULL, NULL, NULL, NULL, 'OX1 134');
