<?php
try {
    $pdo = new PDO('mysql:host=127.0.0.1;port=3306;charset=utf8mb4', 'root', '');
    $dbs = $pdo->query('SHOW DATABASES')->fetchAll(PDO::FETCH_COLUMN);
    echo "MySQL Databases:\n";
    print_r($dbs);

    foreach ($dbs as $db) {
        if (in_array($db, ['information_schema', 'mysql', 'performance_schema', 'sys', 'phpmyadmin'])) continue;
        echo "Checking DB: $db\n";
        try {
            $pdo->query("USE `$db`");
            $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
            if (in_array('projects', $tables)) {
                $rows = $pdo->query("SELECT id, title FROM projects WHERE title LIKE '%จัดหา%' OR title LIKE '%ยา%'")->fetchAll(PDO::FETCH_ASSOC);
                print_r($rows);
            }
        } catch (\Exception $e) {}
    }
} catch (\Exception $e) {
    echo "Cannot connect to MySQL: " . $e->getMessage() . "\n";
}
