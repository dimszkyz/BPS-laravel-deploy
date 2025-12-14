<?php

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Pastikan URL frontend Anda ada di sini
    'allowed_origins' => ['https://kompeta.web.bps.go.id','http://localhost:5173', 'http://127.0.0.1:5173'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Penting untuk login/session agar cookie bisa dikirim
    'supports_credentials' => true, 

];