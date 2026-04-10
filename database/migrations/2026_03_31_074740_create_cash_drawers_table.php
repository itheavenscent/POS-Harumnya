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
        Schema::create('cash_drawers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('store_id');
            $table->unsignedBigInteger('cashier_id');
            $table->timestamp('opened_at')->useCurrent();
            $table->timestamp('closed_at')->nullable();
            
            $table->decimal('starting_cash', 15, 2)->default(0);
            $table->decimal('expected_ending_cash', 15, 2)->nullable();
            $table->decimal('actual_ending_cash', 15, 2)->nullable();
            $table->decimal('difference', 15, 2)->nullable();
            
            $table->decimal('total_cash_sales', 15, 2)->default(0);
            $table->decimal('total_non_cash_sales', 15, 2)->default(0);
            
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('store_id')->references('id')->on('stores')->cascadeOnDelete();
            $table->foreign('cashier_id')->references('id')->on('users')->cascadeOnDelete();
            
            $table->index(['store_id', 'status']);
            $table->index(['cashier_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_drawers');
    }
};
