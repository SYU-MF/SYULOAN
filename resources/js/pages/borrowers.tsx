import React, { useState, useMemo } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import InputError from '@/components/input-error';
import { 
    Search, 
    Filter, 
    Plus, 
    Users, 
    CreditCard, 
    Eye, 
    Edit, 
    Trash2,
    Grid3X3,
    List,
    TrendingUp,
    DollarSign,
    UserCheck,
    CheckCircle,
    Clock
} from 'lucide-react';

interface Borrower {
    id: number;
    borrower_id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    gender?: string;
    nationality?: string;
    civil_status?: string;
    email: string;
    phone: string;
    date_of_birth: string;
    address: string;
    occupation: string;
    monthly_income: number;
    status: number; // 1 = pending, 2 = confirmed, 3 = declined
    created_at: string;
    updated_at: string;
}

interface BorrowersPageProps {
    borrowers: {
        data: Borrower[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const formatFullName = (firstName: string, middleName?: string, lastName?: string) => {
    const parts = [firstName];
    if (middleName) parts.push(middleName);
    if (lastName) parts.push(lastName);
    return parts.join(' ');
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

export default function Borrowers({ borrowers }: BorrowersPageProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isSuccessAlertOpen, setIsSuccessAlertOpen] = useState(false);
    const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        middle_name: '',
        last_name: '',
        gender: '',
        nationality: '',
        civil_status: '',
        email: '',
        phone: '',
        date_of_birth: '',
        address: '',
        occupation: '',
        monthly_income: '',
    });

    const { 
        data: editData, 
        setData: setEditData, 
        put, 
        processing: editProcessing, 
        errors: editErrors, 
        reset: resetEdit 
    } = useForm({
        first_name: '',
        middle_name: '',
        last_name: '',
        gender: '',
        nationality: '',
        civil_status: '',
        email: '',
        phone: '',
        date_of_birth: '',
        address: '',
        occupation: '',
        monthly_income: '',
    });

    const { 
        delete: deleteBorrower, 
        processing: deleteProcessing 
    } = useForm();

    const { 
        patch: confirmBorrower, 
        processing: confirmProcessing 
    } = useForm();

    const { 
        patch: declineBorrower, 
        processing: declineProcessing 
    } = useForm();

    const filteredBorrowers = useMemo(() => {
        return borrowers.data.filter(borrower => {
            const matchesSearch = 
                borrower.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                borrower.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                borrower.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                borrower.borrower_id.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === 'all' || 
                (statusFilter === 'pending' && borrower.status === 1) ||
                (statusFilter === 'confirmed' && borrower.status === 2) ||
                (statusFilter === 'declined' && borrower.status === 3);
            
            return matchesSearch && matchesStatus;
        });
    }, [borrowers.data, searchTerm, statusFilter]);

    const statistics = useMemo(() => {
        const totalBorrowers = borrowers.data.length;
        const confirmedBorrowers = borrowers.data.filter(b => b.status === 2).length;
        const pendingBorrowers = borrowers.data.filter(b => b.status === 1).length;

        return {
            totalBorrowers,
            confirmedBorrowers,
            pendingBorrowers,
        };
    }, [borrowers.data]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('borrowers.store'), {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedBorrower) {
            put(route('borrowers.update', selectedBorrower.id), {
                onSuccess: () => {
                    closeModals();
                    resetEdit();
                },
            });
        }
    };

    const handleView = (borrower: Borrower) => {
        setSelectedBorrower(borrower);
        setIsViewModalOpen(true);
    };

    const handleEdit = (borrower: Borrower) => {
        setSelectedBorrower(borrower);
        setEditData({
            first_name: borrower.first_name,
            middle_name: borrower.middle_name || '',
            last_name: borrower.last_name,
            gender: borrower.gender || '',
            nationality: borrower.nationality || '',
            civil_status: borrower.civil_status || '',
            email: borrower.email,
            phone: borrower.phone,
            date_of_birth: borrower.date_of_birth,
            address: borrower.address,
            occupation: borrower.occupation,
            monthly_income: borrower.monthly_income.toString(),
        });
        setIsEditModalOpen(true);
    };

    const handleDelete = (borrower: Borrower) => {
        setSelectedBorrower(borrower);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (selectedBorrower) {
            deleteBorrower(route('borrowers.destroy', selectedBorrower.id), {
                onSuccess: () => {
                    closeModals();
                },
            });
        }
    };

    const handleConfirm = (borrower: Borrower) => {
        setSelectedBorrower(borrower);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmConfirmed = () => {
        if (selectedBorrower) {
            confirmBorrower(route('borrowers.confirm', selectedBorrower.id), {
                onSuccess: () => {
                    setIsConfirmModalOpen(false);
                    setIsSuccessAlertOpen(true);
                    // Auto-hide success alert after 1 second
                    setTimeout(() => {
                        setIsSuccessAlertOpen(false);
                        closeModals();
                    }, 1000);
                },
            });
        }
    };

    const handleDecline = (borrower: Borrower) => {
        declineBorrower(route('borrowers.decline', borrower.id), {
            onSuccess: () => {
                closeModals();
            },
        });
    };

    const closeModals = () => {
        setIsModalOpen(false);
        setIsEditModalOpen(false);
        setIsViewModalOpen(false);
        setIsDeleteModalOpen(false);
        setIsConfirmModalOpen(false);
        setIsSuccessAlertOpen(false);
        setSelectedBorrower(null);
        reset();
        resetEdit();
    };

    return (
        <AppLayout>
            <Head title="Borrowers" />
            
            <div className="space-y-6 p-4 md:p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Borrowers</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">Manage and track all borrower information</p>
                    </div>
                    <Button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Borrower
                    </Button>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-100 text-sm font-medium">Total Borrowers</p>
                                        <p className="text-3xl font-bold">{statistics.totalBorrowers}</p>
                                    </div>
                                    <Users className="h-8 w-8 text-blue-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-100 text-sm font-medium">Confirmed Borrowers</p>
                                        <p className="text-3xl font-bold">{statistics.confirmedBorrowers}</p>
                                    </div>
                                    <UserCheck className="h-8 w-8 text-green-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-orange-100 text-sm font-medium">Pending Applications</p>
                                        <p className="text-3xl font-bold">{statistics.pendingBorrowers}</p>
                                    </div>
                                    <Clock className="h-8 w-8 text-orange-200" />
                                </div>
                            </CardContent>
                        </Card>
                </div>

                {/* Search and Filter Bar */}
                <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                            <div className="flex flex-col sm:flex-row gap-4 flex-1">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        type="text"
                                        placeholder="Search borrowers..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                                    />
                                </div>
                                
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-full sm:w-48">
                                        <Filter className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                        <SelectItem value="declined">Declined</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                    <Button
                                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('grid')}
                                        className={viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}
                                    >
                                        <Grid3X3 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={viewMode === 'table' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('table')}
                                        className={viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}
                                    >
                                        <List className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Borrowers Display */}
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredBorrowers.map((borrower) => (
                                <Card key={borrower.id} className="hover:shadow-lg transition-all duration-200 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {borrower.first_name} {borrower.last_name}
                                                </CardTitle>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ID: {borrower.borrower_id}</p>
                                            </div>
                                            <Badge className={getStatusColor(borrower.status)}>
                                                {getStatusText(borrower.status)}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-3">
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                <CreditCard className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                                                <span>{borrower.email}</span>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                <DollarSign className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                                                <span className="font-medium text-green-600 dark:text-green-400">
                                                    {formatCurrency(borrower.monthly_income)}/month
                                                </span>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                <Users className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                                                <span>{borrower.occupation}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleView(borrower)}
                                                className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(borrower)}
                                                className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(borrower)}
                                                className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Borrower
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Contact
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Occupation
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Monthly Income
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {filteredBorrowers.map((borrower) => (
                                                <tr key={borrower.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {borrower.first_name} {borrower.last_name}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                ID: {borrower.borrower_id}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900 dark:text-white">{borrower.email}</div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">{borrower.phone}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                        {borrower.occupation}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                                                        {formatCurrency(borrower.monthly_income)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Badge className={getStatusColor(borrower.status)}>
                                                            {borrower.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleView(borrower)}
                                                                className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleEdit(borrower)}
                                                                className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleDelete(borrower)}
                                                                className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {filteredBorrowers.length === 0 && (
                        <Card className="text-center py-12 shadow-sm border-gray-200">
                            <CardContent>
                                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No borrowers found</h3>
                                <p className="text-gray-500 mb-4">
                                    {searchTerm || statusFilter !== 'all' 
                                        ? 'Try adjusting your search or filter criteria.' 
                                        : 'Get started by adding your first borrower.'}
                                </p>
                                {!searchTerm && statusFilter === 'all' && (
                                    <Button 
                                        onClick={() => setIsModalOpen(true)}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add First Borrower
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Add New Borrower Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="w-full max-w-4xl mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-2xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Borrower</h3>
                                        <p className="text-gray-600 dark:text-gray-300 mt-1">Enter borrower information to create a new profile</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsModalOpen(false)}
                                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                    >
                                        ×
                                    </Button>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Personal Information */}
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            Personal Information
                                        </h4>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="first_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name</Label>
                                                <Input
                                                    id="first_name"
                                                    type="text"
                                                    value={data.first_name}
                                                    onChange={(e) => setData('first_name', e.target.value)}
                                                    className="mt-1"
                                                    required
                                                />
                                                <InputError message={errors.first_name} />
                                            </div>

                                            <div>
                                                <Label htmlFor="middle_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Middle Name</Label>
                                                <Input
                                                    id="middle_name"
                                                    type="text"
                                                    value={data.middle_name}
                                                    onChange={(e) => setData('middle_name', e.target.value)}
                                                    className="mt-1"
                                                />
                                                <InputError message={errors.middle_name} />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="last_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</Label>
                                            <Input
                                                id="last_name"
                                                type="text"
                                                value={data.last_name}
                                                onChange={(e) => setData('last_name', e.target.value)}
                                                className="mt-1"
                                                required
                                            />
                                            <InputError message={errors.last_name} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="gender" className="text-sm font-medium text-gray-700 dark:text-gray-300">Gender</Label>
                                                <Select value={data.gender} onValueChange={(value) => setData('gender', value)}>
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Male">Male</SelectItem>
                                                        <SelectItem value="Female">Female</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={errors.gender} />
                                            </div>

                                            <div>
                                                <Label htmlFor="nationality" className="text-sm font-medium text-gray-700 dark:text-gray-300">Nationality</Label>
                                                <Input
                                                    id="nationality"
                                                    type="text"
                                                    value={data.nationality}
                                                    onChange={(e) => setData('nationality', e.target.value)}
                                                    className="mt-1"
                                                    placeholder="e.g., Filipino"
                                                />
                                                <InputError message={errors.nationality} />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="civil_status" className="text-sm font-medium text-gray-700 dark:text-gray-300">Civil Status</Label>
                                            <Select value={data.civil_status} onValueChange={(value) => setData('civil_status', value)}>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Select civil status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Single">Single</SelectItem>
                                                    <SelectItem value="Married">Married</SelectItem>
                                                    <SelectItem value="Divorced">Divorced</SelectItem>
                                                    <SelectItem value="Widowed">Widowed</SelectItem>
                                                    <SelectItem value="Separated">Separated</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <InputError message={errors.civil_status} />
                                        </div>

                                        <div>
                                            <Label htmlFor="date_of_birth" className="text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</Label>
                                            <Input
                                                id="date_of_birth"
                                                type="date"
                                                value={data.date_of_birth}
                                                onChange={(e) => setData('date_of_birth', e.target.value)}
                                                className="mt-1"
                                                required
                                            />
                                            <InputError message={errors.date_of_birth} />
                                        </div>

                                        <div>
                                            <Label htmlFor="address" className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</Label>
                                            <Input
                                                id="address"
                                                type="text"
                                                value={data.address}
                                                onChange={(e) => setData('address', e.target.value)}
                                                className="mt-1"
                                                required
                                            />
                                            <InputError message={errors.address} />
                                        </div>
                                    </div>

                                    {/* Contact & Financial Information */}
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <CreditCard className="h-5 w-5" />
                                            Contact & Financial Details
                                        </h4>

                                        <div>
                                            <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                className="mt-1"
                                                required
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div>
                                            <Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                className="mt-1"
                                                required
                                            />
                                            <InputError message={errors.phone} />
                                        </div>

                                        <div>
                                            <Label htmlFor="occupation" className="text-sm font-medium text-gray-700 dark:text-gray-300">Occupation</Label>
                                            <Input
                                                id="occupation"
                                                type="text"
                                                value={data.occupation}
                                                onChange={(e) => setData('occupation', e.target.value)}
                                                className="mt-1"
                                                required
                                            />
                                            <InputError message={errors.occupation} />
                                        </div>

                                        <div>
                                            <Label htmlFor="monthly_income" className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Income</Label>
                                            <Input
                                                id="monthly_income"
                                                type="number"
                                                value={data.monthly_income}
                                                onChange={(e) => setData('monthly_income', e.target.value)}
                                                className="mt-1"
                                                required
                                            />
                                            <InputError message={errors.monthly_income} />
                                        </div>


                                    </div>
                                </div>

                                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={processing}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 px-6"
                                    >
                                        {processing ? 'Creating...' : 'Create Borrower'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* View Borrower Modal */}
                {isViewModalOpen && selectedBorrower && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-2xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Borrower Details</h3>
                                        <p className="text-gray-600 dark:text-gray-300 mt-1">View borrower information</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={closeModals}
                                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                    >
                                        ×
                                    </Button>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            Personal Information
                                        </h4>
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                                                <p className="text-gray-900 dark:text-white">
                                                    {formatFullName(selectedBorrower.first_name, selectedBorrower.middle_name, selectedBorrower.last_name)}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Borrower ID</label>
                                                <p className="text-gray-900 dark:text-white">{selectedBorrower.borrower_id}</p>
                                            </div>
                                            {selectedBorrower.gender && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</label>
                                                    <p className="text-gray-900 dark:text-white">{selectedBorrower.gender}</p>
                                                </div>
                                            )}
                                            {selectedBorrower.nationality && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nationality</label>
                                                    <p className="text-gray-900 dark:text-white">{selectedBorrower.nationality}</p>
                                                </div>
                                            )}
                                            {selectedBorrower.civil_status && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Civil Status</label>
                                                    <p className="text-gray-900 dark:text-white">{selectedBorrower.civil_status}</p>
                                                </div>
                                            )}
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</label>
                                                <p className="text-gray-900 dark:text-white">{formatDate(selectedBorrower.date_of_birth)}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
                                                <p className="text-gray-900 dark:text-white">{selectedBorrower.address}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <CreditCard className="h-5 w-5" />
                                            Contact & Financial Details
                                        </h4>
                                        
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                                                <p className="text-gray-900 dark:text-white">{selectedBorrower.email}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                                                <p className="text-gray-900 dark:text-white">{selectedBorrower.phone}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Occupation</label>
                                                <p className="text-gray-900 dark:text-white">{selectedBorrower.occupation}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Income</label>
                                                <p className="text-green-600 dark:text-green-400 font-semibold">{formatCurrency(selectedBorrower.monthly_income)}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedBorrower.status)}`}>
                                                    {getStatusText(selectedBorrower.status)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                        variant="outline"
                                        onClick={closeModals}
                                        className="px-6 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        Close
                                    </Button>
                                    
                                    {/* Show confirm/decline buttons only for pending borrowers */}
                                    {selectedBorrower.status === 1 && (
                                        <>
                                            <Button
                                                onClick={() => handleDecline(selectedBorrower)}
                                                disabled={declineProcessing}
                                                className="bg-red-600 hover:bg-red-700 px-6 dark:bg-red-700 dark:hover:bg-red-800"
                                            >
                                                {declineProcessing ? 'Declining...' : 'Decline'}
                                            </Button>
                                            <Button
                                                onClick={() => handleConfirm(selectedBorrower)}
                                                disabled={confirmProcessing}
                                                className="bg-green-600 hover:bg-green-700 px-6 dark:bg-green-700 dark:hover:bg-green-800"
                                            >
                                                {confirmProcessing ? 'Confirming...' : 'Confirm'}
                                            </Button>
                                        </>
                                    )}
                                    
                                    <Button 
                                        onClick={() => {
                                            closeModals();
                                            handleEdit(selectedBorrower);
                                        }}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-700 dark:to-purple-700 dark:hover:from-blue-800 dark:hover:to-purple-800 px-6"
                                    >
                                        Edit Borrower
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Borrower Modal */}
                {isEditModalOpen && selectedBorrower && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="w-full max-w-4xl mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-2xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Borrower</h3>
                                        <p className="text-gray-600 dark:text-gray-300 mt-1">Update borrower information</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={closeModals}
                                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                                    >
                                        ×
                                    </Button>
                                </div>
                            </div>

                            <form onSubmit={handleEditSubmit} className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Personal Information */}
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            Personal Information
                                        </h4>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="edit_first_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name</Label>
                                                <Input
                                                    id="edit_first_name"
                                                    type="text"
                                                    value={editData.first_name}
                                                    onChange={(e) => setEditData('first_name', e.target.value)}
                                                    className="mt-1"
                                                    required
                                                />
                                                <InputError message={editErrors.first_name} />
                                            </div>

                                            <div>
                                                <Label htmlFor="edit_middle_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Middle Name</Label>
                                                <Input
                                                    id="edit_middle_name"
                                                    type="text"
                                                    value={editData.middle_name}
                                                    onChange={(e) => setEditData('middle_name', e.target.value)}
                                                    className="mt-1"
                                                />
                                                <InputError message={editErrors.middle_name} />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="edit_last_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</Label>
                                            <Input
                                                id="edit_last_name"
                                                type="text"
                                                value={editData.last_name}
                                                onChange={(e) => setEditData('last_name', e.target.value)}
                                                className="mt-1"
                                                required
                                            />
                                            <InputError message={editErrors.last_name} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="edit_gender" className="text-sm font-medium text-gray-700 dark:text-gray-300">Gender</Label>
                                                <Select value={editData.gender} onValueChange={(value) => setEditData('gender', value)}>
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Male">Male</SelectItem>
                                                        <SelectItem value="Female">Female</SelectItem>
                                                        <SelectItem value="Other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <InputError message={editErrors.gender} />
                                            </div>

                                            <div>
                                                <Label htmlFor="edit_nationality" className="text-sm font-medium text-gray-700 dark:text-gray-300">Nationality</Label>
                                                <Input
                                                    id="edit_nationality"
                                                    type="text"
                                                    value={editData.nationality}
                                                    onChange={(e) => setEditData('nationality', e.target.value)}
                                                    className="mt-1"
                                                    placeholder="e.g., Filipino"
                                                />
                                                <InputError message={editErrors.nationality} />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="edit_civil_status" className="text-sm font-medium text-gray-700 dark:text-gray-300">Civil Status</Label>
                                            <Select value={editData.civil_status} onValueChange={(value) => setEditData('civil_status', value)}>
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue placeholder="Select civil status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Single">Single</SelectItem>
                                                    <SelectItem value="Married">Married</SelectItem>
                                                    <SelectItem value="Divorced">Divorced</SelectItem>
                                                    <SelectItem value="Widowed">Widowed</SelectItem>
                                                    <SelectItem value="Separated">Separated</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <InputError message={editErrors.civil_status} />
                                        </div>

                                        <div>
                                            <Label htmlFor="edit_date_of_birth" className="text-sm font-medium text-gray-700 dark:text-gray-300">Date of Birth</Label>
                                            <Input
                                                id="edit_date_of_birth"
                                                type="date"
                                                value={editData.date_of_birth}
                                                onChange={(e) => setEditData('date_of_birth', e.target.value)}
                                                className="mt-1"
                                                required
                                            />
                                            <InputError message={editErrors.date_of_birth} />
                                        </div>

                                        <div>
                                            <Label htmlFor="edit_address" className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</Label>
                                            <Input
                                                id="edit_address"
                                                type="text"
                                                value={editData.address}
                                                onChange={(e) => setEditData('address', e.target.value)}
                                                className="mt-1"
                                                required
                                            />
                                            <InputError message={editErrors.address} />
                                        </div>
                                    </div>

                                    {/* Contact & Financial Information */}
                                    <div className="space-y-4">
                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <CreditCard className="h-5 w-5" />
                                            Contact & Financial Details
                                        </h4>

                                        <div>
                                            <Label htmlFor="edit_email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</Label>
                                            <Input
                                                id="edit_email"
                                                type="email"
                                                value={editData.email}
                                                onChange={(e) => setEditData('email', e.target.value)}
                                                className="mt-1"
                                                required
                                            />
                                            <InputError message={editErrors.email} />
                                        </div>

                                        <div>
                                            <Label htmlFor="edit_phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</Label>
                                            <Input
                                                id="edit_phone"
                                                type="tel"
                                                value={editData.phone}
                                                onChange={(e) => setEditData('phone', e.target.value)}
                                                className="mt-1"
                                                required
                                            />
                                            <InputError message={editErrors.phone} />
                                        </div>

                                        <div>
                                            <Label htmlFor="edit_occupation" className="text-sm font-medium text-gray-700 dark:text-gray-300">Occupation</Label>
                                            <Input
                                                id="edit_occupation"
                                                type="text"
                                                value={editData.occupation}
                                                onChange={(e) => setEditData('occupation', e.target.value)}
                                                className="mt-1"
                                                required
                                            />
                                            <InputError message={editErrors.occupation} />
                                        </div>

                                        <div>
                                            <Label htmlFor="edit_monthly_income" className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Income</Label>
                                            <Input
                                                id="edit_monthly_income"
                                                type="number"
                                                value={editData.monthly_income}
                                                onChange={(e) => setEditData('monthly_income', e.target.value)}
                                                className="mt-1"
                                                required
                                            />
                                            <InputError message={editErrors.monthly_income} />
                                        </div>


                                    </div>
                                </div>

                                <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={closeModals}
                                        className="px-6 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={editProcessing}
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-700 dark:to-purple-700 dark:hover:from-blue-800 dark:hover:to-purple-800 px-6"
                                    >
                                        {editProcessing ? 'Updating...' : 'Update Borrower'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && selectedBorrower && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
                            <div className="p-6">
                                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                                    <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                                
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">Delete Borrower</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                                    Are you sure you want to delete <strong>{selectedBorrower.first_name} {selectedBorrower.last_name}</strong>? 
                                    This action cannot be undone.
                                </p>

                                <div className="flex justify-end space-x-4">
                                    <Button
                                        variant="outline"
                                        onClick={closeModals}
                                        className="px-6 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        onClick={confirmDelete}
                                        disabled={deleteProcessing}
                                        className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800 px-6"
                                    >
                                        {deleteProcessing ? 'Deleting...' : 'Delete'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirm Borrower Modal */}
                {isConfirmModalOpen && selectedBorrower && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
                            <div className="p-6">
                                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full">
                                    <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">Confirm Borrower</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                                    Are you sure you want to confirm <strong>{selectedBorrower.first_name} {selectedBorrower.last_name}</strong>? 
                                    This will approve their borrower status.
                                </p>

                                <div className="flex justify-end space-x-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsConfirmModalOpen(false)}
                                        className="px-6 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        onClick={handleConfirmConfirmed}
                                        disabled={confirmProcessing}
                                        className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800 px-6"
                                    >
                                        {confirmProcessing ? 'Confirming...' : 'Confirm'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Alert Modal */}
                {isSuccessAlertOpen && selectedBorrower && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
                            <div className="p-6">
                                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 dark:bg-green-900/20 rounded-full">
                                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">Success!</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-center">
                                    <strong>{selectedBorrower.first_name} {selectedBorrower.last_name}</strong> has been confirmed successfully.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
        </AppLayout>
    );
}