<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UjianController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\PesertaController;
use App\Http\Controllers\HasilController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\InviteController;
use App\Http\Controllers\ForgotPasswordController;


/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES (Bisa Diakses Tanpa Login Admin)
|--------------------------------------------------------------------------
*/
// --- Auth Admin & Invite ---
Route::post('/admin/login', [AuthController::class, 'login']);
Route::post('/invite/login', [InviteController::class, 'login']);
Route::post('/admin/forgot-password', [ForgotPasswordController::class, 'requestReset']);
Route::get('/settings', [SettingsController::class, 'index']);

// --- Ujian (Public untuk Peserta) ---
Route::get('/ujian/check-active/{id}', [UjianController::class, 'checkActive']);
Route::get('/ujian/public/{id}', [UjianController::class, 'showPublic']);
Route::post('/ujian/upload-peserta', [UjianController::class, 'uploadPeserta']);

// --- Peserta (CRUD Data Diri) ---
Route::post('/peserta', [PesertaController::class, 'store']);
Route::get('/peserta/{id}', [PesertaController::class, 'show']);
Route::put('/peserta/{id}', [PesertaController::class, 'update']);

// --- [FIX] SUBMIT HASIL UJIAN (Pindahkan ke Sini) ---
// Peserta tidak punya token Admin, jadi harus public
Route::post('/hasil/draft', [HasilController::class, 'storeDraft']);
Route::post('/hasil', [HasilController::class, 'store']);


/*
|--------------------------------------------------------------------------
| PROTECTED ROUTES (ADMIN ONLY)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {

    Route::get('/auth/admin/me', [AuthController::class, 'me']);
    Route::post('/auth/admin/logout', [AuthController::class, 'logout']);
    Route::get('/admin/ping', [AdminController::class, 'ping']);

    // --- ADMIN MANAGEMENT ---
    Route::get('/admins', [AdminController::class, 'index']);
    Route::post('/admins', [AdminController::class, 'store']);
    Route::post('/admin/register', [AdminController::class, 'store']);
    Route::get('/admin/invite-history', [AdminController::class, 'index']);
    Route::get('/admin-list', [AdminController::class, 'index']);

    Route::put('/admin/update-role/{id}', [AdminController::class, 'updateRole']);
    Route::put('/admin/update-username/{id}', [AdminController::class, 'updateUsername']);
    Route::put('/admin/toggle-status/{id}', [AdminController::class, 'toggleStatus']);

    Route::delete('/admins/{id}', [AdminController::class, 'destroy']);
    Route::delete('/admin/delete/{id}', [AdminController::class, 'destroy']);
    Route::post('/admin/change-password', [AdminController::class, 'changePassword']);

    // --- UJIAN (Admin Actions) ---
    Route::get('/ujian', [UjianController::class, 'index']);
    Route::post('/ujian', [UjianController::class, 'store']);
    Route::get('/ujian/{id}', [UjianController::class, 'show']);
    Route::put('/ujian/{id}', [UjianController::class, 'update']);
    Route::delete('/ujian/{id}', [UjianController::class, 'destroy']);

    // --- PESERTA (Admin Actions) ---
    Route::get('/peserta', [PesertaController::class, 'index']);
    Route::delete('/peserta/{id}', [PesertaController::class, 'destroy']);
    Route::post('/peserta/import', [PesertaController::class, 'import']);

    // --- HASIL UJIAN (Admin Actions: Lihat & Nilai) ---
    // Note: store & storeDraft dipindah ke Public di atas
    Route::get('/hasil', [HasilController::class, 'index']);
    Route::get('/hasil/peserta/{peserta_id}', [HasilController::class, 'showByPeserta']);
    Route::put('/hasil/nilai-manual', [HasilController::class, 'updateNilaiManual']);

    // --- SETTINGS & EMAIL ---
    Route::post('/settings', [SettingsController::class, 'update']);
    Route::get('/email/smtp', [SettingsController::class, 'getSmtp']);
    Route::put('/email/smtp', [SettingsController::class, 'updateSmtp']);

    // --- INVITE ---
    Route::get('/invite/list', [InviteController::class, 'index']);
    Route::post('/invite', [InviteController::class, 'sendInvite']);
    Route::delete('/invite/{id}', [InviteController::class, 'destroy']);

    // --- RESET PASSWORD ---
    Route::get('/admin/forgot-password/requests', [ForgotPasswordController::class, 'index']);
    Route::post('/admin/forgot-password/approve', [ForgotPasswordController::class, 'approve']);
    Route::post('/admin/forgot-password/reject', [ForgotPasswordController::class, 'reject']);
});