<?php

namespace App\Http\Controllers;

use App\Models\Borrower;
use App\Models\Requirement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class RequirementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $borrowers = Borrower::with('requirements')->orderBy('created_at', 'desc')->get();
        
        return Inertia::render('requirements', [
            'borrowers' => $borrowers,
            'documentTypes' => Requirement::DOCUMENT_TYPES,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'borrower_id' => 'required|exists:borrowers,id',
            'document_type' => 'required|in:' . implode(',', array_keys(Requirement::DOCUMENT_TYPES)),
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240', // 10MB max
            'notes' => 'nullable|string|max:1000',
        ]);

        $file = $request->file('file');
        $borrower = Borrower::findOrFail($request->borrower_id);
        
        // Create directory structure: requirements/{borrower_id}/{document_type}/
        $directory = "requirements/{$borrower->borrower_id}/{$request->document_type}";
        
        // Generate unique filename
        $filename = time() . '_' . $file->getClientOriginalName();
        
        // Store the file
        $filePath = $file->storeAs($directory, $filename, 'public');
        
        // Create requirement record
        Requirement::create([
            'borrower_id' => $request->borrower_id,
            'document_type' => $request->document_type,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $filePath,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
            'notes' => $request->notes,
        ]);

        return redirect()->route('requirements.index')
            ->with('success', 'Requirement uploaded successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Borrower $borrower)
    {
        $borrower->load('requirements');
        
        return Inertia::render('requirements/show', [
            'borrower' => $borrower,
            'documentTypes' => Requirement::DOCUMENT_TYPES,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Requirement $requirement)
    {
        $request->validate([
            'file' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'notes' => 'nullable|string|max:1000',
        ]);

        $data = [
            'notes' => $request->notes,
        ];

        // If a new file is uploaded, replace the old one
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $borrower = $requirement->borrower;
            
            // Delete old file
            if (Storage::disk('public')->exists($requirement->file_path)) {
                Storage::disk('public')->delete($requirement->file_path);
            }
            
            // Store new file
            $directory = "requirements/{$borrower->borrower_id}/{$requirement->document_type}";
            $filename = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs($directory, $filename, 'public');
            
            $data = array_merge($data, [
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $filePath,
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
            ]);
        }

        $requirement->update($data);

        return redirect()->route('requirements.show', $requirement->borrower)
            ->with('success', 'Requirement updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Requirement $requirement)
    {
        // Delete the file from storage
        if (Storage::disk('public')->exists($requirement->file_path)) {
            Storage::disk('public')->delete($requirement->file_path);
        }
        
        $borrower = $requirement->borrower;
        $requirement->delete();

        return redirect()->route('requirements.show', $borrower)
            ->with('success', 'Requirement deleted successfully!');
    }

    /**
     * Download the requirement file.
     */
    public function download(Requirement $requirement)
    {
        if (!Storage::disk('public')->exists($requirement->file_path)) {
            abort(404, 'File not found.');
        }

        return response()->download(storage_path('app/public/' . $requirement->file_path),
            $requirement->file_path,
            $requirement->file_name
        );
    }
}