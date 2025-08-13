import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import InputError from '@/components/input-error';
import { 
    ArrowLeft,
    FileText, 
    Download,
    Edit,
    Trash2,
    Upload,
    Eye,
    Calendar,
    User,
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

interface RequirementsShowPageProps {
    borrower: Borrower;
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

export default function RequirementsShow({ borrower, documentTypes }: RequirementsShowPageProps) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        file: null as File | null,
        notes: '',
    });

    const { delete: deleteRequirement, processing: deleteProcessing } = useForm();

    const handleDownload = (requirement: Requirement) => {
        window.open(route('requirements.download', requirement.id), '_blank');
    };

    const handleEdit = (requirement: Requirement) => {
        setSelectedRequirement(requirement);
        setData({
            file: null,
            notes: requirement.notes || '',
        });
        setIsEditModalOpen(true);
    };

    const handleDelete = (requirement: Requirement) => {
        setSelectedRequirement(requirement);
        setIsDeleteModalOpen(true);
    };

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequirement) return;

        const formData = new FormData();
        if (data.file) {
            formData.append('file', data.file);
        }
        formData.append('notes', data.notes);
        formData.append('_method', 'PUT');

        router.post(route('requirements.update', selectedRequirement.id), formData, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedRequirement(null);
                reset();
            },
        });
    };

    const confirmDelete = () => {
        if (!selectedRequirement) return;
        
        deleteRequirement(route('requirements.destroy', selectedRequirement.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setSelectedRequirement(null);
            },
        });
    };

    const getDocumentIcon = (mimeType: string) => {
        if (mimeType.includes('pdf')) {
            return <FileText className="h-8 w-8 text-red-600" />;
        } else if (mimeType.includes('image')) {
            return <Eye className="h-8 w-8 text-blue-600" />;
        }
        return <FileText className="h-8 w-8 text-gray-600" />;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const uploadedDocumentTypes = borrower.requirements.map(req => req.document_type);
    const missingDocumentTypes = Object.entries(documentTypes).filter(
        ([key]) => !uploadedDocumentTypes.includes(key)
    );

    return (
        <AppLayout>
            <Head title={`Requirements - ${borrower.first_name} ${borrower.last_name}`} />
            
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                {/* Header Section */}
                <div className="bg-white border-b border-gray-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center space-x-4 mb-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get(route('requirements.index'))}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Requirements
                            </Button>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {borrower.first_name} {borrower.last_name}'s Requirements
                                </h1>
                                <div className="flex items-center space-x-4 mt-2">
                                    <p className="text-gray-600">ID: {borrower.borrower_id}</p>
                                    <Badge className={getStatusColor(borrower.status)}>
                                        {getStatusText(borrower.status)}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Borrower Info */}
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <User className="h-5 w-5" />
                                        <span>Borrower Information</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Full Name</p>
                                        <p className="font-semibold">
                                            {borrower.first_name} {borrower.middle_name} {borrower.last_name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="font-semibold">{borrower.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Phone</p>
                                        <p className="font-semibold">{borrower.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Requirements Progress</p>
                                        <div className="flex items-center space-x-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                    style={{ 
                                                        width: `${(borrower.requirements.length / Object.keys(documentTypes).length) * 100}%` 
                                                    }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-semibold">
                                                {borrower.requirements.length}/{Object.keys(documentTypes).length}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Missing Documents */}
                            {missingDocumentTypes.length > 0 && (
                                <Card className="mt-6">
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2 text-amber-700">
                                            <AlertCircle className="h-5 w-5" />
                                            <span>Missing Documents</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {missingDocumentTypes.map(([key, label]) => (
                                                <li key={key} className="flex items-center space-x-2 text-sm">
                                                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                                    <span>{label}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Requirements List */}
                        <div className="lg:col-span-2">
                            <div className="space-y-4">
                                {borrower.requirements.length > 0 ? (
                                    borrower.requirements.map((requirement) => (
                                        <Card key={requirement.id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start space-x-4 flex-1">
                                                        {getDocumentIcon(requirement.mime_type)}
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-lg">
                                                                {requirement.document_type_text}
                                                            </h3>
                                                            <p className="text-gray-600 text-sm mb-2">
                                                                {requirement.file_name}
                                                            </p>
                                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                                <span className="flex items-center space-x-1">
                                                                    <Calendar className="h-4 w-4" />
                                                                    <span>{formatDate(requirement.created_at)}</span>
                                                                </span>
                                                                <span>{requirement.file_size_formatted}</span>
                                                            </div>
                                                            {requirement.notes && (
                                                                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                                                    <p className="text-gray-700">{requirement.notes}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDownload(requirement)}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEdit(requirement)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDelete(requirement)}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                ) : (
                                    <Card>
                                        <CardContent className="text-center py-12">
                                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                No Requirements Uploaded
                                            </h3>
                                            <p className="text-gray-600">
                                                This borrower hasn't uploaded any requirements yet.
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Requirement</DialogTitle>
                    </DialogHeader>
                    
                    <form onSubmit={handleUpdateSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="file">Replace File (Optional)</Label>
                            <Input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => setData('file', e.target.files?.[0] || null)}
                                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <InputError message={errors.file} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <textarea
                                id="notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                placeholder="Additional notes..."
                            />
                            <InputError message={errors.notes} />
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {processing ? 'Updating...' : 'Update'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Requirement</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            Are you sure you want to delete this requirement? This action cannot be undone.
                        </p>
                        
                        {selectedRequirement && (
                            <div className="bg-gray-50 p-3 rounded">
                                <p className="font-semibold">{selectedRequirement.document_type_text}</p>
                                <p className="text-sm text-gray-600">{selectedRequirement.file_name}</p>
                            </div>
                        )}

                        <div className="flex justify-end space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDeleteModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmDelete}
                                disabled={deleteProcessing}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {deleteProcessing ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}