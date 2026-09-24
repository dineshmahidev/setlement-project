<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('label');
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('label');
            $table->timestamps();
        });

        Schema::create('role_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->unique(['role_id', 'permission_id']);
        });

        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('district')->nullable();
            $table->string('state')->nullable();
            $table->string('pincode', 10)->nullable();
            $table->string('gstin', 20)->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('email')->nullable();
            $table->string('status')->default('ACTIVE');
            $table->timestamps();
        });

        Schema::create('user_branches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->unique(['user_id', 'branch_id']);
        });

        Schema::create('user_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->boolean('granted')->default(true);
            $table->unique(['user_id', 'permission_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('employee_id', 30)->nullable()->unique()->after('name');
            $table->string('mobile', 20)->nullable()->after('email');
            $table->foreignId('role_id')->nullable()->after('email')->constrained()->nullOnDelete();
            $table->foreignId('default_branch_id')->nullable()->after('role_id')->constrained('branches')->nullOnDelete();
            $table->string('status')->default('ACTIVE')->after('password');
        });

        Schema::create('company_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('TEXT');
            $table->timestamps();
        });

        Schema::create('field_configurations', function (Blueprint $table) {
            $table->id();
            $table->string('module');
            $table->string('field_name');
            $table->string('field_key');
            $table->boolean('visible')->default(true);
            $table->boolean('required')->default(false);
            $table->string('mode')->default('MANUAL'); // MANUAL | AUTOMATIC
            $table->text('default_value')->nullable();
            $table->text('calculation_rule')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
            $table->unique(['module', 'field_key']);
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');
            $table->string('record_type');
            $table->unsignedBigInteger('record_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
            $table->index(['record_type', 'record_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('field_configurations');
        Schema::dropIfExists('company_settings');
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('role_id');
            $table->dropConstrainedForeignId('default_branch_id');
            $table->dropColumn(['employee_id', 'mobile', 'status']);
        });
        Schema::dropIfExists('user_permissions');
        Schema::dropIfExists('user_branches');
        Schema::dropIfExists('branches');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
    }
};
