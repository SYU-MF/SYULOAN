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
    AlertCircle,
    Plus,
    CheckCircle
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
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isCollectModalOpen, setIsCollectModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [uploadedCount, setUploadedCount] = useState(0);
    const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        file: null as File | null,
        notes: '',
    });

    const { data: collectData, setData: setCollectData, post: postCollect, processing: collectProcessing, errors: collectErrors, reset: resetCollect } = useForm({
        files: {} as Record<string, File>,
        notes: '',
    });

    const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});

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

    const handleViewImage = (requirement: Requirement) => {
        setSelectedRequirement(requirement);
        setIsImageModalOpen(true);
    };

    const handleFileChange = (documentType: string, file: File | null) => {
        if (file) {
            setSelectedFiles(prev => ({ ...prev, [documentType]: file }));
            setCollectData('files', { ...collectData.files, [documentType]: file });
        } else {
            const newFiles = { ...selectedFiles };
            delete newFiles[documentType];
            setSelectedFiles(newFiles);
            
            const newFormFiles = { ...collectData.files };
            delete newFormFiles[documentType];
            setCollectData('files', newFormFiles);
        }
    };

    const handleSubmitRequirements = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted!');
        console.log('Selected files:', selectedFiles);
        
        const formData = new FormData();
        formData.append('borrower_id', borrower.id.toString());
        formData.append('notes', collectData.notes);
        
        Object.entries(selectedFiles).forEach(([documentType, file]) => {
            formData.append(`files[${documentType}]`, file);
        });
        
        console.log('Sending request to:', route('requirements.store'));
        
        router.post(route('requirements.store'), formData, {
            onSuccess: () => {
                console.log('Upload successful!');
                const count = Object.values(selectedFiles).filter(Boolean).length;
                setUploadedCount(count);
                setIsCollectModalOpen(false);
                setSelectedFiles({});
                resetCollect();
                setIsSuccessModalOpen(true);
            },
            onError: (errors) => {
                console.log('Upload failed:', errors);
            },
        });
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
                            <div>
                                <Button
                                    onClick={() => setIsCollectModalOpen(true)}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Collect Requirements
                                </Button>
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
                                                            onClick={() => handleViewImage(requirement)}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <Eye className="h-4 w-4" />
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

            {/* Image Viewing Modal */}
            <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedRequirement?.document_type_text}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex flex-col space-y-4">
                        {selectedRequirement && (
                            <>
                                <div className="text-sm text-gray-600">
                                    <p><strong>File:</strong> {selectedRequirement.file_name}</p>
                                    <p><strong>Size:</strong> {selectedRequirement.file_size_formatted}</p>
                                    <p><strong>Uploaded:</strong> {new Date(selectedRequirement.created_at).toLocaleDateString()}</p>
                                </div>
                                
                                <div className="flex justify-center bg-gray-50 rounded-lg p-4 max-h-[60vh] overflow-auto">
                                    {selectedRequirement.mime_type.startsWith('image/') ? (
                                        <img 
                                            src={route('requirements.view', selectedRequirement.id)}
                                            alt={selectedRequirement.document_type_text}
                                            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                            style={{ maxHeight: '50vh' }}
                                        />
                                    ) : (
                                        <div className="text-center py-12">
                                            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-600 mb-4">This file type cannot be previewed</p>
                                            <Button
                                                onClick={() => handleDownload(selectedRequirement)}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Download to View
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                
                                {selectedRequirement.notes && (
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <p className="text-sm font-medium text-blue-800 mb-1">Notes:</p>
                                        <p className="text-sm text-blue-700">{selectedRequirement.notes}</p>
                                    </div>
                                )}
                            </>
                        )}
                        
                        <div className="flex justify-end space-x-2 pt-4 border-t">
                            {selectedRequirement && (
                                <Button
                                    variant="outline"
                                    onClick={() => handleDownload(selectedRequirement)}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </Button>
                            )}
                            <Button
                                onClick={() => setIsImageModalOpen(false)}
                                className="bg-gray-600 hover:bg-gray-700"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Collect Requirements Modal - Enhanced Design */}
            <Dialog open={isCollectModalOpen} onOpenChange={setIsCollectModalOpen}>
                <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden">
                    <DialogHeader className="border-b pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Document Collection Center
                                </DialogTitle>
                                <p className="text-sm text-gray-600 mt-1">
                                    Upload required documents for loan processing
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-500">Progress</div>
                                <div className="text-lg font-semibold text-blue-600">
                                    {borrower.requirements.length}/{Object.keys(documentTypes).length}
                                </div>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    <div className="overflow-y-auto max-h-[calc(95vh-200px)] pr-2">
                        <form id="collect-requirements-form" onSubmit={handleSubmitRequirements} className="space-y-6 p-6">
                            {/* Borrower Info Card */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-100 p-2 rounded-full">
                                        <User className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            {borrower.first_name} {borrower.last_name}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            ID: {borrower.borrower_id} • {borrower.email}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                                    <span className="text-sm text-gray-600">
                                        {borrower.requirements.length} of {Object.keys(documentTypes).length} completed
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${(borrower.requirements.length / Object.keys(documentTypes).length) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Document Upload Grid */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-semibold text-gray-800">Required Documents</h3>
                                    <div className="text-sm text-gray-500">
                                        {Object.keys(documentTypes).length - borrower.requirements.length} remaining
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(documentTypes).map(([key, label]) => {
                                        const existingRequirement = borrower.requirements.find(req => req.document_type === key);
                                        
                                        if (existingRequirement) {
                                            return (
                                                <div key={key} className="group relative bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 transition-all duration-200 hover:shadow-md">
                                                    <div className="absolute top-3 right-3">
                                                        <div className="bg-green-500 text-white rounded-full p-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div className="pr-8">
                                                        <h4 className="font-semibold text-gray-800 mb-2">{label}</h4>
                                                        <div className="flex items-center space-x-2 mb-2 min-w-0">
                                                            <FileText className="h-4 w-4 text-green-600" />
                                                            <span className="text-sm text-green-700 font-medium truncate">
                                                {existingRequirement.file_name}
                                            </span>
                                                        </div>
                                                        <div className="flex items-center space-x-4 text-xs text-green-600">
                                                            <span className="flex items-center space-x-1">
                                                                <Calendar className="h-3 w-3" />
                                                                <span>{new Date(existingRequirement.created_at).toLocaleDateString()}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        
                                        return (
                                            <div key={key} className="group relative bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 transition-all duration-200 hover:border-blue-400 hover:bg-blue-50">
                                                <div className="text-center">
                                                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                                                        <Upload className="h-6 w-6 text-gray-400 group-hover:text-blue-500" />
                                                    </div>
                                                    <h4 className="font-semibold text-gray-800 mb-2">{label}</h4>
                                                    <Input
                                                        type="file"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        onChange={(e) => handleFileChange(key, e.target.files?.[0] || null)}
                                                        className="hidden"
                                                        id={`file-${key}`}
                                                    />
                                                    <label 
                                                        htmlFor={`file-${key}`}
                                                        className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                                    >
                                                        <Upload className="h-4 w-4 mr-2" />
                                                        Choose File
                                                    </label>
                                                    {selectedFiles[key] && (
                                                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                                                            <p className="text-sm text-green-700 font-medium truncate">
                                                                ✓ {selectedFiles[key]?.name}
                                                            </p>
                                                            <p className="text-xs text-green-600">
                                                                Ready to upload
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Enhanced Notes Section */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <Label htmlFor="collect-notes" className="text-sm font-semibold text-gray-700 mb-2 block">
                                    Additional Notes (Optional)
                                </Label>
                                <textarea
                                    id="collect-notes"
                                    value={collectData.notes}
                                    onChange={(e) => setCollectData('notes', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                                    rows={3}
                                    placeholder="Add any additional information or special instructions..."
                                />
                                <InputError message={collectErrors.notes} />
                            </div>

                            {/* Enhanced Guidelines */}
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                                <div className="flex items-start space-x-3">
                                    <div className="bg-amber-100 p-2 rounded-full flex-shrink-0">
                                        <AlertCircle className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-amber-800 mb-3">Document Guidelines</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-amber-700">
                                            <div className="flex items-start space-x-2">
                                                <span className="text-amber-500">•</span>
                                                <span>Ensure documents are clear and legible</span>
                                            </div>
                                            <div className="flex items-start space-x-2">
                                                <span className="text-amber-500">•</span>
                                                <span>Maximum file size: 10MB per document</span>
                                            </div>
                                            <div className="flex items-start space-x-2">
                                                <span className="text-amber-500">•</span>
                                                <span>Accepted formats: PDF, JPG, JPEG, PNG</span>
                                            </div>
                                            <div className="flex items-start space-x-2">
                                                <span className="text-amber-500">•</span>
                                                <span>Use recent documents for faster approval</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Enhanced Footer */}
                    <div className="border-t pt-4 bg-gray-50 -mx-6 -mb-6 px-6 pb-6">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
                                {Object.values(selectedFiles).filter(Boolean).length > 0 && (
                                    <span className="text-green-600 font-medium">
                                        {Object.values(selectedFiles).filter(Boolean).length} file(s) ready to upload
                                    </span>
                                )}
                            </div>
                            <div className="flex space-x-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCollectModalOpen(false)}
                                    className="px-6"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    form="collect-requirements-form"
                                    disabled={collectProcessing || Object.values(selectedFiles).filter(Boolean).length === 0}
                                    className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                                >
                                    {collectProcessing ? (
                                        <>
                                            <Upload className="h-4 w-4 mr-2 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4 mr-2" />
                                            Upload {Object.values(selectedFiles).filter(Boolean).length} Document(s)
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Success Modal */}
            <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <div className="text-center py-6">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Documents Uploaded Successfully!
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {uploadedCount} document(s) have been uploaded and are now being processed.
                        </p>
                        <Button
                            onClick={() => {
                                setIsSuccessModalOpen(false);
                                router.reload();
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-6"
                        >
                            Continue
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}