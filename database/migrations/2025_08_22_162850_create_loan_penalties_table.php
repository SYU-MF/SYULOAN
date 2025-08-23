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
            $table->enum('penalty_type', ['late_payment', 'early_payment', 'default', 'other']);
            $table->enum('calculate_penalty_on', ['principal_amount', 'total_amount', 'monthly_payment', 'overdue_amount', 'outstanding_balance']);
            $table->decimal('penalty_percentage', 5, 2)->nullable();
            $table->decimal('fixed_amount', 15, 2)->nullable();
            $table->enum('recurring_penalty', ['daily', 'weekly', 'monthly', 'one_time'])->default('one_time');
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
