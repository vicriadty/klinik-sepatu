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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('customer_id')->constrained('customers');
            $table->string('status')->default('RECEIVED');
            $table->string('payment_status')->default('UNPAID');
            $table->foreignId('discount_id')->nullable()->constrained('discounts');
            $table->unsignedBigInteger('subtotal');
            $table->unsignedBigInteger('discount_value')->default(0);
            $table->unsignedBigInteger('grand_total');
            $table->unsignedBigInteger('paid_total')->default(0);
            $table->string('client_request_id')->nullable()->unique();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('customer_id');
            $table->index('status');
            $table->index('payment_status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
