<?php

use App\Http\Controllers\BorrowerController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    
    Route::resource('borrowers', BorrowerController::class);
    Route::patch('borrowers/{borrower}/confirm', [BorrowerController::class, 'confirm'])->name('borrowers.confirm');
    Route::patch('borrowers/{borrower}/decline', [BorrowerController::class, 'decline'])->name('borrowers.decline');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
