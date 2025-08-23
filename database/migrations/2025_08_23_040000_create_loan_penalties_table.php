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
        Schema::create('loan_penalties', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained()->onDelete('cascade');
            $table->enum('penalty_type', ['percentage', 'fixed']);
            $table->decimal('penalty_rate', 8, 2);
            $table->integer('grace_period_days')->default(7);
            $table->enum('penalty_calculation_base', ['monthly_payment', 'principal_amount', 'remaining_balance'])->default('monthly_payment');
            $table->string('penalty_name')->nullable(); // e.g., "Late Payment Penalty", "Default Penalty"
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loan_penalties');
    }
};