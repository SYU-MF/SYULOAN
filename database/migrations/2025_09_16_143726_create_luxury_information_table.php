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
        Schema::create('luxury_information', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained('loans')->onDelete('cascade');
            $table->string('item_type'); // Watch, Jewelry, Designer Bag, Shoes, Perfume, etc.
            $table->string('brand'); // Rolex, Cartier, LV, Gucci, etc.
            $table->string('model_collection_name')->nullable();
            $table->string('material')->nullable(); // Gold, Diamond, Leather, etc.
            $table->string('serial_number')->nullable();
            $table->string('certificate_number')->nullable();
            $table->year('year_purchased')->nullable();
            $table->year('year_released')->nullable();
            $table->string('proof_of_authenticity')->nullable(); // File path for uploaded proof
            $table->string('receipt_upload')->nullable(); // File path for uploaded receipt
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('luxury_information');
    }
};
