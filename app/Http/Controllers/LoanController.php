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
        $validationRules = [
            'borrower_id' => 'required|exists:borrowers,id',
            'principal_amount' => 'required|numeric|min:1000',
            'loan_duration' => 'required|integer|min:1|max:60',
            'duration_period' => 'required|in:months,years',
            'loan_release_date' => 'required|date|after_or_equal:today',
            'interest_rate' => 'required|numeric|min:0|max:100',
            'interest_method' => 'required|string|in:flat_annual,flat_one_time',
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
        ];

        // Add vehicle information validation for car and motorcycle loans
        if (in_array($request->loan_type, ['car', 'motorcycle'])) {
            $validationRules = array_merge($validationRules, [
                'vehicle_make' => 'required|string|max:255',
                'vehicle_model' => 'required|string|max:255',
                'vehicle_type' => 'required|string|max:255',
                'year_of_manufacture' => 'required|integer|min:1900|max:' . (date('Y') + 1),
                'color' => 'required|string|max:255',
                'plate_number' => 'required|string|max:255',
                'chassis_number' => 'required|string|max:255',
                'engine_number' => 'required|string|max:255',
            ]);
        }

        // Add luxury information validation for luxury loans
        if ($request->loan_type === 'luxuries') {
            $validationRules = array_merge($validationRules, [
                'item_type' => 'required|string|max:255',
                'luxury_brand' => 'required|string|max:255',
                'model_collection_name' => 'required|string|max:255',
                'material' => 'nullable|string|max:255',
                'serial_number' => 'nullable|string|max:255',
                'certificate_number' => 'nullable|string|max:255',
                'year_purchased' => 'nullable|integer|min:1900|max:' . date('Y'),
                'year_released' => 'nullable|integer|min:1900|max:' . date('Y'),
            ]);
        }

        // Add gadget information validation for gadget loans
        if ($request->loan_type === 'gadgets') {
            $validationRules = array_merge($validationRules, [
                'gadget_type' => 'required|string|max:255',
                'gadget_brand' => 'required|string|max:255',
                'gadget_model' => 'required|string|max:255',
                'specifications' => 'nullable|string|max:500',
                'gadget_serial_number' => 'nullable|string|max:255',
                'gadget_color' => 'nullable|string|max:255',
                'gadget_year_purchased' => 'nullable|integer|min:1990|max:' . date('Y'),
                'gadget_year_released' => 'nullable|integer|min:1990|max:' . date('Y'),
                'warranty_details' => 'nullable|string|max:500',
            ]);
        }

        $request->validate($validationRules);

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
                            'fixed_amount' => !empty($feeData['fixed_amount']) ? $feeData['fixed_amount'] : null,
                        ]);
                    }
                }
            }

            // Calculate released amount (principal amount minus total fees)
            $totalFees = 0;
            $fees = $loan->fees;
            foreach ($fees as $fee) {
                if ($fee->fixed_amount) {
                    // Add fixed amount fee
                    $totalFees += $fee->fixed_amount;
                }
            }
            
            $loan->released_amount = $loan->principal_amount - $totalFees;
            $loan->save();

            // Store vehicle information for car and motorcycle loans
            if (in_array($request->loan_type, ['car', 'motorcycle'])) {
                \App\Models\VehicleInfo::create([
                    'loan_id' => $loan->id,
                    'vehicle_type' => $request->loan_type,
                    'make' => $request->vehicle_make,
                    'model' => $request->vehicle_model,
                    'type' => $request->vehicle_type,
                    'year_of_manufacture' => $request->year_of_manufacture,
                    'color' => $request->color,
                    'plate_number' => $request->plate_number,
                    'chassis_number' => $request->chassis_number,
                    'engine_number' => $request->engine_number,
                ]);
            }

            // Store luxury information for luxury loans
            if ($request->loan_type === 'luxuries') {
                \App\Models\LuxuryInfo::create([
                    'loan_id' => $loan->id,
                    'item_type' => $request->item_type,
                    'brand' => $request->luxury_brand,
                    'model_collection_name' => $request->model_collection_name,
                    'material' => $request->material,
                    'serial_number' => $request->serial_number,
                    'certificate_number' => $request->certificate_number,
                    'year_purchased' => $request->year_purchased,
                    'year_released' => $request->year_released,
                ]);
            }

            // Store gadget information for gadget loans
            if ($request->loan_type === 'gadgets') {
                \App\Models\GadgetInfo::create([
                    'loan_id' => $loan->id,
                    'gadget_type' => $request->gadget_type,
                    'brand' => $request->gadget_brand,
                    'model' => $request->gadget_model,
                    'specifications' => $request->specifications,
                    'serial_number' => $request->gadget_serial_number,
                    'color' => $request->gadget_color,
                    'year_purchased' => $request->gadget_year_purchased,
                    'year_released' => $request->gadget_year_released,
                    'warranty_details' => $request->warranty_details,
                ]);
            }

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
                            'file_paths' => !empty($filePaths) ? $filePaths : null,
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
        $loan->load(['borrower', 'fees', 'collaterals', 'payments.processedBy', 'vehicleInfo', 'luxuryInfo', 'gadgetInfo']);
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
