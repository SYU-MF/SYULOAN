<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropColumn([
                'penalty_type',
                'penalty_rate',
                'grace_period_days',
                'penalty_calculation_base'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->enum('penalty_type', ['percentage', 'fixed', 'none'])->default('percentage');
            $table->decimal('penalty_rate', 8, 2)->default(2.00);
            $table->integer('grace_period_days')->default(7);
            $table->enum('penalty_calculation_base', ['monthly_payment', 'principal_amount', 'remaining_balance'])->default('monthly_payment');
        });
    }
};