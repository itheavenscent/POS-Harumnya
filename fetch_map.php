<?php

$host = '76.13.192.101';
$db = 'harumnya';
$user = 'postgres';
$pass = 'postgre';

try {
    $dsn = "pgsql:host=$host;port=5432;dbname=$db;";
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    
    $stmt = $pdo->query("SELECT code FROM ingredients WHERE code LIKE 'LQD-%' OR code LIKE 'BSD-%'");
    $ingredients = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $stmt = $pdo->query("SELECT code FROM variants");
    $variants = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $map = [];
    foreach ($variants as $v) {
        if (in_array("LQD-$v", $ingredients)) $map[$v] = "LQD-$v";
        elseif (in_array("BSD-$v", $ingredients)) $map[$v] = "BSD-$v";
        else {
             // fallback mapping based on some fuzzy matching
             foreach ($ingredients as $ing) {
                  if (strpos($ing, $v) !== false) {
                      $map[$v] = $ing;
                      break;
                  }
             }
        }
    }
    
    echo json_encode($map, JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}
