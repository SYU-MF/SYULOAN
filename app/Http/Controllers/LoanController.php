<?php

namespace App\Http\Controllers;

use App\Models\Loan;
use App\Models\Borrower;
use App\Models\LoanFee;
use App\Models\LoanPenalty;
use App\Models\LoanCollateral;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            'notes' => 'nullable|string',
            // Fees validation
            'fees' => 'nullable|string',
            // Collaterals validation
            'collaterals' => 'nullable|string',
            // Penalties validation
            'penalties' => 'nullable|string',
            'collateral_files' => 'nullable|array',
            'collateral_files.*' => 'nullable|array',
            'collateral_files.*.*' => 'file|mimes:jpeg,png,jpg,gif,pdf,doc,docx|max:2048',
        ]);

        DB::transaction(function () use ($request) {
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
            $loan->due_date = $dueDate;
            $loan->notes = $request->notes;
            

            
            // Calculate total amount and monthly payment
            $loan->total_amount = $loan->calculateTotalAmount();
            $loan->monthly_payment = $loan->calculateMonthlyPayment();
            
            $loan->save();

            // Store fees
            if ($request->has('fees') && !empty($request->fees)) {
                $fees = json_decode($request->fees, true);
                if (is_array($fees)) {
                    foreach ($fees as $feeData) {
                        LoanFee::create([
                            'loan_id' => $loan->id,
                            'fee_type' => $feeData['fee_type'],
                            'calculate_fee_on' => $feeData['calculate_fee_on'],
                            'fee_percentage' => !empty($feeData['fee_percentage']) ? $feeData['fee_percentage'] : null,
                            'fixed_amount' => !empty($feeData['fixed_amount']) ? $feeData['fixed_amount'] : null,
                        ]);
                    }
                }
            }

            // Calculate released amount (principal amount minus total fees)
            $totalFees = 0;
            $fees = $loan->fees;
            foreach ($fees as $fee) {
                if ($fee->fee_percentage) {
                    // Calculate percentage-based fee
                    $baseAmount = $fee->calculate_fee_on === 'principal' ? $loan->principal_amount : $loan->total_amount;
                    $totalFees += ($baseAmount * $fee->fee_percentage / 100);
                } else if ($fee->fixed_amount) {
                    // Add fixed amount fee
                    $totalFees += $fee->fixed_amount;
                }
            }
            
            $loan->released_amount = $loan->principal_amount - $totalFees;
            $loan->save();

            // Store collaterals
            if ($request->has('collaterals') && !empty($request->collaterals)) {
                $collaterals = json_decode($request->collaterals, true);
                if (is_array($collaterals)) {
                    foreach ($collaterals as $index => $collateralData) {
                        $filePaths = [];
                        
                        // Handle file uploads for this collateral
                        if ($request->hasFile("collateral_files.{$index}")) {
                            $files = $request->file("collateral_files.{$index}");
                            foreach ($files as $file) {
                                if ($file->isValid()) {
                                    $fileName = time() . '_' . $file->getClientOriginalName();
                                    $filePath = $file->storeAs('collaterals', $fileName, 'public');
                                    $filePaths[] = $filePath;
                                }
                            }
                        }
                        
                        LoanCollateral::create([
                            'loan_id' => $loan->id,
                            'name' => $collateralData['name'],
                            'description' => $collateralData['description'],
                            'defects' => $collateralData['defects'] ?? null,
                            'file_paths' => !empty($filePaths) ? json_encode($filePaths) : null,
                        ]);
                    }
                }
            }

            // Store penalties
            if ($request->has('penalties') && !empty($request->penalties)) {
                $penalties = json_decode($request->penalties, true);
                if (is_array($penalties)) {
                    foreach ($penalties as $penaltyData) {
                        LoanPenalty::create([
                            'loan_id' => $loan->id,
                            'penalty_type' => $penaltyData['penalty_type'],
                            'penalty_rate' => $penaltyData['penalty_rate'],
                            'grace_period_days' => $penaltyData['grace_period_days'],
                            'penalty_calculation_base' => $penaltyData['penalty_calculation_base'],
                            'penalty_name' => $penaltyData['penalty_name'],
                            'description' => $penaltyData['description'] ?? null,
                        ]);
                    }
                }
            }
        });

        return redirect()->route('loans.index')->with('success', 'Loan created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Loan $loan)
    {
        $loan->load(['borrower', 'fees']);
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
