<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Artisan;

Route::get('/link-storage', function () {
    try {
        Artisan::call('storage:link');
        return 'SUCCESS: Symlink storage berhasil dibuat! Silakan cek kembali file Anda.';
    } catch (\Exception $e) {
        return 'ERROR: Gagal membuat symlink. Detail: ' . $e->getMessage();
    }
});

Route::get('/', function () {
    return view('welcome');
});
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');