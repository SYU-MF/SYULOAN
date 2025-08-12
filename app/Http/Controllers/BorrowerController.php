<?php

namespace App\Http\Controllers;

use App\Models\Borrower;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BorrowerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $borrowers = Borrower::orderBy('created_at', 'desc')->get();
        
        return Inertia::render('borrowers', [
            'borrowers' => [
                'data' => $borrowers,
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $borrowers->count(),
                'total' => $borrowers->count(),
            ]
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
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:borrowers,email',
            'phone' => 'required|string|max:20',
            'address' => 'required|string',
            'date_of_birth' => 'required|date|before:today',
            'occupation' => 'required|string|max:255',
            'monthly_income' => 'required|numeric|min:0',
        ]);

        // Status will be automatically set to pending (1) by default in migration
        $borrower = Borrower::create($validated);

        return redirect()->route('borrowers.index')->with('success', 'Borrower added successfully and is pending approval!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Borrower $borrower)
    {
        return Inertia::render('borrowers/show', [
            'borrower' => $borrower
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Borrower $borrower)
    {
        return Inertia::render('borrowers/edit', [
            'borrower' => $borrower
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Borrower $borrower)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:borrowers,email,' . $borrower->id,
            'phone' => 'required|string|max:20',
            'address' => 'required|string',
            'date_of_birth' => 'required|date|before:today',
            'occupation' => 'required|string|max:255',
            'monthly_income' => 'required|numeric|min:0',
        ]);

        $borrower->update($validated);

        return redirect()->route('borrowers.index')->with('success', 'Borrower updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Borrower $borrower)
    {
        $borrower->delete();

        return redirect()->route('borrowers.index')->with('success', 'Borrower deleted successfully!');
    }

    /**
     * Confirm a borrower.
     */
    public function confirm(Borrower $borrower)
    {
        $borrower->confirm();

        return redirect()->route('borrowers.index')->with('success', 'Borrower confirmed successfully!');
    }

    /**
     * Decline a borrower.
     */
    public function decline(Borrower $borrower)
    {
        $borrower->decline();

        return redirect()->route('borrowers.index')->with('success', 'Borrower declined successfully!');
    }
}
