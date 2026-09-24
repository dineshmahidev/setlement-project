<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->id();
            $table->string('transfer_number')->unique();
            $table->date('date');
            $table->foreignId('from_branch_id')->constrained('branches');
            $table->foreignId('to_branch_id')->constrained('branches');
            $table->foreignId('vehicle_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('item_id')->constrained();
            $table->decimal('quantity', 18, 3);
            $table->foreignId('unit_id')->nullable()->constrained()->nullOnDelete();
            $table->string('lot_number')->nullable();
            $table->string('driver_name')->nullable();
            $table->string('driver_mobile', 20)->nullable();
            $table->string('status')->default('POSTED'); // DRAFT|POSTED|CANCELLED
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index('date');
        });

        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_number')->index();
            $table->date('date')->index();
            $table->foreignId('branch_id')->constrained();
            $table->foreignId('item_id')->constrained();
            $table->string('type'); // STOCK_IN|STOCK_OUT|TRANSFER_IN|TRANSFER_OUT|ADJUSTMENT_IN|ADJUSTMENT_OUT|OPENING
            $table->decimal('quantity', 18, 3);
            $table->decimal('signed_quantity', 18, 3); // +in / -out
            $table->foreignId('unit_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('vehicle_id')->nullable()->constrained()->nullOnDelete();
            $table->string('driver_name')->nullable();
            $table->string('driver_mobile', 20)->nullable();
            $table->foreignId('vendor_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer')->nullable();
            $table->string('destination')->nullable();
            $table->string('lot_number')->nullable()->index();
            $table->string('reference_type')->nullable(); // SETTLEMENT_BILL|PURCHASE|RETURN|OPENING|MANUAL|TRANSFER|OTHER
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('source_reference')->nullable(); // e.g. transfer number or bill number
            $table->string('status')->default('POSTED'); // DRAFT|POSTED|CANCELLED
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            // Unique per source: transfers create OUT+IN pair (same ref, different type)
            $table->unique(['reference_type', 'reference_id', 'type'], 'inv_tx_source_unique');
            $table->index(['branch_id', 'item_id', 'date']);
            $table->index(['type', 'status']);
        });

        Schema::create('stock_adjustments', function (Blueprint $table) {
            $table->id();
            $table->string('adjustment_number')->unique();
            $table->date('date');
            $table->foreignId('branch_id')->constrained();
            $table->foreignId('item_id')->constrained();
            $table->string('direction'); // IN|OUT
            $table->decimal('quantity', 18, 3);
            $table->foreignId('unit_id')->nullable()->constrained()->nullOnDelete();
            $table->string('reason')->nullable();
            $table->string('status')->default('POSTED');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('vehicle_movements', function (Blueprint $table) {
            $table->id();
            $table->date('date')->index();
            $table->foreignId('vehicle_id')->constrained();
            $table->string('driver_name')->nullable();
            $table->string('driver_mobile', 20)->nullable();
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
            $table->string('transaction_type'); // SETTLEMENT_BILL|STOCK_IN|STOCK_OUT|STOCK_TRANSFER|MANUAL
            $table->foreignId('vendor_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer')->nullable();
            $table->foreignId('item_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('quantity', 18, 3)->nullable();
            $table->string('lot_number')->nullable();
            $table->string('reference_type')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->string('reference_number')->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['vehicle_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_movements');
        Schema::dropIfExists('stock_adjustments');
        Schema::dropIfExists('inventory_transactions');
        Schema::dropIfExists('stock_transfers');
    }
};
