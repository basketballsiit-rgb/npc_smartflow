<?php
$user_uploaded_path = 'C:/Users/nipon/AppData/Local/Temp/1784345037675.png';

if (!file_exists($user_uploaded_path)) {
    $files = glob('C:/Users/nipon/AppData/Local/Temp/*.png');
    foreach ($files as $f) {
        if (filesize($f) == 2015091) {
            $user_uploaded_path = $f;
            break;
        }
    }
}

if (!file_exists($user_uploaded_path)) {
    die("User uploaded file (2015091 bytes) not found!");
}

echo "Processing real user logo: " . $user_uploaded_path . " (" . filesize($user_uploaded_path) . " bytes)\n";

$src = @imagecreatefrompng($user_uploaded_path);
if (!$src) {
    $src = @imagecreatefromjpeg($user_uploaded_path);
}

if (!$src) {
    die("Failed to open image.");
}

$width = imagesx($src);
$height = imagesy($src);

$dst = imagecreatetruecolor($width, $height);
imagealphablending($dst, false);
imagesavealpha($dst, true);

$transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
imagefilledrectangle($dst, 0, 0, $width, $height, $transparent);

$r = min($width, $height) / 2;
$cx = $width / 2;
$cy = $height / 2;

for ($x = 0; $x < $width; $x++) {
    for ($y = 0; $y < $height; $y++) {
        $dx = $x - $cx;
        $dy = $y - $cy;
        if (($dx * $dx + $dy * $dy) <= ($r * $r)) {
            $color = imagecolorat($src, $x, $y);
            imagesetpixel($dst, $x, $y, $color);
        }
    }
}

imagepng($dst, 'c:/xampp/htdocs/smartflow/public/images/logo.png');
imagepng($dst, 'c:/xampp/htdocs/smartflow/public/logo.png');
echo "SUCCESSFULLY_REPLACED_REAL_SARAPHADCHANG_NANO_LOGO\n";
