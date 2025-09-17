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
        Schema::create('vehicle_information', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained()->onDelete('cascade');
            $table->string('vehicle_type'); // 'car' or 'motorcycle'
            $table->string('make'); // Car Make (e.g., Toyota, Honda)
            $table->string('model'); // Car Model (e.g., Vios, Civic)
            $table->string('type'); // Car Type (Sedan, SUV, Truck, etc.)
            $table->year('year_of_manufacture'); // Year of Manufacture
            $table->string('color'); // Color
            $table->string('plate_number'); // Plate Number
            $table->string('chassis_number'); // Chassis Number (VIN)
            $table->string('engine_number'); // Engine Number
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle_information');
    }
};
