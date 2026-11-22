<?php
// Visitor counter that keeps its number in counter.txt, next to this file.
// GitHub Pages cannot run PHP: upload this folder to your own hosting (see README.md).

const ALLOWED_ORIGINS = ['https://mohammedprince.github.io'];
const COUNTER_FILE = __DIR__ . '/counter.txt';

header('Content-Type: application/json');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');
header('Vary: Origin');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = in_array($origin, ALLOWED_ORIGINS, true);
if ($allowed) {
    header('Access-Control-Allow-Origin: ' . $origin);
}

$file = @fopen(COUNTER_FILE, 'c+');
if (!$file || !flock($file, LOCK_EX)) {
    http_response_code(500);
    echo json_encode(['error' => 'counter.txt is not writable']);
    exit;
}

$count = (int) stream_get_contents($file);

// POST from the website adds one visit; anything else only reads the number.
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $allowed) {
    $count++;
    rewind($file);
    ftruncate($file, 0);
    fwrite($file, (string) $count);
    fflush($file);
}

flock($file, LOCK_UN);
fclose($file);

echo json_encode(['count' => $count]);
