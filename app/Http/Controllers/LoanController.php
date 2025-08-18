<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use App\Models\Borrower;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class LoanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $loans = Loan::with('borrower')->orderBy('created_at', 'desc')->get();
        
        // Get borrowers with completed requirements for the dropdown
        // A borrower is eligible if they are confirmed, have submitted requirements,
        // and don't already have a loan application
        $eligibleBorrowers = Borrower::where('status', Borrower::STATUS_CONFIRMED)
            ->has('requirements')
            ->whereDoesntHave('loans')
            ->get();
        
        return Inertia::render('loans', [
            'loans' => $loans,
            'eligibleBorrowers' => $eligibleBorrowers
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'borrower_id' => 'required|exists:borrowers,id',
            'principal_amount' => 'required|numeric|min:1000',
            'loan_duration' => 'required|integer|min:1|max:60',
            'duration_period' => 'required|in:months,years',
            'loan_release_date' => 'required|date|after_or_equal:today',
            'interest_rate' => 'required|numeric|min:0|max:100',
            'interest_method' => 'required|string|in:simple,flat',
            'loan_type' => 'required|string',
            'purpose' => 'nullable|string',
            'collateral' => 'nullable|string',
            'notes' => 'nullable|string'
        ]);

        // Convert duration to months if needed
        $durationInMonths = $request->duration_period === 'years' 
            ? (int)$request->loan_duration * 12 
            : (int)$request->loan_duration;

        // Calculate due date
        $releaseDate = Carbon::parse($request->loan_release_date);
        $dueDate = $releaseDate->copy()->addMonths($durationInMonths);

        // Create loan with calculated values
        $loan = new Loan();
        $loan->loan_id = Loan::generateLoanId();
        $loan->borrower_id = $request->borrower_id;
        $loan->principal_amount = $request->principal_amount;
        $loan->loan_duration = $durationInMonths;
        $loan->duration_period = 'months';
        $loan->loan_release_date = $request->loan_release_date;
        $loan->interest_rate = $request->interest_rate;
        $loan->interest_method = $request->interest_method;
        $loan->loan_type = $request->loan_type;
        $loan->purpose = $request->purpose;
        $loan->collateral = $request->collateral;
        $loan->due_date = $dueDate;
        $loan->notes = $request->notes;
        
        // Calculate total amount and monthly payment
        $loan->total_amount = $loan->calculateTotalAmount();
        $loan->monthly_payment = $loan->calculateMonthlyPayment();
        
        $loan->save();

        return redirect()->route('loans.index')->with('success', 'Loan created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Loan $loan)
    {
        $loan->load('borrower');
        return Inertia::render('loans/show', [
            'loan' => $loan
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Loan $loan)
    {
        $request->validate([
            'status' => 'required|in:1,2,3,4,5'
        ]);

        $loan->update([
            'status' => $request->status
        ]);

        return redirect()->route('loans.index')->with('success', 'Loan status updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Loan $loan)
    {
        $loan->delete();
        return redirect()->route('loans.index')->with('success', 'Loan deleted successfully!');
    }

    /**
     * Approve a loan.
     */
    public function approve(Loan $loan)
    {
        $loan->update(['status' => Loan::STATUS_APPROVED]);
        return redirect()->route('loans.index')->with('success', 'Loan approved successfully!');
    }

    /**
     * Activate a loan.
     */
    public function activate(Loan $loan)
    {
        $loan->update(['status' => Loan::STATUS_ACTIVE]);
        return redirect()->route('loans.index')->with('success', 'Loan activated successfully!');
    }
}
