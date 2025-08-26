<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Loan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class PaymentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $payments = Payment::with(['loan.borrower', 'processedBy'])
            ->orderBy('created_at', 'desc')
            ->get();

        $activeLoans = Loan::with(['borrower', 'penalties', 'payments'])
            ->where('status', Loan::STATUS_ACTIVE)
            ->get();

        // Calculate payment statistics
        $statistics = [
            'totalPayments' => $payments->count(),
            'totalAmount' => $payments->where('status', Payment::STATUS_COMPLETED)->sum('amount'),
            'pendingPayments' => $payments->where('status', Payment::STATUS_PENDING)->count(),
            'completedPayments' => $payments->where('status', Payment::STATUS_COMPLETED)->count(),
            'monthlyCollection' => $payments->where('status', Payment::STATUS_COMPLETED)
                ->where('payment_date', '>=', Carbon::now()->startOfMonth())
                ->sum('amount'),
        ];

        return Inertia::render('payments', [
            'payments' => $payments,
            'activeLoans' => $activeLoans,
            'statistics' => $statistics,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'loan_id' => 'required|exists:loans,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'payment_type' => 'required|in:regular,partial,full,penalty,advance',
            'payment_method' => 'required|in:cash,bank_transfer,check,online,gcash,paymaya',
            'reference_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $loan = Loan::findOrFail($request->loan_id);
        
        // Calculate payment breakdown
        $paymentBreakdown = $this->calculatePaymentBreakdown($loan, $request->amount, $request->payment_type);

        DB::transaction(function () use ($request, $loan, $paymentBreakdown) {
            $payment = Payment::create([
                'loan_id' => $request->loan_id,
                'amount' => $request->amount,
                'payment_date' => $request->payment_date,
                'payment_type' => $request->payment_type,
                'payment_method' => $request->payment_method,
                'status' => Payment::STATUS_COMPLETED,
                'principal_amount' => $paymentBreakdown['principal'],
                'interest_amount' => $paymentBreakdown['interest'],
                'penalty_amount' => $paymentBreakdown['penalty'],
                'remaining_balance' => $paymentBreakdown['remaining_balance'],
                'reference_number' => $request->reference_number,
                'notes' => $request->notes,
                'processed_by' => Auth::id(),
                'processed_at' => now(),
            ]);

            // Update loan status if fully paid
            if ($paymentBreakdown['remaining_balance'] <= 0) {
                $loan->update(['status' => Loan::STATUS_COMPLETED]);
            }
        });

        return redirect()->route('payments.index')
            ->with('success', 'Payment recorded successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Payment $payment)
    {
        $payment->load(['loan.borrower', 'processedBy']);
        
        return Inertia::render('payments/show', [
            'payment' => $payment,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Payment $payment)
    {
        $request->validate([
            'status' => 'required|in:pending,completed,failed,cancelled',
            'notes' => 'nullable|string',
        ]);

        $payment->update([
            'status' => $request->status,
            'notes' => $request->notes,
            'processed_by' => Auth::id(),
            'processed_at' => now(),
        ]);

        return redirect()->route('payments.index')
            ->with('success', 'Payment updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Payment $payment)
    {
        // Only allow deletion of pending payments
        if ($payment->status !== Payment::STATUS_PENDING) {
            return redirect()->route('payments.index')
                ->with('error', 'Only pending payments can be deleted.');
        }

        $payment->delete();

        return redirect()->route('payments.index')
            ->with('success', 'Payment deleted successfully.');
    }

    /**
     * Get payment history for a specific loan.
     */
    public function loanPayments(Loan $loan)
    {
        $payments = $loan->payments()
            ->with('processedBy')
            ->orderBy('payment_date', 'desc')
            ->get();

        $totalPaid = $payments->where('status', Payment::STATUS_COMPLETED)->sum('amount');
        $remainingBalance = $loan->total_amount - $totalPaid;

        return Inertia::render('payments/loan-payments', [
            'loan' => $loan->load('borrower'),
            'payments' => $payments,
            'totalPaid' => $totalPaid,
            'remainingBalance' => $remainingBalance,
        ]);
    }

    /**
     * Calculate payment breakdown (principal, interest, penalty).
     */
    private function calculatePaymentBreakdown(Loan $loan, float $amount, string $paymentType): array
    {
        // Calculate remaining balance based only on principal and interest payments (excluding penalties)
        $totalPrincipalAndInterestPaid = $loan->payments()
            ->where('status', Payment::STATUS_COMPLETED)
            ->sum(DB::raw('principal_amount + interest_amount'));
        $remainingBalance = $loan->total_amount - $totalPrincipalAndInterestPaid;
        
        // Calculate penalty for overdue payments
        $penalty = $this->calculatePenalty($loan, $paymentType);
        
        // For all payment types except pure penalty, calculate interest and principal
        // Note: 'penalty' type now represents 'Regular with Penalty'
        $totalInterest = $loan->total_amount - $loan->principal_amount;
        
        // Use precise decimal calculation for monthly interest
        $monthlyInterest = round($totalInterest / $loan->loan_duration, 2);
        
        // For simple interest loans, interest portion is fixed per month
        // The full payment amount (including penalty) reduces the balance
        $interestPortion = min($monthlyInterest, $amount, $remainingBalance);
        
        // Remaining amount goes to principal - ensure precision
        $principalPortion = round($amount - $interestPortion, 2);
        
        // Ensure we don't exceed remaining balance
        if (($interestPortion + $principalPortion) > $remainingBalance) {
            $principalPortion = round($remainingBalance - $interestPortion, 2);
        }
        
        // Ensure non-negative values
        $principalPortion = max(0, $principalPortion);
        $interestPortion = max(0, $interestPortion);
        
        // The full payment amount (including penalty) should reduce the remaining balance
        $newRemainingBalance = round(max(0, $remainingBalance - $amount), 2);
        
        return [
            'principal' => $principalPortion,
            'interest' => $interestPortion,
            'penalty' => $penalty,
            'remaining_balance' => $newRemainingBalance,
        ];
    }
    
    /**
     * Calculate penalty amount for overdue payments.
     */
    private function calculatePenalty(Loan $loan, string $paymentType): float
    {
        // Calculate penalty for all payment types
        // Note: 'penalty' type now represents 'Regular with Penalty'
        
        // Get all penalties for this loan
        $penalties = $loan->penalties;
        
        // If no penalties configured, return 0
        if ($penalties->isEmpty()) {
            return 0;
        }
        
        // Calculate days overdue based on loan schedule and completed payments
        $loanReleaseDate = Carbon::parse($loan->loan_release_date);
        $currentDate = Carbon::now();
        
        // Count completed payments to determine the next payment number
        $completedPayments = $loan->payments()->where('status', Payment::STATUS_COMPLETED)->count();
        
        // Calculate the next payment due date based on completed payments
        // First payment is due 1 month after release, second payment 2 months after, etc.
        $nextPaymentNumber = $completedPayments + 1;
        $nextDueDate = $loanReleaseDate->copy()->addMonths($nextPaymentNumber);
        
        // Only calculate penalty if current date is past the next due date
        if ($currentDate->lte($nextDueDate)) {
            return 0; // No penalty if payment is not yet due
        }
        
        $lastDueDate = $nextDueDate;
        
        $totalPenalty = 0;
        
        // Calculate penalty for each penalty configuration
        foreach ($penalties as $penaltyConfig) {
            // Skip if penalty type is 'none'
            if ($penaltyConfig->penalty_type === 'none') {
                continue;
            }
            
            // Use penalty-specific grace period
            $gracePeriodDays = $penaltyConfig->grace_period_days ?? 7;
            $gracePeriodEnd = $lastDueDate->copy()->addDays($gracePeriodDays);
            
            // Check if current date is past the grace period
            if ($currentDate->lte($gracePeriodEnd)) {
                continue; // No penalty if within grace period
            }
            
            $daysOverdue = $currentDate->diffInDays($gracePeriodEnd);
            
            // Calculate penalty based on configuration
            $penaltyRate = $penaltyConfig->penalty_rate ?? 0.02;
            
            if ($penaltyConfig->penalty_type === 'fixed') {
                // Fixed penalty amount
                $penalty = $penaltyRate;
            } else {
                // Percentage-based penalty
                $monthsOverdue = max(1, ceil($daysOverdue / 30));
                
                // Determine base amount for penalty calculation
                $baseAmount = 0;
                switch ($penaltyConfig->penalty_calculation_base) {
                    case 'principal_amount':
                        $baseAmount = $loan->principal_amount;
                        break;
                    case 'remaining_balance':
                        $totalPaid = $loan->payments()->where('status', Payment::STATUS_COMPLETED)->sum('amount');
                        $baseAmount = $loan->total_amount - $totalPaid;
                        break;
                    case 'monthly_payment':
                    default:
                        $baseAmount = $loan->monthly_payment;
                        break;
                }
                
                $penalty = round($baseAmount * ($penaltyRate / 100) * $monthsOverdue, 2);
            }
            
            $totalPenalty += $penalty;
        }
        
        return $totalPenalty;
    }

    /**
     * Generate payment schedule for a loan.
     */
    public function generateSchedule(Loan $loan)
    {
        $schedule = [];
        $startDate = Carbon::parse($loan->loan_release_date);
        $monthlyPayment = $loan->monthly_payment;
        
        for ($i = 1; $i <= $loan->loan_duration; $i++) {
            $dueDate = $startDate->copy()->addMonths($i);
            $schedule[] = [
                'payment_number' => $i,
                'due_date' => $dueDate->format('Y-m-d'),
                'amount' => $monthlyPayment,
                'principal' => $monthlyPayment * 0.7, // Simplified calculation
                'interest' => $monthlyPayment * 0.3,
            ];
        }
        
        return response()->json($schedule);
    }
}
