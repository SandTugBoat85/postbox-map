<?php
header('Content-Type: application/json');

$config = require __DIR__ . '/config.php';

$conn = new mysqli($config['host'], $config['user'], $config['pass'], $config['name']);

if ($conn->connect_error) {
    error_log('get_markers.php: DB connection failed: ' . $conn->connect_error);
    http_response_code(500);
    echo json_encode(['error' => 'Database unavailable']);
    exit;
}

$sql = "SELECT id, latitude, longitude, image_url, date, creditname, crediturl, ref FROM markers WHERE date > '1970-01-01'";
$result = $conn->query($sql);

$markers = [];

while ($row = $result->fetch_assoc()) {
    $markers[] = $row;
}

echo json_encode($markers);

$conn->close();
