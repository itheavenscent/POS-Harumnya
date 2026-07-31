<?php

namespace App\Console\Commands;

use App\Models\ProductRecipe;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use Illuminate\Console\Command;

class TraceSaleStock extends Command
{
    protected $signature = 'stock:trace-sale
        {sale? : Nomor sale (sale_number). Kosong = ambil sale terakhir}
        {--variant= : Filter: hanya sale terakhir yang mengandung kode variant ini}';

    protected $description = 'Bedah satu sale: snapshot item, jumlah recipe, dan stock movement yang tercatat.';

    public function handle(): int
    {
        $sale = null;

        if ($num = $this->argument('sale')) {
            $sale = Sale::where('sale_number', $num)->first();
        } elseif ($vcode = $this->option('variant')) {
            $sale = Sale::whereHas('items', fn ($q) =>
                $q->where('variant_name', 'ILIKE', '%' . $vcode . '%'))
                ->orderByDesc('sold_at')->first();
        } else {
            $sale = Sale::orderByDesc('sold_at')->first();
        }

        if (! $sale) {
            $this->error('Sale tidak ditemukan.');
            return self::FAILURE;
        }

        $this->info("Sale: {$sale->sale_number} | {$sale->sold_at} | store={$sale->store_id}");

        $items = SaleItem::where('sale_id', $sale->id)->get();

        foreach ($items as $it) {
            $this->line('');
            $this->line("• {$it->product_name}");
            $this->line("    product_id   = " . ($it->product_id ?? 'NULL'));
            $this->line("    variant_snap = " . ($it->variant_id_snapshot ?? 'NULL'));
            $this->line("    intens_snap  = " . ($it->intensity_id_snapshot ?? 'NULL'));
            $this->line("    size_snap    = " . ($it->size_id_snapshot ?? 'NULL'));
            $this->line("    is_custom    = " . ($it->is_custom_order ? 'yes' : 'no')
                . " | is_free = " . ($it->is_free ? 'yes' : 'no')
                . " | qty = {$it->qty}");

            $recipeCount = $it->product_id
                ? ProductRecipe::where('product_id', $it->product_id)->count()
                : 0;
            $this->line("    product_recipes = {$recipeCount}");

            if ($it->product_id && $recipeCount > 0) {
                $recipes = ProductRecipe::where('product_id', $it->product_id)
                    ->with('ingredient')->get();
                foreach ($recipes as $r) {
                    $ing = $r->ingredient;
                    $this->line(sprintf('        - %s [%s] qty=%s %s',
                        $ing?->name ?? '?', $ing?->code ?? 'NO-CODE', $r->quantity, $r->unit));
                }
            }

            // Verdict alur deduct
            if ($it->is_custom_order) {
                $verdict = 'JALUR CUSTOM';
            } elseif ($it->intensity_id_snapshot && $it->size_id_snapshot) {
                $verdict = 'JALUR REGULAR (deduct ingredient)';
            } elseif ($it->reward_item_id) {
                $verdict = 'JALUR REWARD';
            } else {
                $verdict = '>>> DILEWATI (snapshot null, stok TIDAK dikurangi) <<<';
            }
            $this->line("    verdict      = {$verdict}");
        }

        $this->line('');
        $this->info('Stock movements tercatat untuk sale ini:');
        $moves = StockMovement::where('reference_id', $sale->id)
            ->where('movement_type', 'sale_deduction')->get();

        if ($moves->isEmpty()) {
            $this->warn('  (tidak ada) — deductAfterSale tidak menghasilkan movement apapun.');
        }
        foreach ($moves as $m) {
            $this->line(sprintf('  %s id=%s change=%s before=%s after=%s',
                $m->item_type, $m->item_id, $m->qty_change, $m->qty_before, $m->qty_after));
        }

        return self::SUCCESS;
    }
}
