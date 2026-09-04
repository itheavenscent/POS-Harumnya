<?php

namespace Tests\Feature\Transactions;

use App\Models\CashDrawer;
use App\Models\Cart;
use App\Models\Intensity;
use App\Models\IntensitySizePrice;
use App\Models\Material;
use App\Models\MaterialCategory;
use App\Models\PackagingRecipe;
use App\Models\PaymentMethod;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Size;
use App\Models\Store;
use App\Models\User;
use App\Models\Variant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * Real, currently-routed POS checkout: POST transactions.store ->
 * TransactionController@store. This is the actual money-handling checkout
 * (Sale/SaleItem based), unlike the old dead Transaction/Category system.
 */
class CheckoutFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Permission::firstOrCreate([
            'name' => 'transactions-create',
            'guard_name' => 'web',
        ]);
    }

    protected function createCashier(Store $store): User
    {
        $user = User::factory()->create([
            'default_store_id' => $store->id,
        ]);
        $user->givePermissionTo('transactions-create');

        return $user;
    }

    protected function openCashDrawer(Store $store, User $user): CashDrawer
    {
        return CashDrawer::create([
            'store_id' => $store->id,
            'cashier_id' => $user->id,
            'opened_at' => now(),
            'starting_cash' => 0,
            'status' => 'open',
        ]);
    }

    protected function createPaymentMethod(): PaymentMethod
    {
        return PaymentMethod::create([
            'code' => 'CASH',
            'name' => 'Tunai',
            'type' => 'cash',
            'can_give_change' => true,
            'is_active' => true,
            'sort_order' => 1,
        ]);
    }

    protected function createPerfumeCombo(): array
    {
        $variant = Variant::create([
            'code' => 'VAR-' . strtoupper(substr(md5(uniqid()), 0, 6)),
            'name' => 'Midnight Rose',
            'gender' => 'unisex',
            'is_active' => true,
        ]);

        $intensity = Intensity::create([
            'code' => 'EDT-' . strtoupper(substr(md5(uniqid()), 0, 4)),
            'name' => 'Eau de Toilette',
            'oil_ratio' => '2:1',
            'alcohol_ratio' => '1:1',
            'is_active' => true,
        ]);

        $size = Size::create([
            'volume_ml' => 30,
            'name' => '30 ml',
            'is_active' => true,
        ]);

        $price = IntensitySizePrice::create([
            'intensity_id' => $intensity->id,
            'size_id' => $size->id,
            'price' => 50000,
            'is_active' => true,
        ]);

        return compact('variant', 'intensity', 'size', 'price');
    }

    protected function createPackagingCategory(): MaterialCategory
    {
        return MaterialCategory::create([
            'material_type' => 'bahan_kemasan',
            'code' => 'CAT-' . strtoupper(substr(md5(uniqid()), 0, 6)),
            'name' => 'Botol',
            'is_active' => true,
        ]);
    }

    public function test_cashier_can_checkout_and_is_redirected_to_invoice(): void
    {
        $store = Store::create(['code' => 'STR-01', 'name' => 'Toko Utama', 'is_active' => true]);
        $cashier = $this->createCashier($store);
        $this->openCashDrawer($store, $cashier);
        $paymentMethod = $this->createPaymentMethod();

        ['variant' => $variant, 'intensity' => $intensity, 'size' => $size] = $this->createPerfumeCombo();

        // Add a regular perfume item to the cart via the real add-to-cart endpoint.
        $addResponse = $this->actingAs($cashier)->post(route('transactions.add-to-cart'), [
            'intensity_id' => $intensity->id,
            'variant_id' => $variant->id,
            'size_id' => $size->id,
            'qty' => 2,
        ]);
        $addResponse->assertSessionHasNoErrors();

        $this->assertSame(1, Cart::where('cashier_id', $cashier->id)->count());

        $response = $this->actingAs($cashier)->post(route('transactions.store'), [
            'payment_method_id' => $paymentMethod->id,
            'cash_amount' => 200000,
        ]);

        $sale = Sale::latest('sold_at')->first();

        $this->assertNotNull($sale, 'Sale record should exist after checkout.');
        $response->assertRedirect(route('transactions.print', ['saleNumber' => str_replace('/', '-', $sale->sale_number)]));

        $this->assertSame($store->id, $sale->store_id);
        $this->assertSame($cashier->id, $sale->cashier_id);
        $this->assertSame(100000, (int) $sale->subtotal_perfume);
        $this->assertSame(100000, (int) $sale->subtotal);
        $this->assertSame(100000, (int) $sale->total);
        $this->assertSame(200000, (int) $sale->amount_paid);
        $this->assertSame(100000, (int) $sale->change_amount);
        $this->assertSame('completed', $sale->status);

        $this->assertSame(1, $sale->items()->count());
        $item = $sale->items()->first();
        $this->assertSame(2, (int) $item->qty);
        $this->assertSame(50000, (int) $item->unit_price);
        $this->assertSame(100000, (int) $item->subtotal);

        // Cart is cleared after a successful checkout.
        $this->assertSame(0, Cart::where('cashier_id', $cashier->id)->count());
    }

    /**
     * Regression test for the assembly-aware packagingUnitCost() fix:
     * an assembly ("rakitan") PackagingMaterial's COGS must be the sum of
     * its PackagingRecipe components' average_cost * quantity, never zero
     * and never the assembly's own average_cost (assemblies carry no stock
     * or cost of their own).
     */
    public function test_assembly_packaging_cogs_is_sum_of_component_costs(): void
    {
        $store = Store::create(['code' => 'STR-02', 'name' => 'Toko Kedua', 'is_active' => true]);
        $cashier = $this->createCashier($store);
        $this->openCashDrawer($store, $cashier);
        $paymentMethod = $this->createPaymentMethod();
        $category = $this->createPackagingCategory();

        $component = Material::create([
            'material_type' => 'bahan_kemasan',
            'material_category_id' => $category->id,
            'code' => 'COMP-' . strtoupper(substr(md5(uniqid()), 0, 6)),
            'name' => 'Botol Kaca 30ml',
            'unit' => 'pcs',
            'is_available_as_addon' => false,
            'is_assembly' => false,
            'purchase_price' => 800,
            'selling_price' => 0,
            'is_free' => false,
            'average_cost' => 1000,
            'is_active' => true,
        ]);

        $assembly = Material::create([
            'material_type' => 'bahan_kemasan',
            'material_category_id' => $category->id,
            'code' => 'ASSY-' . strtoupper(substr(md5(uniqid()), 0, 6)),
            'name' => 'Botol Rakitan Lengkap',
            'unit' => 'pcs',
            'is_available_as_addon' => true,
            'is_assembly' => true,
            'purchase_price' => 0,
            // Deliberately nonzero to prove the assembly's own average_cost
            // is NOT what gets used for COGS (only its components' costs).
            'average_cost' => 999999,
            'selling_price' => 5000,
            'is_free' => false,
            'is_active' => true,
        ]);

        PackagingRecipe::create([
            'parent_packaging_id' => $assembly->id,
            'component_packaging_id' => $component->id,
            'quantity' => 2,
        ]);

        $qty = 3;

        $response = $this->actingAs($cashier)->post(route('transactions.store'), [
            'payment_method_id' => $paymentMethod->id,
            'cash_amount' => 50000,
            'standalone_packagings' => [
                [
                    'packaging_material_id' => $assembly->id,
                    'qty' => $qty,
                ],
            ],
        ]);

        $sale = Sale::latest('sold_at')->first();

        $this->assertNotNull($sale, 'Sale record should exist after checkout.');
        $response->assertRedirect(route('transactions.print', ['saleNumber' => str_replace('/', '-', $sale->sale_number)]));

        $this->assertSame(1, $sale->items()->count());

        /** @var SaleItem $item */
        $item = $sale->items()->first();

        // Expected component-based COGS: 2 components * average_cost 1000 = 2000/unit.
        $expectedUnitCost = 2000;
        $expectedTotalCost = $expectedUnitCost * $qty;

        $this->assertSame(
            $expectedUnitCost,
            (int) $item->cogs_per_unit,
            'Assembly cogs_per_unit must equal sum(component average_cost * BOM quantity), not the assembly\'s own average_cost or zero.'
        );
        $this->assertSame(
            $expectedTotalCost,
            (int) $item->cogs_total,
            'Assembly cogs_total must equal cogs_per_unit * qty sold.'
        );

        $this->assertSame((int) ($assembly->selling_price * $qty), (int) $item->subtotal);

        // Sanity: the sale-level packaging COGS rollup must reflect the same figure.
        $this->assertSame($expectedTotalCost, (int) $sale->cogs_packaging);
        $this->assertSame($expectedTotalCost, (int) $sale->cogs_total);
    }
}
