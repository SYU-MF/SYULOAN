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
        Schema::table('gadget_information', function (Blueprint $table) {
            $table->string('model')->nullable()->after('brand');
            $table->string('color')->nullable()->after('color_variant');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gadget_information', function (Blueprint $table) {
            $table->dropColumn(['model', 'color']);
        });
    }
};
