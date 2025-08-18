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
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->string('loan_id')->unique();
            $table->foreignId('borrower_id')->constrained()->onDelete('cascade');
            $table->decimal('principal_amount', 15, 2);
            $table->integer('loan_duration'); // in months
            $table->string('duration_period')->default('months'); // months, years
            $table->date('loan_release_date');
            $table->decimal('interest_rate', 5, 2); // percentage
            $table->decimal('total_amount', 15, 2); // principal + interest
            $table->decimal('monthly_payment', 15, 2);
            $table->string('loan_type')->default('personal'); // personal, business, etc.
            $table->text('purpose')->nullable();
            $table->string('collateral')->nullable();
            $table->tinyInteger('status')->default(1); // 1=pending, 2=approved, 3=active, 4=completed, 5=defaulted
            $table->date('due_date');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};
