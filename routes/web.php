<?php

use App\Http\Controllers\AccountsPayableController;
use App\Http\Controllers\BorrowerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LoanController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\RequirementController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    Route::resource('borrowers', BorrowerController::class);
    Route::patch('borrowers/{borrower}/confirm', [BorrowerController::class, 'confirm'])->name('borrowers.confirm');
    Route::patch('borrowers/{borrower}/decline', [BorrowerController::class, 'decline'])->name('borrowers.decline');
    
    Route::resource('requirements', RequirementController::class);
    Route::get('requirements/borrower/{borrower}', [RequirementController::class, 'show'])->name('requirements.show');
    Route::get('requirements/{requirement}/view', [RequirementController::class, 'view'])->name('requirements.view');
    Route::get('requirements/{requirement}/download', [RequirementController::class, 'download'])->name('requirements.download');
    
    Route::resource('loans', LoanController::class);
    Route::patch('loans/{loan}/approve', [LoanController::class, 'approve'])->name('loans.approve');
    Route::patch('loans/{loan}/activate', [LoanController::class, 'activate'])->name('loans.activate');
    
    Route::resource('payments', PaymentController::class);
    Route::get('payments/loan/{loan}', [PaymentController::class, 'loanPayments'])->name('payments.loan');
    Route::get('loans/{loan}/schedule', [PaymentController::class, 'generateSchedule'])->name('loans.schedule');
    
    Route::resource('accounts-payable', AccountsPayableController::class)->except(['create', 'store']);
    Route::post('accounts-payable/generate', [AccountsPayableController::class, 'generatePayables'])->name('accounts-payable.generate');
    Route::post('accounts-payable/{accountsPayable}/payment', [AccountsPayableController::class, 'makePayment'])->name('accounts-payable.payment');
    Route::patch('accounts-payable/{accountsPayable}/cancel', [AccountsPayableController::class, 'cancel'])->name('accounts-payable.cancel');
    Route::get('api/vendors', [AccountsPayableController::class, 'getVendors'])->name('api.vendors');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
