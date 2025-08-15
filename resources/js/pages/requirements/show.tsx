import React, { useState, useEffect } from 'react';
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
            return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
        case 2: // Confirmed
            return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
        case 3: // Declined
            return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
        default:
            return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
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
    const [isAddRequirementModalOpen, setIsAddRequirementModalOpen] = useState(false);
    const [uploadedCount, setUploadedCount] = useState(0);
    const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
    const [extraRequirements, setExtraRequirements] = useState<Record<string, string>>({});
    const [newRequirementName, setNewRequirementName] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm({
        file: null as File | null,
        notes: '',
    });

    const { data: collectData, setData: setCollectData, post: postCollect, processing: collectProcessing, errors: collectErrors, reset: resetCollect } = useForm({
        files: {} as Record<string, File>,
        notes: '',
    });

    const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
    const [fileNotes, setFileNotes] = useState<Record<string, string>>({});

    const { delete: deleteRequirement, processing: deleteProcessing } = useForm();

    // Load existing extra requirements when component mounts
    useEffect(() => {
        const existingExtraRequirements: Record<string, string> = {};
        
        borrower.requirements.forEach(requirement => {
            // Check if it's not a predefined document type, then it's an extra requirement
            if (!documentTypes.hasOwnProperty(requirement.document_type)) {
                // The document_type itself is the requirement name
                existingExtraRequirements[requirement.document_type] = requirement.document_type;
            }
        });
        
        setExtraRequirements(existingExtraRequirements);
    }, [borrower.requirements, documentTypes]);

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

    const handleAddExtraRequirement = () => {
        if (newRequirementName.trim()) {
            const requirementKey = newRequirementName.trim();
            setExtraRequirements(prev => ({
                ...prev,
                [requirementKey]: newRequirementName.trim()
            }));
            setNewRequirementName('');
            setIsAddRequirementModalOpen(false);
        }
    };

    const handleRemoveExtraRequirement = (requirementKey: string) => {
        setExtraRequirements(prev => {
            const newExtra = { ...prev };
            delete newExtra[requirementKey];
            return newExtra;
        });
        
        // Also remove from selected files if exists
        setSelectedFiles(prev => {
            const newFiles = { ...prev };
            delete newFiles[requirementKey];
            return newFiles;
        });
        
        // Remove from file notes
        setFileNotes(prev => {
            const newNotes = { ...prev };
            delete newNotes[requirementKey];
            return newNotes;
        });
    };

    const handleSubmitRequirements = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted!');
        console.log('Selected files:', selectedFiles);
        console.log('File notes:', fileNotes);
        console.log('Extra requirements:', extraRequirements);
        
        const formData = new FormData();
        formData.append('borrower_id', borrower.id.toString());
        formData.append('notes', collectData.notes);
        
        // Add extra requirements data
        formData.append('extra_requirements', JSON.stringify(extraRequirements));
        
        // Add individual file notes for each document type
        Object.entries(fileNotes).forEach(([documentType, note]) => {
            if (note) {
                formData.append(`file_notes[${documentType}]`, note);
            }
        });
        
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
                setFileNotes({});
                // Don't reset extraRequirements here - let useEffect handle it after page refresh
                resetCollect();
                setIsSuccessModalOpen(true);
                // Refresh the page to get updated borrower data
                router.reload({ only: ['borrower'] });
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
            return <FileText className="h-8 w-8 text-blue-600" />;
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
            
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                {/* Header Section */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
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
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {borrower.first_name} {borrower.last_name}'s Requirements
                                </h1>
                                <div className="flex items-center space-x-4 mt-2">
                                    <p className="text-gray-600 dark:text-gray-400">ID: {borrower.borrower_id}</p>
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
                            <Card className="dark:bg-gray-800 dark:border-gray-700">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                                        <User className="h-5 w-5" />
                                        <span>Borrower Information</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {borrower.first_name} {borrower.middle_name} {borrower.last_name}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{borrower.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{borrower.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Requirements Progress</p>
                                        <div className="flex items-center space-x-2">
                                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div 
                                                    className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                    style={{ 
                                                        width: `${(borrower.requirements.filter(req => documentTypes.hasOwnProperty(req.document_type)).length / Object.keys(documentTypes).length) * 100}%` 
                                                    }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {borrower.requirements.filter(req => documentTypes.hasOwnProperty(req.document_type)).length}/{Object.keys(documentTypes).length}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Missing Documents */}
                            {missingDocumentTypes.length > 0 && (
                                <Card className="mt-6 border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20">
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2 text-amber-700 dark:text-amber-300">
                                            <AlertCircle className="h-5 w-5" />
                                            <span>Missing Documents</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {missingDocumentTypes.map(([key, label]) => (
                                                <li key={key} className="flex items-center space-x-2 text-sm">
                                                    <div className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full"></div>
                                                    <span className="text-amber-700 dark:text-amber-300">{label}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Requirements List */}
                        <div className="lg:col-span-2">
                            <div className="space-y-6">
                                {borrower.requirements.length > 0 ? (
                                    <>
                                        {/* Basic Requirements Section */}
                                        {(() => {
                                            const basicRequirements = borrower.requirements.filter(req => 
                                                documentTypes.hasOwnProperty(req.document_type)
                                            );
                                            
                                            if (basicRequirements.length === 0) return null;
                                            
                                            return (
                                                <div className="space-y-4">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="h-6 w-1 bg-blue-500 rounded-full"></div>
                                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                            Basic Requirements
                                                        </h3>
                                                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                                            {basicRequirements.length}
                                                        </Badge>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {basicRequirements.map((requirement) => (
                                                            <Card key={requirement.id} className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700 border-l-4 border-l-blue-500">
                                                                <CardContent className="p-6">
                                                                    <div className="flex items-start justify-between">
                                                                        <div className="flex items-start space-x-4 flex-1">
                                                                            {getDocumentIcon(requirement.mime_type)}
                                                                            <div className="flex-1">
                                                                                <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                                                                                    {requirement.document_type.replace(/_/g, ' ')}
                                                                                </h4>
                                                                                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                                                                                    {requirement.file_name}
                                                                                </p>
                                                                                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                                                                    <span className="flex items-center space-x-1">
                                                                                        <Calendar className="h-4 w-4" />
                                                                                        <span>{formatDate(requirement.created_at)}</span>
                                                                                    </span>
                                                                                    <span>{requirement.file_size_formatted}</span>
                                                                                </div>
                                                                                {requirement.notes && (
                                                                                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                                                                                        <p className="text-gray-700 dark:text-gray-300">{requirement.notes}</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center space-x-2">
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => handleViewImage(requirement)}
                                                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20 dark:border-gray-600"
                                                                            >
                                                                                <Eye className="h-4 w-4" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => handleEdit(requirement)}
                                                                                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                                                            >
                                                                                <Edit className="h-4 w-4" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => handleDelete(requirement)}
                                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 dark:border-gray-600"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Extra Requirements Section */}
                                        {(() => {
                                            const extraRequirements = borrower.requirements.filter(req => 
                                                !documentTypes.hasOwnProperty(req.document_type)
                                            );
                                            
                                            if (extraRequirements.length === 0) return null;
                                            
                                            return (
                                                <div className="space-y-4">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="h-6 w-1 bg-green-500 rounded-full"></div>
                                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                            Extra Requirements
                                                        </h3>
                                                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                                                            {extraRequirements.length}
                                                        </Badge>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {extraRequirements.map((requirement) => (
                                                            <Card key={requirement.id} className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700 border-l-4 border-l-green-500">
                                                                <CardContent className="p-6">
                                                                    <div className="flex items-start justify-between">
                                                                        <div className="flex items-start space-x-4 flex-1">
                                                                            {getDocumentIcon(requirement.mime_type)}
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center space-x-2 mb-1">
                                                                                    <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                                                                                        {requirement.document_type.replace(/_/g, ' ')}
                                                                                    </h4>
                                                                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700">
                                                                                        Extra
                                                                                    </Badge>
                                                                                </div>
                                                                                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                                                                                    {requirement.file_name}
                                                                                </p>
                                                                                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                                                                    <span className="flex items-center space-x-1">
                                                                                        <Calendar className="h-4 w-4" />
                                                                                        <span>{formatDate(requirement.created_at)}</span>
                                                                                    </span>
                                                                                    <span>{requirement.file_size_formatted}</span>
                                                                                </div>
                                                                                {requirement.notes && (
                                                                                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm border border-green-200 dark:border-green-800">
                                                                                        <p className="text-green-700 dark:text-green-300">{requirement.notes}</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center space-x-2">
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => handleViewImage(requirement)}
                                                                                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20 dark:border-gray-600"
                                                                            >
                                                                                <Eye className="h-4 w-4" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => handleEdit(requirement)}
                                                                                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                                                            >
                                                                                <Edit className="h-4 w-4" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => handleDelete(requirement)}
                                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 dark:border-gray-600"
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </>
                                ) : (
                                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                                        <CardContent className="text-center py-12">
                                            <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                No Requirements Uploaded
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400">
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
                <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-white">Edit Requirement</DialogTitle>
                    </DialogHeader>
                    
                    <form onSubmit={handleUpdateSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="file" className="text-gray-700 dark:text-gray-300">Replace File (Optional)</Label>
                            <Input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => setData('file', e.target.files?.[0] || null)}
                                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <InputError message={errors.file} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-gray-700 dark:text-gray-300">Notes</Label>
                            <textarea
                                id="notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
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
                                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                            >
                                {processing ? 'Updating...' : 'Update'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-white">Delete Requirement</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-300">
                            Are you sure you want to delete this requirement? This action cannot be undone.
                        </p>
                        
                        {selectedRequirement && (
                            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
                                <p className="font-semibold text-gray-900 dark:text-white">{selectedRequirement.document_type_text}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRequirement.file_name}</p>
                            </div>
                        )}

                        <div className="flex justify-end space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmDelete}
                                disabled={deleteProcessing}
                                className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700"
                            >
                                {deleteProcessing ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Image Viewing Modal */}
            <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                    <DialogHeader>
                        <DialogTitle className="dark:text-white">
                            {selectedRequirement?.document_type_text}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex flex-col space-y-4">
                        {selectedRequirement && (
                            <>
                                <div className="text-sm text-gray-600 dark:text-gray-300">
                                    <p><strong>File:</strong> {selectedRequirement.file_name}</p>
                                    <p><strong>Size:</strong> {selectedRequirement.file_size_formatted}</p>
                                    <p><strong>Uploaded:</strong> {new Date(selectedRequirement.created_at).toLocaleDateString()}</p>
                                </div>
                                
                                <div className="flex justify-center bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-[60vh] overflow-auto">
                                    {selectedRequirement.mime_type.startsWith('image/') ? (
                                        <img 
                                            src={route('requirements.view', selectedRequirement.id)}
                                            alt={selectedRequirement.document_type_text}
                                            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                                            style={{ maxHeight: '50vh' }}
                                        />
                                    ) : (
                                        <div className="text-center py-12">
                                            <FileText className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                                            <p className="text-gray-600 dark:text-gray-300 mb-4">This file type cannot be previewed</p>
                                            <Button
                                                onClick={() => handleDownload(selectedRequirement)}
                                                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Download to View
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                
                                {selectedRequirement.notes && (
                                    <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Notes:</p>
                                        <p className="text-sm text-blue-700 dark:text-blue-200">{selectedRequirement.notes}</p>
                                    </div>
                                )}
                            </>
                        )}
                        
                        <div className="flex justify-end space-x-2 pt-4 border-t dark:border-gray-600">
                            {selectedRequirement && (
                                <Button
                                    variant="outline"
                                    onClick={() => handleDownload(selectedRequirement)}
                                    className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </Button>
                            )}
                            <Button
                                onClick={() => setIsImageModalOpen(false)}
                                className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-700"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Collect Requirements Modal - Enhanced Design */}
            <Dialog open={isCollectModalOpen} onOpenChange={setIsCollectModalOpen}>
                <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
                    <DialogHeader className="border-b pb-4 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Document Collection Center
                                </DialogTitle>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Upload required documents for loan processing
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-500 dark:text-gray-400">Progress</div>
                                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                                    {borrower.requirements.filter(req => documentTypes.hasOwnProperty(req.document_type)).length}/{Object.keys(documentTypes).length}
                                </div>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    <div className="overflow-y-auto max-h-[calc(95vh-200px)] pr-2">
                        <form id="collect-requirements-form" onSubmit={handleSubmitRequirements} className="space-y-6 p-6">
                            {/* Borrower Info Card */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full">
                                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-white">
                                            {borrower.first_name} {borrower.last_name}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            ID: {borrower.borrower_id} • {borrower.email}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {borrower.requirements.filter(req => documentTypes.hasOwnProperty(req.document_type)).length} of {Object.keys(documentTypes).length} completed
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                    <div 
                                        className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${(borrower.requirements.filter(req => documentTypes.hasOwnProperty(req.document_type)).length / Object.keys(documentTypes).length) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Document Upload Grid */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Required Documents</h3>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {Object.keys(documentTypes).length - borrower.requirements.filter(req => documentTypes.hasOwnProperty(req.document_type)).length} remaining
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(documentTypes).map(([key, label]) => {
                                        const existingRequirement = borrower.requirements.find(req => req.document_type === key);
                                        
                                        if (existingRequirement) {
                                            return (
                                                <div key={key} className="group relative bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-4 transition-all duration-200 hover:shadow-md">
                                                    <div className="absolute top-3 right-3">
                                                        <div className="bg-green-500 dark:bg-green-600 text-white rounded-full p-1">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div className="pr-8">
                                                        <h4 className="font-semibold text-gray-800 dark:text-white mb-2">{label}</h4>
                                                        <div className="flex items-center space-x-2 mb-2 min-w-0">
                                                            <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                            <span className="text-sm text-green-700 dark:text-green-300 font-medium truncate">
                                                {existingRequirement.file_name}
                                            </span>
                                                        </div>
                                                        <div className="flex items-center space-x-4 text-xs text-green-600 dark:text-green-400">
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
                                            <div key={key} className="group relative bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 transition-all duration-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:border-blue-500 dark:hover:bg-blue-900/20">
                                                <div className="text-center">
                                                    <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-800 transition-colors">
                                                        <Upload className="h-6 w-6 text-gray-400 dark:text-gray-300 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
                                                    </div>
                                                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">{label}</h4>
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
                                                        <div className="mt-3 space-y-3">
                                                            <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                                                                <p className="text-sm text-green-700 dark:text-green-300 font-medium truncate">
                                                                    ✓ {selectedFiles[key]?.name}
                                                                </p>
                                                                <p className="text-xs text-green-600 dark:text-green-400">
                                                                    Ready to upload
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <Label htmlFor={`notes-${key}`} className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                                                    Notes for {label} (Optional)
                                                                </Label>
                                                                <textarea
                                                                    id={`notes-${key}`}
                                                                    value={fileNotes[key] || ''}
                                                                    onChange={(e) => setFileNotes(prev => ({ ...prev, [key]: e.target.value }))}
                                                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                                                    rows={2}
                                                                    placeholder={`Add specific notes for ${label}...`}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Extra Requirements Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Extra Requirements</h3>
                                    <Button
                                        type="button"
                                        onClick={() => setIsAddRequirementModalOpen(true)}
                                        className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white text-sm px-4 py-2"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Extra Requirement
                                    </Button>
                                </div>
                                
                                {Object.keys(extraRequirements).length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(extraRequirements).map(([key, label]) => {
                                            const existingRequirement = borrower.requirements.find(req => req.document_type === key);
                                            
                                            if (existingRequirement) {
                                                return (
                                                    <div key={key} className="group relative bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-4 transition-all duration-200 hover:shadow-md">
                                                        <div className="absolute top-3 right-3">
                                                            <div className="bg-green-500 dark:bg-green-600 text-white rounded-full p-1">
                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <div className="pr-8">
                                                            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">{label}</h4>
                                                            <div className="flex items-center space-x-2 mb-2 min-w-0">
                                                                <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                                <span className="text-sm text-green-700 dark:text-green-300 font-medium truncate">
                                                                    {existingRequirement.file_name}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center space-x-4 text-xs text-green-600 dark:text-green-400">
                                                                <span className="flex items-center space-x-1">
                                                                    <Calendar className="h-3 w-3" />
                                                                    <span>{new Date(existingRequirement.created_at).toLocaleDateString()}</span>
                                                                </span>
                                                                <span>{existingRequirement.file_size_formatted}</span>
                                                            </div>

                                                        </div>
                                                    </div>
                                                );
                                            }
                                            
                                            return (
                                                <div key={key} className="group relative bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 transition-all duration-200 hover:border-green-400 hover:bg-green-50 dark:hover:border-green-500 dark:hover:bg-green-900/20">
                                                    <div className="absolute top-2 right-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleRemoveExtraRequirement(key)}
                                                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                    <div className="text-center pr-8">
                                                        <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center mb-3 group-hover:bg-green-100 dark:group-hover:bg-green-800 transition-colors">
                                                            <Upload className="h-6 w-6 text-gray-400 dark:text-gray-300 group-hover:text-green-500 dark:group-hover:text-green-400" />
                                                        </div>
                                                        <h4 className="font-semibold text-gray-800 dark:text-white mb-2">{label}</h4>
                                                        <Input
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            onChange={(e) => handleFileChange(key, e.target.files?.[0] || null)}
                                                            className="hidden"
                                                            id={`file-${key}`}
                                                        />
                                                        <label 
                                                            htmlFor={`file-${key}`}
                                                            className="cursor-pointer inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                                                        >
                                                            <Upload className="h-4 w-4 mr-2" />
                                                            Choose File
                                                        </label>
                                                        {selectedFiles[key] && (
                                                            <div className="mt-3 space-y-3">
                                                                <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                                                                    <p className="text-sm text-green-700 dark:text-green-300 font-medium truncate">
                                                                        ✓ {selectedFiles[key]?.name}
                                                                    </p>
                                                                    <p className="text-xs text-green-600 dark:text-green-400">
                                                                        Ready to upload
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <Label htmlFor={`notes-${key}`} className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                                                                        Notes for {label} (Optional)
                                                                    </Label>
                                                                    <textarea
                                                                        id={`notes-${key}`}
                                                                        value={fileNotes[key] || ''}
                                                                        onChange={(e) => setFileNotes(prev => ({ ...prev, [key]: e.target.value }))}
                                                                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-transparent resize-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                                                        rows={2}
                                                                        placeholder={`Add specific notes for ${label}...`}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                                        <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                                            No extra requirements added yet. Click "Add Extra Requirement" to add custom document requirements.
                                        </p>
                                    </div>
                                )}
                            </div>



                            {/* Enhanced Guidelines */}
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
                                <div className="flex items-start space-x-3">
                                    <div className="bg-amber-100 dark:bg-amber-800 p-2 rounded-full flex-shrink-0">
                                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-3">Document Guidelines</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-amber-700 dark:text-amber-300">
                                            <div className="flex items-start space-x-2">
                                                <span className="text-amber-500 dark:text-amber-400">•</span>
                                                <span>Ensure documents are clear and legible</span>
                                            </div>
                                            <div className="flex items-start space-x-2">
                                                <span className="text-amber-500 dark:text-amber-400">•</span>
                                                <span>Maximum file size: 10MB per document</span>
                                            </div>
                                            <div className="flex items-start space-x-2">
                                                <span className="text-amber-500 dark:text-amber-400">•</span>
                                                <span>Accepted formats: PDF, JPG, JPEG, PNG</span>
                                            </div>
                                            <div className="flex items-start space-x-2">
                                                <span className="text-amber-500 dark:text-amber-400">•</span>
                                                <span>Use recent documents for faster approval</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Enhanced Footer */}
                    <div className="border-t pt-4 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 -mx-6 -mb-6 px-6 pb-6">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {Object.values(selectedFiles).filter(Boolean).length > 0 && (
                                    <span className="text-green-600 dark:text-green-400 font-medium">
                                        {Object.values(selectedFiles).filter(Boolean).length} file(s) ready to upload
                                    </span>
                                )}
                            </div>
                            <div className="flex space-x-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCollectModalOpen(false)}
                                    className="px-6 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    form="collect-requirements-form"
                                    disabled={collectProcessing || Object.values(selectedFiles).filter(Boolean).length === 0}
                                    className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-600 dark:to-purple-600 dark:hover:from-blue-700 dark:hover:to-purple-700 disabled:opacity-50"
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
                <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:border-gray-700">
                    <div className="text-center py-6">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Documents Uploaded Successfully!
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            {uploadedCount} document(s) have been uploaded and are now being processed.
                        </p>
                        <Button
                            onClick={() => {
                                setIsSuccessModalOpen(false);
                                router.reload();
                            }}
                            className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white px-6"
                        >
                            Continue
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Extra Requirement Modal */}
            <Dialog open={isAddRequirementModalOpen} onOpenChange={setIsAddRequirementModalOpen}>
                <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:border-gray-700">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-white">
                            Add Extra Requirement
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="requirement-name" className="text-gray-700 dark:text-gray-300">
                                Requirement Name
                            </Label>
                            <Input
                                id="requirement-name"
                                type="text"
                                value={newRequirementName}
                                onChange={(e) => setNewRequirementName(e.target.value)}
                                placeholder="Enter requirement name"
                                className="mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsAddRequirementModalOpen(false);
                                    setNewRequirementName('');
                                }}
                                className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleAddExtraRequirement}
                                disabled={!newRequirementName.trim()}
                                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
                            >
                                Add Requirement
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}