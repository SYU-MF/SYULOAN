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
    const [activeTab, setActiveTab] = useState<'no-requirements' | 'partial' | 'completed'>('no-requirements');
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

    // Helper function to categorize borrowers based on requirement completion
    const categorizeBorrowers = () => {
        const totalRequiredDocs = Object.keys(documentTypes).length;
        
        const noRequirements = confirmedBorrowers.filter(b => {
            const basicRequirements = b.requirements.filter(req => documentTypes.hasOwnProperty(req.document_type));
            return basicRequirements.length === 0;
        });
        const partialRequirements = confirmedBorrowers.filter(b => {
            const basicRequirements = b.requirements.filter(req => documentTypes.hasOwnProperty(req.document_type));
            return basicRequirements.length > 0 && basicRequirements.length < totalRequiredDocs;
        });
        const completedRequirements = confirmedBorrowers.filter(b => {
            const basicRequirements = b.requirements.filter(req => documentTypes.hasOwnProperty(req.document_type));
            return basicRequirements.length === totalRequiredDocs;
        });

        return {
            'no-requirements': noRequirements,
            'partial': partialRequirements,
            'completed': completedRequirements
        };
    };

    const categorizedBorrowers = categorizeBorrowers();
    const currentBorrowers = categorizedBorrowers[activeTab];

    return (
        <AppLayout>
            <Head title="Requirements" />
            
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Requirements</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">Manage borrower document requirements</p>
                    </div>
                </div>

                {/* Modal for collecting requirements */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    <DialogHeader>
                                        <DialogTitle className="text-gray-900 dark:text-white">Collect Requirements</DialogTitle>
                                    </DialogHeader>
                                    
                                    <form onSubmit={handleSubmitRequirements} className="space-y-6">
                                        {/* Selected Borrower Display */}
                                        {selectedBorrowerId && (
                                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                                                <p className="text-sm text-blue-800 dark:text-blue-300">
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
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Requirements</h3>
                                            
                                            {Object.entries(documentTypes).map(([key, label]) => (
                                                <div key={key} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-2 bg-gray-50 dark:bg-gray-700/50">
                                                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Label>
                                                    <Input
                                                        type="file"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={(e) => handleFileChange(key, e.target.files?.[0] || null)}
                                                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                    />
                                                    {selectedFiles[key] && (
                                                        <p className="text-sm text-green-600 dark:text-green-400">
                                                            Selected: {selectedFiles[key]?.name}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Notes */}
                                        <div className="space-y-2">
                                            <Label htmlFor="notes" className="text-gray-700 dark:text-gray-300">Notes (Optional)</Label>
                                            <textarea
                                                id="notes"
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                                rows={3}
                                                placeholder="Additional notes about the requirements..."
                                            />
                                            <InputError message={errors.notes} />
                                        </div>

                                        {/* Important Notes */}
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                            <div className="flex items-start space-x-2">
                                                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                                                <div className="text-sm text-amber-800 dark:text-amber-300">
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

                {/* Tabbed Requirements Section */}
                <div>
                    {/* Tab Navigation */}
                    <div className="mb-6">
                        <div className="border-b border-gray-200 dark:border-gray-700">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('no-requirements')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                        activeTab === 'no-requirements'
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                                >
                                    No Requirements
                                    <Badge className="ml-2 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                        {categorizedBorrowers['no-requirements'].length}
                                    </Badge>
                                </button>
                                <button
                                    onClick={() => setActiveTab('partial')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                        activeTab === 'partial'
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                                >
                                    Partial Requirements
                                    <Badge className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                                        {categorizedBorrowers['partial'].length}
                                    </Badge>
                                </button>
                                <button
                                    onClick={() => setActiveTab('completed')}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                        activeTab === 'completed'
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                                >
                                    Completed Requirements
                                    <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                        {categorizedBorrowers['completed'].length}
                                    </Badge>
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentBorrowers.map((borrower) => (
                            <Card key={borrower.id} className="hover:shadow-lg transition-shadow duration-200 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg text-gray-900 dark:text-white">
                                                {borrower.first_name} {borrower.last_name}
                                            </CardTitle>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{borrower.borrower_id}</p>
                                        </div>
                                        {activeTab === 'completed' && (
                                            <Badge className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                                                Completed
                                            </Badge>
                                        )}
                                        {activeTab === 'partial' && (
                                            <Badge className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
                                                {Math.round((borrower.requirements.filter(req => documentTypes.hasOwnProperty(req.document_type)).length / Object.keys(documentTypes).length) * 100)}% Complete
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Requirements:</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {borrower.requirements.filter(req => documentTypes.hasOwnProperty(req.document_type)).length} / {Object.keys(documentTypes).length}
                                            </span>
                                        </div>
                                        
                                        {borrower.requirements.filter(req => documentTypes.hasOwnProperty(req.document_type)).length > 0 ? (
                                            <div className="flex items-center space-x-2 text-sm">
                                                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />                 
                                                <span className="text-gray-600 dark:text-gray-400">Documents uploaded</span>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">No requirements uploaded yet</p>
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
                    
                    {/* Empty State */}
                    {currentBorrowers.length === 0 && (
                        <div className="text-center py-12">
                            <FolderOpen className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {activeTab === 'no-requirements' && 'No Borrowers Without Requirements'}
                                {activeTab === 'partial' && 'No Borrowers With Partial Requirements'}
                                {activeTab === 'completed' && 'No Borrowers With Completed Requirements'}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                {activeTab === 'no-requirements' && 'All confirmed borrowers have started uploading their requirements.'}
                                {activeTab === 'partial' && 'No borrowers currently have partial requirements uploaded.'}
                                {activeTab === 'completed' && 'No borrowers have completed all their requirements yet.'}
                            </p>
                        </div>
                    )}
                    
                    {/* No Confirmed Borrowers State */}
                    {confirmedBorrowers.length === 0 && (
                        <div className="text-center py-12">
                            <FolderOpen className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Confirmed Borrowers Found</h3>
                            <p className="text-gray-600 dark:text-gray-400">Only confirmed borrowers will appear here. Please confirm borrowers first to manage their requirements.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}