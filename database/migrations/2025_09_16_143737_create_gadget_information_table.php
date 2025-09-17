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
        Schema::create('gadget_information', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained('loans')->onDelete('cascade');
            $table->string('gadget_type'); // Smartphone, Laptop, Tablet, Camera, Console, etc.
            $table->string('brand'); // Apple, Samsung, Sony, Dell, etc.
            $table->string('model_series'); // e.g., iPhone 16 Pro Max, PS5, MacBook Air M3
            $table->text('specifications')->nullable(); // RAM, Storage, Processor, etc.
            $table->string('serial_number')->nullable();
            $table->string('imei')->nullable();
            $table->string('color_variant')->nullable();
            $table->year('year_purchased')->nullable();
            $table->year('year_released')->nullable();
            $table->text('warranty_details')->nullable();
            $table->string('proof_of_purchase')->nullable(); // File path for uploaded proof
            $table->string('receipt_upload')->nullable(); // File path for uploaded receipt
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gadget_information');
    }
};
