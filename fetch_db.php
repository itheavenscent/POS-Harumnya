<?php

$host = '76.13.192.101';
$db = 'harumnya';
$user = 'postgres';
$pass = 'postgre';

try {
    $dsn = "pgsql:host=$host;port=5432;dbname=$db;";
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    
    $stmt = $pdo->query("SELECT id, code, name FROM variants");
    $variants = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($variants, JSON_PRETTY_PRINT);
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}
