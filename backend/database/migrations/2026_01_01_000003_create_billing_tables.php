<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settlement_bills', function (Blueprint $table) {
            $table->id();
            $table->string('bill_number')->unique();
            $table->date('bill_date');
            $table->string('lot_number')->nullable()->index();
            $table->foreignId('branch_id')->constrained();
            $table->foreignId('vendor_id')->constrained();
            $table->foreignId('vehicle_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('item_id')->nullable()->constrained()->nullOnDelete();

            // vendor snapshot (bill-specific, not master)
            $table->text('vendor_snapshot')->nullable();

            $table->string('po_number')->nullable();

            // bill details
            $table->decimal('net_weight', 18, 3)->default(0);
            $table->decimal('final_weight', 18, 3)->default(0);
            $table->decimal('billing_quantity', 18, 3)->default(0);
            $table->decimal('jute_bag_quantity', 18, 3)->default(0);
            $table->decimal('container_unit_rate', 18, 4)->default(0);
            $table->decimal('final_unit_rate', 18, 4)->default(0);
            $table->decimal('manual_quantity', 18, 3)->nullable();

            $table->string('billing_quantity_source')->default('FINAL_WEIGHT'); // FINAL_WEIGHT|NET_WEIGHT|MANUAL_QUANTITY
            $table->string('rate_mode')->default('MANUAL'); // MANUAL|AUTOMATIC
            $table->text('rate_rule')->nullable();
            $table->decimal('rate_calculated', 18, 4)->nullable();

            $table->decimal('total_value', 18, 2)->default(0);
            $table->decimal('charges_total', 18, 2)->default(0);
            $table->decimal('additive_charges', 18, 2)->default(0);
            $table->decimal('deductive_charges', 18, 2)->default(0);
            $table->decimal('taxable_amount', 18, 2)->default(0);

            $table->string('gst_type')->default('NONE'); // CGST_SGST|IGST|NONE
            $table->decimal('gst_rate', 8, 4)->default(0);
            $table->decimal('cgst_amount', 18, 2)->default(0);
            $table->decimal('sgst_amount', 18, 2)->default(0);
            $table->decimal('igst_amount', 18, 2)->default(0);

            $table->decimal('net_payable', 18, 2)->default(0);

            $table->string('status')->default('DRAFT')->index(); // DRAFT|SUBMITTED|APPROVED|CANCELLED
            $table->boolean('post_to_inventory')->default(true);
            $table->boolean('inventory_posted')->default(false);
            $table->timestamp('inventory_posted_at')->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->index(['branch_id', 'bill_date']);
            $table->index('vendor_id');
        });

        Schema::create('settlement_bill_qc', function (Blueprint $table) {
            $table->id();
            $table->foreignId('settlement_bill_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('key');
            $table->string('value')->nullable();
            $table->string('unit')->nullable();
            $table->string('remarks')->nullable();
            $table->boolean('active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('charge_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('mode')->default('MANUAL'); // MANUAL|AUTOMATIC
            $table->string('direction')->default('ADD'); // ADD|DEDUCT
            $table->text('calculation_rule')->nullable();
            $table->decimal('default_amount', 18, 4)->default(0);
            $table->boolean('active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('settlement_bill_charges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('settlement_bill_id')->constrained()->cascadeOnDelete();
            $table->foreignId('charge_type_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('mode')->default('MANUAL');
            $table->string('direction')->default('ADD'); // ADD|DEDUCT
            $table->decimal('amount', 18, 4)->default(0);
            $table->text('calculation_rule')->nullable();
            $table->text('basis')->nullable();
            $table->boolean('active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('settlement_bill_taxes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('settlement_bill_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // CGST|SGST|IGST
            $table->decimal('rate', 8, 4)->default(0);
            $table->decimal('amount', 18, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('debit_notes', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique();
            $table->date('date');
            $table->foreignId('branch_id')->constrained();
            $table->foreignId('vendor_id')->constrained();
            $table->foreignId('settlement_bill_id')->nullable()->constrained()->nullOnDelete();
            $table->string('invoice_number')->nullable();
            $table->date('invoice_date')->nullable();
            $table->string('lot_number')->nullable();
            $table->string('particulars')->nullable();
            $table->decimal('rebate', 18, 2)->default(0);
            $table->decimal('invoice_value', 18, 2)->default(0);
            $table->string('gst_type')->default('NONE');
            $table->decimal('gst_rate', 8, 4)->default(0);
            $table->decimal('cgst_amount', 18, 2)->default(0);
            $table->decimal('sgst_amount', 18, 2)->default(0);
            $table->decimal('igst_amount', 18, 2)->default(0);
            $table->decimal('total', 18, 2)->default(0);
            $table->string('status')->default('DRAFT')->index();
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->index(['branch_id', 'date']);
        });

        Schema::create('debit_note_taxes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('debit_note_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->decimal('rate', 8, 4)->default(0);
            $table->decimal('amount', 18, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('debit_note_taxes');
        Schema::dropIfExists('debit_notes');
        Schema::dropIfExists('settlement_bill_taxes');
        Schema::dropIfExists('settlement_bill_charges');
        Schema::dropIfExists('charge_types');
        Schema::dropIfExists('settlement_bill_qc');
        Schema::dropIfExists('settlement_bills');
    }
};
