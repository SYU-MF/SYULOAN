import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import InputError from '@/components/input-error';
import { 
    Plus, 
    FolderOpen, 
    FileText, 
    Download,
    Eye,
    Upload,
    AlertCircle
} from 'lucide-react';

interface Borrower {
    id: number;
    borrower_id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;
    phone: string;
    status: number;
    requirements: Requirement[];
}

interface Requirement {
    id: number;
    document_type: string;
    file_name: string;
    file_path: string;
    file_size: string;
    mime_type: string;
    notes?: string;
    created_at: string;
    document_type_text: string;
    file_size_formatted: string;
}

interface RequirementsPageProps {
    borrowers: Borrower[];
    documentTypes: Record<string, string>;
}

const getStatusColor = (status: number) => {
    switch (status) {
        case 1: // Pending
            return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        case 2: // Confirmed
            return 'bg-green-50 text-green-700 border-green-200';
        case 3: // Declined
            return 'bg-red-50 text-red-700 border-red-200';
        default:
            return 'bg-gray-50 text-gray-700 border-gray-200';
    }
};

const getStatusText = (status: number) => {
    switch (status) {
        case 1:
            return 'Pending';
        case 2:
            return 'Confirmed';
        case 3:
            return 'Declined';
        default:
            return 'Unknown';
    }
};

export default function Requirements({ borrowers, documentTypes }: RequirementsPageProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBorrowerId, setSelectedBorrowerId] = useState<string>('');
    const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({
        government_id: null,
        proof_of_billing: null,
        proof_of_income: null,
        id_picture: null,
    });

    const { data, setData, post, processing, errors, reset } = useForm({
        borrower_id: '',
        document_type: '',
        file: null as File | null,
        notes: '',
    });

    const handleFileChange = (documentType: string, file: File | null) => {
        setSelectedFiles(prev => ({
            ...prev,
            [documentType]: file
        }));
    };

    const handleOpenModal = (borrowerId?: string) => {
        if (borrowerId) {
            setSelectedBorrowerId(borrowerId);
            setData('borrower_id', borrowerId);
        }
        setIsModalOpen(true);
    };

    const handleSubmitRequirements = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!data.borrower_id) {
            alert('Please select a borrower');
            return;
        }

        const filesToUpload = Object.entries(selectedFiles).filter(([_, file]) => file !== null);
        
        if (filesToUpload.length === 0) {
            alert('Please select at least one file to upload');
            return;
        }

        // Upload each file separately
        for (const [documentType, file] of filesToUpload) {
            if (file) {
                const formData = new FormData();
                formData.append('borrower_id', data.borrower_id);
                formData.append('document_type', documentType);
                formData.append('file', file);
                formData.append('notes', data.notes);

                try {
                    await new Promise((resolve, reject) => {
                        router.post(route('requirements.store'), formData, {
                            onSuccess: () => resolve(true),
                            onError: (errors) => reject(errors),
                            preserveState: false,
                        });
                    });
                } catch (error) {
                    console.error('Error uploading file:', error);
                    return;
                }
            }
        }

        // Reset form and close modal
        setIsModalOpen(false);
        setSelectedBorrowerId('');
        reset();
        setSelectedFiles({
            government_id: null,
            proof_of_billing: null,
            proof_of_income: null,
            id_picture: null,
        });
    };

    const handleViewBorrowerRequirements = (borrower: Borrower) => {
        router.get(route('requirements.show', borrower.id));
    };

    const confirmedBorrowers = borrowers.filter(b => b.status === 2);

    return (
        <AppLayout>
            <Head title="Requirements" />
            
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                {/* Header Section */}
                <div className="bg-white border-b border-gray-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Requirements</h1>
                                <p className="text-gray-600 mt-1">Manage borrower document requirements</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal for collecting requirements */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>Collect Requirements</DialogTitle>
                                    </DialogHeader>
                                    
                                    <form onSubmit={handleSubmitRequirements} className="space-y-6">
                                        {/* Selected Borrower Display */}
                                        {selectedBorrowerId && (
                                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                                <p className="text-sm text-blue-800">
                                                    <span className="font-medium">Collecting requirements for:</span>
                                                    {(() => {
                                                        const borrower = confirmedBorrowers.find(b => b.id.toString() === selectedBorrowerId);
                                                        return borrower ? ` ${borrower.borrower_id} - ${borrower.first_name} ${borrower.last_name}` : ' Selected Borrower';
                                                    })()}
                                                </p>
                                            </div>
                                        )}

                                        {/* File Upload Sections */}
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold">Upload Requirements</h3>
                                            
                                            {Object.entries(documentTypes).map(([key, label]) => (
                                                <div key={key} className="border rounded-lg p-4 space-y-2">
                                                    <Label className="text-sm font-medium">{label}</Label>
                                                    <Input
                                                        type="file"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={(e) => handleFileChange(key, e.target.files?.[0] || null)}
                                                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    />
                                                    {selectedFiles[key] && (
                                                        <p className="text-sm text-green-600">
                                                            Selected: {selectedFiles[key]?.name}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Notes */}
                                        <div className="space-y-2">
                                            <Label htmlFor="notes">Notes (Optional)</Label>
                                            <textarea
                                                id="notes"
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                rows={3}
                                                placeholder="Additional notes about the requirements..."
                                            />
                                            <InputError message={errors.notes} />
                                        </div>

                                        {/* Important Notes */}
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                            <div className="flex items-start space-x-2">
                                                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                                                <div className="text-sm text-amber-800">
                                                    <p className="font-semibold mb-2">Important Notes:</p>
                                                    <ul className="list-disc list-inside space-y-1">
                                                        <li>Additional documents may be requested depending on the financing type.</li>
                                                        <li>Please make sure all documents are clear and updated for faster approval.</li>
                                                        <li>Accepted file formats: PDF, JPG, JPEG, PNG (Max 10MB per file)</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Submit Button */}
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIsModalOpen(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                            >
                                                {processing ? (
                                                    <>
                                                        <Upload className="h-4 w-4 mr-2 animate-spin" />
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="h-4 w-4 mr-2" />
                                                        Upload Requirements
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                </Dialog>

                {/* Borrowers with Requirements */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {borrowers.filter(borrower => borrower.status === 2).map((borrower) => (
                            <Card key={borrower.id} className="hover:shadow-lg transition-shadow duration-200">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg">
                                                {borrower.first_name} {borrower.last_name}
                                            </CardTitle>
                                            <p className="text-sm text-gray-600">{borrower.borrower_id}</p>
                                        </div>
                                        {borrower.requirements.length === Object.keys(documentTypes).length && (
                                            <Badge className="bg-green-50 text-green-700 border-green-200">
                                                Completed
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Requirements:</span>
                                            <span className="font-semibold">
                                                {borrower.requirements.length} / {Object.keys(documentTypes).length}
                                            </span>
                                        </div>
                                        
                                        {borrower.requirements.length > 0 ? (
                                            <div className="flex items-center space-x-2 text-sm">
                                                <FileText className="h-4 w-4 text-blue-600" />                 
                                                <span className="text-gray-600">Documents uploaded</span>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No requirements uploaded yet</p>
                                        )}
                                        
                                        <div className="mt-3">
                                            <Button
                                                onClick={() => handleViewBorrowerRequirements(borrower)}
                                                variant="outline"
                                                size="sm"
                                                className="w-full"
                                            >
                                                <FolderOpen className="h-4 w-4 mr-2" />
                                                View Requirements
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    
                    {borrowers.filter(borrower => borrower.status === 2).length === 0 && (
                        <div className="text-center py-12">
                            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Confirmed Borrowers Found</h3>
                            <p className="text-gray-600">Only confirmed borrowers will appear here. Please confirm borrowers first to manage their requirements.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}