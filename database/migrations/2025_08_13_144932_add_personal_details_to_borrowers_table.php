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
        Schema::table('borrowers', function (Blueprint $table) {
            $table->string('middle_name')->nullable()->after('first_name');
            $table->enum('gender', ['Male', 'Female', 'Other'])->nullable()->after('last_name');
            $table->string('nationality')->nullable()->after('gender');
            $table->enum('civil_status', ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'])->nullable()->after('nationality');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('borrowers', function (Blueprint $table) {
            $table->dropColumn(['middle_name', 'gender', 'nationality', 'civil_status']);
        });
    }
};
