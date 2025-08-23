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
            $table->string('penalty_type')->default('percentage')->after('notes'); // percentage, fixed, none
            $table->decimal('penalty_rate', 5, 2)->default(2.00)->after('penalty_type'); // percentage rate or fixed amount
            $table->integer('grace_period_days')->default(7)->after('penalty_rate'); // grace period in days
            $table->string('penalty_calculation_base')->default('monthly_payment')->after('grace_period_days'); // monthly_payment, principal_amount, remaining_balance
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropColumn(['penalty_type', 'penalty_rate', 'grace_period_days', 'penalty_calculation_base']);
        });
    }
};
