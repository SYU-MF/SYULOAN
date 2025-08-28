<?php

namespace App\Http\Controllers;

use App\Models\Borrower;
use App\Models\Loan;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        // Get current date for filtering
        $currentDate = Carbon::now();
        $startOfYear = $currentDate->copy()->startOfYear();
        $startOfMonth = $currentDate->copy()->startOfMonth();
        
        // Key Metrics
        $totalRevenue = Payment::where('status', Payment::STATUS_COMPLETED)
            ->whereYear('payment_date', $currentDate->year)
            ->sum('amount');
            
        $totalLoans = Loan::count();
        $activeLoans = Loan::where('status', Loan::STATUS_ACTIVE)->count();
        $totalBorrowers = Borrower::where('status', Borrower::STATUS_CONFIRMED)->count();
        
        // Monthly data for charts (last 6 months)
        $monthlyData = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = $currentDate->copy()->subMonths($i);
            $monthStart = $date->copy()->startOfMonth();
            $monthEnd = $date->copy()->endOfMonth();
            
            $loansCount = Loan::whereBetween('created_at', [$monthStart, $monthEnd])->count();
            $paymentsCount = Payment::where('status', Payment::STATUS_COMPLETED)
                ->whereBetween('payment_date', [$monthStart, $monthEnd])
                ->count();
            $revenue = Payment::where('status', Payment::STATUS_COMPLETED)
                ->whereBetween('payment_date', [$monthStart, $monthEnd])
                ->sum('amount');
                
            $monthlyData[] = [
                'month' => $date->format('M'),
                'loans' => $loansCount,
                'payments' => $paymentsCount,
                'revenue' => (float) $revenue
            ];
        }
        
        // Loan status distribution
        $loanStatusData = [
            [
                'name' => 'Active',
                'value' => Loan::where('status', Loan::STATUS_ACTIVE)->count(),
                'color' => '#10b981'
            ],
            [
                'name' => 'Pending',
                'value' => Loan::where('status', Loan::STATUS_PENDING)->count(),
                'color' => '#f59e0b'
            ],
            [
                'name' => 'Overdue',
                'value' => Loan::where('status', Loan::STATUS_DEFAULTED)->count(),
                'color' => '#ef4444'
            ],
            [
                'name' => 'Completed',
                'value' => Loan::where('status', Loan::STATUS_COMPLETED)->count(),
                'color' => '#6366f1'
            ]
        ];
        
        // Payment trend data (last 4 weeks)
        $paymentTrendData = [];
        for ($i = 3; $i >= 0; $i--) {
            $weekStart = $currentDate->copy()->subWeeks($i)->startOfWeek();
            $weekEnd = $weekStart->copy()->endOfWeek();
            
            $onTime = Payment::where('status', Payment::STATUS_COMPLETED)
                ->whereBetween('payment_date', [$weekStart, $weekEnd])
                ->whereColumn('payment_date', '<=', 'created_at')
                ->count();
                
            $late = Payment::where('status', Payment::STATUS_COMPLETED)
                ->whereBetween('payment_date', [$weekStart, $weekEnd])
                ->whereColumn('payment_date', '>', 'created_at')
                ->count();
                
            $missed = Payment::where('status', Payment::STATUS_FAILED)
                ->whereBetween('created_at', [$weekStart, $weekEnd])
                ->count();
                
            $paymentTrendData[] = [
                'week' => 'Week ' . (4 - $i),
                'onTime' => $onTime,
                'late' => $late,
                'missed' => $missed
            ];
        }
        
        // Borrower segments (simplified categorization)
        $borrowerSegmentData = [
            [
                'segment' => 'New',
                'count' => Borrower::where('created_at', '>=', $currentDate->copy()->subMonths(3))->count(),
                'percentage' => 0
            ],
            [
                'segment' => 'Regular',
                'count' => Borrower::whereHas('loans', function($query) {
                    $query->whereBetween('created_at', [Carbon::now()->subYear(), Carbon::now()->subMonths(3)]);
                })->count(),
                'percentage' => 0
            ],
            [
                'segment' => 'Premium',
                'count' => Borrower::whereHas('loans', function($query) {
                    $query->where('principal_amount', '>=', 100000);
                })->count(),
                'percentage' => 0
            ],
            [
                'segment' => 'VIP',
                'count' => Borrower::whereHas('loans', function($query) {
                    $query->where('principal_amount', '>=', 500000);
                })->count(),
                'percentage' => 0
            ]
        ];
        
        // Calculate percentages for borrower segments
        $totalBorrowersForSegments = array_sum(array_column($borrowerSegmentData, 'count'));
        if ($totalBorrowersForSegments > 0) {
            foreach ($borrowerSegmentData as &$segment) {
                $segment['percentage'] = round(($segment['count'] / $totalBorrowersForSegments) * 100);
            }
        }
        
        // Quick stats
        $pendingApprovals = Loan::where('status', Loan::STATUS_PENDING)->count();
        $overduePayments = Loan::where('status', Loan::STATUS_DEFAULTED)->count();
        $overdueAmount = Loan::where('status', Loan::STATUS_DEFAULTED)
            ->sum('total_amount');
        $completedToday = Payment::where('status', Payment::STATUS_COMPLETED)
            ->whereDate('payment_date', $currentDate->toDateString())
            ->count();
            
        return Inertia::render('overview', [
            'dashboardData' => [
                'keyMetrics' => [
                    'totalRevenue' => (float) $totalRevenue,
                    'totalLoans' => $totalLoans,
                    'activeLoans' => $activeLoans,
                    'totalBorrowers' => $totalBorrowers
                ],
                'monthlyData' => $monthlyData,
                'loanStatusData' => $loanStatusData,
                'paymentTrendData' => $paymentTrendData,
                'borrowerSegmentData' => $borrowerSegmentData,
                'quickStats' => [
                    'pendingApprovals' => $pendingApprovals,
                    'overduePayments' => $overduePayments,
                    'overdueAmount' => (float) $overdueAmount,
                    'completedToday' => $completedToday
                ]
            ]
        ]);
    }
}