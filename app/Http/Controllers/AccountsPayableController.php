<?php

namespace App\Http\Controllers;

use App\Models\AccountsPayable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class AccountsPayableController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Auto-generate loan payables before displaying
        AccountsPayable::generateLoanPayables();
        
        $query = AccountsPayable::getLoanPayables();

        // Apply filters
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('vendor_name', 'like', "%{$search}%")
                  ->orWhere('invoice_number', 'like', "%{$search}%")
                  ->orWhere('payable_id', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('loan', function($lq) use ($search) {
                      $lq->where('loan_id', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('vendor')) {
            $query->where('vendor_name', 'like', "%{$request->vendor}%");
        }



        $payables = $query->paginate(15)->withQueryString();

        // Calculate summary statistics for loan-based payables
        $totalPayables = AccountsPayable::whereNotNull('loan_id')
            ->whereNotIn('status', [AccountsPayable::STATUS_CANCELLED])
            ->sum('amount');
        $totalPaid = AccountsPayable::whereNotNull('loan_id')->sum('paid_amount');
        $totalOutstanding = AccountsPayable::whereNotNull('loan_id')
            ->whereNotIn('status', [AccountsPayable::STATUS_PAID, AccountsPayable::STATUS_CANCELLED])
            ->sum('remaining_amount');
        $pendingDisbursementsCount = AccountsPayable::whereNotNull('loan_id')
            ->whereNotIn('status', [AccountsPayable::STATUS_PAID, AccountsPayable::STATUS_CANCELLED])
            ->count();
        $completedDisbursementsCount = AccountsPayable::whereNotNull('loan_id')
            ->where('status', AccountsPayable::STATUS_PAID)
            ->count();

        $summary = [
            'total_payables' => $totalPayables,
            'total_paid' => $totalPaid,
            'total_outstanding' => $totalOutstanding,
            'overdue_count' => $pendingDisbursementsCount,
            'due_soon_count' => $completedDisbursementsCount,
        ];

        return Inertia::render('accounts-payable', [
            'payables' => $payables,
            'summary' => $summary,
            'filters' => $request->only(['search', 'status', 'vendor']),
        ]);
    }

    /**
     * Manually generate loan payables (for testing or manual trigger).
     */
    public function generatePayables()
    {
        AccountsPayable::generateLoanPayables();
        
        return redirect()->route('accounts-payable.index')
            ->with('success', 'Loan payables generated successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(AccountsPayable $accountsPayable)
    {
        $accountsPayable->load('creator');
        
        // Calculate current amounts
        $accountsPayable->current_late_fee = $accountsPayable->calculateLateFee();
        $accountsPayable->current_discount = $accountsPayable->calculateEarlyPaymentDiscount();
        $accountsPayable->total_amount_due = $accountsPayable->getTotalAmountDue();
        $accountsPayable->days_until_due = $accountsPayable->getDaysUntilDue();
        $accountsPayable->overdue_days = $accountsPayable->getOverdueDays();
        
        return Inertia::render('accounts-payable/show', [
            'payable' => $accountsPayable,
        ]);
    }

    /**
     * Update the specified resource in storage (limited for loan-based payables).
     */
    public function update(Request $request, AccountsPayable $accountsPayable)
    {
        // Prevent updating loan-based payables except for notes
        if ($accountsPayable->loan_id) {
            $validated = $request->validate([
                'notes' => 'nullable|string',
            ]);
            
            $accountsPayable->update($validated);
            
            return redirect()->route('accounts-payable.index')
                ->with('success', 'Notes updated successfully.');
        }
        
        // For non-loan payables (if any exist), allow full update
        $validated = $request->validate([
            'vendor_name' => 'required|string|max:255',
            'vendor_contact' => 'nullable|string|max:255',
            'vendor_email' => 'nullable|email|max:255',
            'invoice_number' => 'required|string|max:255',
            'invoice_date' => 'required|date',
            'amount' => 'required|numeric|min:0.01',
            'payment_terms' => 'required|integer|min:1|max:365',
            'description' => 'required|string',
            'category' => 'nullable|string|max:255',
            'late_fee_rate' => 'nullable|numeric|min:0|max:100',
            'discount_rate' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string',
        ]);

        $validated['due_date'] = Carbon::parse($validated['invoice_date'])->addDays($validated['payment_terms']);
        
        if ($validated['amount'] != $accountsPayable->amount) {
            $validated['remaining_amount'] = $validated['amount'] - $accountsPayable->paid_amount;
        }

        $accountsPayable->update($validated);
        $accountsPayable->updateStatus();

        return redirect()->route('accounts-payable.index')
            ->with('success', 'Accounts payable record updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(AccountsPayable $accountsPayable)
    {
        // Prevent deletion of loan-based payables
        if ($accountsPayable->loan_id) {
            return redirect()->route('accounts-payable.index')
                ->with('error', 'Cannot delete loan-based payables. These are automatically generated from active loans.');
        }
        
        if ($accountsPayable->paid_amount > 0) {
            return redirect()->route('accounts-payable.index')
                ->with('error', 'Cannot delete a payable record that has payments.');
        }

        $accountsPayable->delete();

        return redirect()->route('accounts-payable.index')
            ->with('success', 'Accounts payable record deleted successfully.');
    }

    /**
     * Make a payment on the payable.
     */
    public function makePayment(Request $request, AccountsPayable $accountsPayable)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string',
        ]);

        $paymentAmount = $validated['amount'];
        $remainingAmount = $accountsPayable->calculateRemainingAmount();

        if ($paymentAmount > $remainingAmount) {
            return redirect()->back()
                ->with('error', 'Payment amount cannot exceed remaining balance.');
        }

        DB::transaction(function () use ($accountsPayable, $paymentAmount, $validated) {
            $accountsPayable->makePayment($paymentAmount, $validated['notes'] ?? null);
        });

        return redirect()->route('accounts-payable.show', $accountsPayable)
            ->with('success', 'Payment recorded successfully.');
    }

    /**
     * Mark payable as cancelled.
     */
    public function cancel(AccountsPayable $accountsPayable)
    {
        if ($accountsPayable->paid_amount > 0) {
            return redirect()->back()
                ->with('error', 'Cannot cancel a payable that has payments.');
        }

        $accountsPayable->update(['status' => AccountsPayable::STATUS_CANCELLED]);

        return redirect()->route('accounts-payable.index')
            ->with('success', 'Accounts payable cancelled successfully.');
    }

    /**
     * Get vendor suggestions for autocomplete.
     */
    public function getVendors(Request $request)
    {
        $search = $request->get('search', '');
        
        $vendors = AccountsPayable::select('vendor_name', 'vendor_contact', 'vendor_email')
            ->where('vendor_name', 'like', "%{$search}%")
            ->groupBy('vendor_name', 'vendor_contact', 'vendor_email')
            ->limit(10)
            ->get();

        return response()->json($vendors);
    }
}
