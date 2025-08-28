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
        Schema::create('accounts_payable', function (Blueprint $table) {
            $table->id();
            $table->string('payable_id')->unique();
            $table->string('vendor_name');
            $table->string('vendor_contact')->nullable();
            $table->string('vendor_email')->nullable();
            $table->string('invoice_number');
            $table->date('invoice_date');
            $table->date('due_date');
            $table->decimal('amount', 15, 2);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('remaining_amount', 15, 2);
            $table->integer('payment_terms')->default(30); // Days
            $table->text('description');
            $table->string('category')->nullable();
            $table->tinyInteger('status')->default(1);
            $table->decimal('late_fee_rate', 5, 2)->default(0); // Annual percentage
            $table->decimal('late_fee_amount', 15, 2)->default(0);
            $table->decimal('discount_rate', 5, 2)->default(0); // Percentage
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            
            $table->index(['status', 'due_date']);
            $table->index(['vendor_name']);
            $table->index(['invoice_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts_payable');
    }
};
