<?php

namespace App\Http\Controllers\Laporan;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\Warehouse;
use App\Models\Ingredient;
use App\Models\PackagingMaterial;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class LaporanMutasiController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isSuperAdmin = (method_exists($user, 'isSuperAdmin') ? $user->isSuperAdmin() : ($user->hasRole('super-admin') || $user->hasRole('admin'))) || $user->can('view-all-stores');

        // ── Filter params ─────────────────────────────────────────────────────
        $location = $request->input('location'); // format 'store:{id}' atau 'warehouse:{id}'
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo   = $request->input('date_to', Carbon::now()->toDateString());

        $locationId = null;
        $locationType = null;
        if ($location && str_contains($location, ':')) {
            [$locationType, $locationId] = explode(':', $location);
        }

        $dateFromDt = Carbon::parse($dateFrom)->startOfDay();
        $dateToDt   = Carbon::parse($dateTo)->endOfDay();
        
        if ($dateFromDt->diffInDays($dateToDt) > 90) {
            $dateFromDt = $dateToDt->copy()->subDays(90)->startOfDay();
        }

        // ── Stores & Warehouses dropdown list ──
        $stores = Store::where('is_active', true)->orderBy('name')->get(['id', 'name']);
        $warehouses = Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        // ── 1. Fetch active items ──
        $ingredients = Ingredient::where('is_active', true)->get(['id', 'name', 'code', 'unit']);
        $packaging = PackagingMaterial::where('is_active', true)->with('size')->get(['id', 'name', 'code', 'unit', 'size_id']);

        // ── 2. Query movements in the period ──
        $movements = DB::table('stock_movements')
            ->leftJoin('stock_adjustments', function ($join) {
                $join->on('stock_movements.reference_id', '=', 'stock_adjustments.id')
                     ->where('stock_movements.reference_type', '=', 'App\\Models\\StockAdjustment');
            })
            ->whereBetween('stock_movements.movement_date', [$dateFromDt, $dateToDt])
            ->when($locationId, function ($q) use ($locationId, $locationType) {
                $q->where('stock_movements.location_id', $locationId)
                  ->where('stock_movements.location_type', $locationType);
            })
            ->select(
                'stock_movements.item_type',
                'stock_movements.item_id',
                'stock_movements.movement_type',
                'stock_adjustments.type as adjustment_type',
                DB::raw('SUM(stock_movements.qty_change) as total_qty_change')
            )
            ->groupBy('stock_movements.item_type', 'stock_movements.item_id', 'stock_movements.movement_type', 'stock_adjustments.type')
            ->get();

        // ── 3. Lookup for movements in period ──
        $movementsLookup = [];
        foreach ($movements as $mv) {
            $itemType = $mv->item_type;
            $itemId = $mv->item_id;
            $mType = $mv->movement_type;
            $adjType = $mv->adjustment_type;
            $change = (int) $mv->total_qty_change;

            if (!isset($movementsLookup[$itemType][$itemId])) {
                $movementsLookup[$itemType][$itemId] = [
                    'stock_take' => 0,
                    'sell_through' => 0,
                    'purchase_order' => 0,
                    'manufacturing' => 0,
                    'transfer' => 0,
                    'adjustment' => 0,
                ];
            }

            if ($mType === 'purchase_in') {
                $movementsLookup[$itemType][$itemId]['purchase_order'] += $change;
            } elseif ($mType === 'sale_deduction') {
                $movementsLookup[$itemType][$itemId]['sell_through'] += $change;
            } elseif ($mType === 'transfer_in' || $mType === 'transfer_out') {
                $movementsLookup[$itemType][$itemId]['transfer'] += $change;
            } elseif ($mType === 'production_in' || $mType === 'production_out') {
                $movementsLookup[$itemType][$itemId]['manufacturing'] += $change;
            } elseif ($adjType === 'stock_opname') {
                $movementsLookup[$itemType][$itemId]['stock_take'] += $change;
            } else {
                $movementsLookup[$itemType][$itemId]['adjustment'] += $change;
            }
        }

        // ── 4. Fetch current stock balances ──
        $currentIngredientStocks = [];
        $currentPackagingStocks = [];

        if ($locationId) {
            if ($locationType === 'store') {
                $currentIngredientStocks = DB::table('store_ingredient_stocks')
                    ->where('store_id', $locationId)
                    ->pluck('quantity', 'ingredient_id')
                    ->toArray();
                $currentPackagingStocks = DB::table('store_packaging_stocks')
                    ->where('store_id', $locationId)
                    ->pluck('quantity', 'packaging_material_id')
                    ->toArray();
            } else {
                $currentIngredientStocks = DB::table('warehouse_ingredient_stocks')
                    ->where('warehouse_id', $locationId)
                    ->pluck('quantity', 'ingredient_id')
                    ->toArray();
                $currentPackagingStocks = DB::table('warehouse_packaging_stocks')
                    ->where('warehouse_id', $locationId)
                    ->pluck('quantity', 'packaging_material_id')
                    ->toArray();
            }
        } else {
            // Aggregate all stores + warehouses
            $storeIng = DB::table('store_ingredient_stocks')->select('ingredient_id', DB::raw('SUM(quantity) as qty'))->groupBy('ingredient_id')->get();
            $warehouseIng = DB::table('warehouse_ingredient_stocks')->select('ingredient_id', DB::raw('SUM(quantity) as qty'))->groupBy('ingredient_id')->get();
            foreach ($storeIng as $s) {
                $currentIngredientStocks[$s->ingredient_id] = ($currentIngredientStocks[$s->ingredient_id] ?? 0) + $s->qty;
            }
            foreach ($warehouseIng as $w) {
                $currentIngredientStocks[$w->ingredient_id] = ($currentIngredientStocks[$w->ingredient_id] ?? 0) + $w->qty;
            }

            $storePack = DB::table('store_packaging_stocks')->select('packaging_material_id', DB::raw('SUM(quantity) as qty'))->groupBy('packaging_material_id')->get();
            $warehousePack = DB::table('warehouse_packaging_stocks')->select('packaging_material_id', DB::raw('SUM(quantity) as qty'))->groupBy('packaging_material_id')->get();
            foreach ($storePack as $s) {
                $currentPackagingStocks[$s->packaging_material_id] = ($currentPackagingStocks[$s->packaging_material_id] ?? 0) + $s->qty;
            }
            foreach ($warehousePack as $w) {
                $currentPackagingStocks[$w->packaging_material_id] = ($currentPackagingStocks[$w->packaging_material_id] ?? 0) + $w->qty;
            }
        }

        // ── 5. Fetch movements after the end date ──
        $movementsAfter = DB::table('stock_movements')
            ->where('movement_date', '>', $dateToDt)
            ->when($locationId, function ($q) use ($locationId, $locationType) {
                $q->where('location_id', $locationId)
                  ->where('location_type', $locationType);
            })
            ->select('item_type', 'item_id', DB::raw('SUM(qty_change) as total_qty_change'))
            ->groupBy('item_type', 'item_id')
            ->get();

        $qtyChangeAfter = [];
        foreach ($movementsAfter as $m) {
            $qtyChangeAfter[$m->item_type][$m->item_id] = (int) $m->total_qty_change;
        }

        // ── 6. Map and process both tables ──
        $mutations = [];

        // Ingredients
        foreach ($ingredients as $ing) {
            $current = (int) ($currentIngredientStocks[$ing->id] ?? 0);
            $afterChange = (int) ($qtyChangeAfter['ingredient'][$ing->id] ?? 0);
            $ending = $current - $afterChange;

            $m = $movementsLookup['ingredient'][$ing->id] ?? [
                'stock_take' => 0,
                'sell_through' => 0,
                'purchase_order' => 0,
                'manufacturing' => 0,
                'transfer' => 0,
                'adjustment' => 0,
            ];

            $totalPeriodChange = $m['stock_take'] + $m['sell_through'] + $m['purchase_order'] + $m['manufacturing'] + $m['transfer'] + $m['adjustment'];
            $beginning = $ending - $totalPeriodChange;

            $mutations[] = [
                'id' => $ing->id,
                'type' => 'ingredient',
                'code' => $ing->code,
                'name' => $ing->name,
                'unit' => $ing->unit ?? 'ml',
                'beginning' => $beginning,
                'stock_take' => $m['stock_take'],
                'sell_through' => $m['sell_through'],
                'purchase_order' => $m['purchase_order'],
                'manufacturing' => $m['manufacturing'],
                'transfer' => $m['transfer'],
                'adjustment' => $m['adjustment'],
                'ending' => $ending,
            ];
        }

        // Packaging Materials
        foreach ($packaging as $pack) {
            $current = (int) ($currentPackagingStocks[$pack->id] ?? 0);
            $afterChange = (int) ($qtyChangeAfter['packaging_material'][$pack->id] ?? 0);
            $ending = $current - $afterChange;

            $m = $movementsLookup['packaging_material'][$pack->id] ?? [
                'stock_take' => 0,
                'sell_through' => 0,
                'purchase_order' => 0,
                'manufacturing' => 0,
                'transfer' => 0,
                'adjustment' => 0,
            ];

            $totalPeriodChange = $m['stock_take'] + $m['sell_through'] + $m['purchase_order'] + $m['manufacturing'] + $m['transfer'] + $m['adjustment'];
            $beginning = $ending - $totalPeriodChange;

            $mutations[] = [
                'id' => $pack->id,
                'type' => 'packaging',
                'code' => $pack->code,
                'name' => $pack->name,
                'unit' => $pack->unit ?? ($pack->size?->name ?? 'pcs'),
                'beginning' => $beginning,
                'stock_take' => $m['stock_take'],
                'sell_through' => $m['sell_through'],
                'purchase_order' => $m['purchase_order'],
                'manufacturing' => $m['manufacturing'],
                'transfer' => $m['transfer'],
                'adjustment' => $m['adjustment'],
                'ending' => $ending,
            ];
        }

        // Sort combined list by name
        usort($mutations, fn($a, $b) => strcmp($a['name'], $b['name']));

        return Inertia::render('Dashboard/Laporan/Mutasi', [
            'mutations'    => $mutations,
            'stores'       => $stores,
            'warehouses'   => $warehouses,
            'filters'      => [
                'location'  => $location ?? '',
                'date_from' => $dateFrom,
                'date_to'   => $dateTo,
            ],
            'isSuperAdmin' => $isSuperAdmin,
        ]);
    }

    public function exportExcel(Request $request)
    {
        $user = auth()->user();
        
        $location = $request->input('location');
        $dateFrom = $request->input('date_from', Carbon::now()->startOfMonth()->toDateString());
        $dateTo   = $request->input('date_to', Carbon::now()->toDateString());

        $locationId = null;
        $locationType = null;
        if ($location && str_contains($location, ':')) {
            [$locationType, $locationId] = explode(':', $location);
        }

        $dateFromDt = Carbon::parse($dateFrom)->startOfDay();
        $dateToDt   = Carbon::parse($dateTo)->endOfDay();
        
        if ($dateFromDt->diffInDays($dateToDt) > 90) {
            $dateFromDt = $dateToDt->copy()->subDays(90)->startOfDay();
        }

        $ingredients = Ingredient::where('is_active', true)->get(['id', 'name', 'code', 'unit']);
        $packaging = PackagingMaterial::where('is_active', true)->with('size')->get(['id', 'name', 'code', 'unit', 'size_id']);

        $movements = DB::table('stock_movements')
            ->leftJoin('stock_adjustments', function ($join) {
                $join->on('stock_movements.reference_id', '=', 'stock_adjustments.id')
                     ->where('stock_movements.reference_type', '=', 'App\\Models\\StockAdjustment');
            })
            ->whereBetween('stock_movements.movement_date', [$dateFromDt, $dateToDt])
            ->when($locationId, function ($q) use ($locationId, $locationType) {
                $q->where('stock_movements.location_id', $locationId)
                  ->where('stock_movements.location_type', $locationType);
            })
            ->select(
                'stock_movements.item_type',
                'stock_movements.item_id',
                'stock_movements.movement_type',
                'stock_adjustments.type as adjustment_type',
                DB::raw('SUM(stock_movements.qty_change) as total_qty_change')
            )
            ->groupBy('stock_movements.item_type', 'stock_movements.item_id', 'stock_movements.movement_type', 'stock_adjustments.type')
            ->get();

        $movementsLookup = [];
        foreach ($movements as $mv) {
            $itemType = $mv->item_type;
            $itemId = $mv->item_id;
            $mType = $mv->movement_type;
            $adjType = $mv->adjustment_type;
            $change = (int) $mv->total_qty_change;

            if (!isset($movementsLookup[$itemType][$itemId])) {
                $movementsLookup[$itemType][$itemId] = [
                    'stock_take' => 0, 'sell_through' => 0, 'purchase_order' => 0,
                    'manufacturing' => 0, 'transfer' => 0, 'adjustment' => 0,
                ];
            }

            if ($mType === 'purchase_in') {
                $movementsLookup[$itemType][$itemId]['purchase_order'] += $change;
            } elseif ($mType === 'sale_deduction') {
                $movementsLookup[$itemType][$itemId]['sell_through'] += $change;
            } elseif ($mType === 'transfer_in' || $mType === 'transfer_out') {
                $movementsLookup[$itemType][$itemId]['transfer'] += $change;
            } elseif ($mType === 'production_in' || $mType === 'production_out') {
                $movementsLookup[$itemType][$itemId]['manufacturing'] += $change;
            } elseif ($adjType === 'stock_opname') {
                $movementsLookup[$itemType][$itemId]['stock_take'] += $change;
            } else {
                $movementsLookup[$itemType][$itemId]['adjustment'] += $change;
            }
        }

        $currentIngredientStocks = [];
        $currentPackagingStocks = [];
        if ($locationId) {
            if ($locationType === 'store') {
                $currentIngredientStocks = DB::table('store_ingredient_stocks')->where('store_id', $locationId)->pluck('quantity', 'ingredient_id')->toArray();
                $currentPackagingStocks = DB::table('store_packaging_stocks')->where('store_id', $locationId)->pluck('quantity', 'packaging_material_id')->toArray();
            } else {
                $currentIngredientStocks = DB::table('warehouse_ingredient_stocks')->where('warehouse_id', $locationId)->pluck('quantity', 'ingredient_id')->toArray();
                $currentPackagingStocks = DB::table('warehouse_packaging_stocks')->where('warehouse_id', $locationId)->pluck('quantity', 'packaging_material_id')->toArray();
            }
        } else {
            $storeIng = DB::table('store_ingredient_stocks')->select('ingredient_id', DB::raw('SUM(quantity) as qty'))->groupBy('ingredient_id')->get();
            $warehouseIng = DB::table('warehouse_ingredient_stocks')->select('ingredient_id', DB::raw('SUM(quantity) as qty'))->groupBy('ingredient_id')->get();
            foreach ($storeIng as $s) {
                $currentIngredientStocks[$s->ingredient_id] = ($currentIngredientStocks[$s->ingredient_id] ?? 0) + $s->qty;
            }
            foreach ($warehouseIng as $w) {
                $currentIngredientStocks[$w->ingredient_id] = ($currentIngredientStocks[$w->ingredient_id] ?? 0) + $w->qty;
            }

            $storePack = DB::table('store_packaging_stocks')->select('packaging_material_id', DB::raw('SUM(quantity) as qty'))->groupBy('packaging_material_id')->get();
            $warehousePack = DB::table('warehouse_packaging_stocks')->select('packaging_material_id', DB::raw('SUM(quantity) as qty'))->groupBy('packaging_material_id')->get();
            foreach ($storePack as $s) {
                $currentPackagingStocks[$s->packaging_material_id] = ($currentPackagingStocks[$s->packaging_material_id] ?? 0) + $s->qty;
            }
            foreach ($warehousePack as $w) {
                $currentPackagingStocks[$w->packaging_material_id] = ($currentPackagingStocks[$w->packaging_material_id] ?? 0) + $w->qty;
            }
        }

        $movementsAfter = DB::table('stock_movements')
            ->where('movement_date', '>', $dateToDt)
            ->when($locationId, function ($q) use ($locationId, $locationType) {
                $q->where('location_id', $locationId)
                  ->where('location_type', $locationType);
            })
            ->select('item_type', 'item_id', DB::raw('SUM(qty_change) as total_qty_change'))
            ->groupBy('item_type', 'item_id')
            ->get();

        $qtyChangeAfter = [];
        foreach ($movementsAfter as $mv) {
            $qtyChangeAfter[$mv->item_type][$mv->item_id] = (int) $mv->total_qty_change;
        }

        $mutations = [];
        foreach ($ingredients as $ing) {
            $current = (int) ($currentIngredientStocks[$ing->id] ?? 0);
            $afterChange = (int) ($qtyChangeAfter['ingredient'][$ing->id] ?? 0);
            $ending = $current - $afterChange;
            $m = $movementsLookup['ingredient'][$ing->id] ?? [
                'stock_take' => 0, 'sell_through' => 0, 'purchase_order' => 0,
                'manufacturing' => 0, 'transfer' => 0, 'adjustment' => 0,
            ];
            $totalPeriodChange = $m['stock_take'] + $m['sell_through'] + $m['purchase_order'] + $m['manufacturing'] + $m['transfer'] + $m['adjustment'];
            $beginning = $ending - $totalPeriodChange;
            $mutations[] = [
                'code' => $ing->code, 'name' => $ing->name, 'unit' => $ing->unit,
                'beginning' => $beginning, 'stock_take' => $m['stock_take'], 'sell_through' => $m['sell_through'],
                'purchase_order' => $m['purchase_order'], 'manufacturing' => $m['manufacturing'], 'transfer' => $m['transfer'],
                'adjustment' => $m['adjustment'], 'ending' => $ending,
            ];
        }

        foreach ($packaging as $pack) {
            $current = (int) ($currentPackagingStocks[$pack->id] ?? 0);
            $afterChange = (int) ($qtyChangeAfter['packaging_material'][$pack->id] ?? 0);
            $ending = $current - $afterChange;
            $m = $movementsLookup['packaging_material'][$pack->id] ?? [
                'stock_take' => 0, 'sell_through' => 0, 'purchase_order' => 0,
                'manufacturing' => 0, 'transfer' => 0, 'adjustment' => 0,
            ];
            $totalPeriodChange = $m['stock_take'] + $m['sell_through'] + $m['purchase_order'] + $m['manufacturing'] + $m['transfer'] + $m['adjustment'];
            $beginning = $ending - $totalPeriodChange;
            $mutations[] = [
                'code' => $pack->code, 'name' => $pack->name, 'unit' => $pack->unit ?? ($pack->size?->name ?? 'pcs'),
                'beginning' => $beginning, 'stock_take' => $m['stock_take'], 'sell_through' => $m['sell_through'],
                'purchase_order' => $m['purchase_order'], 'manufacturing' => $m['manufacturing'], 'transfer' => $m['transfer'],
                'adjustment' => $m['adjustment'], 'ending' => $ending,
            ];
        }

        usort($mutations, fn($a, $b) => strcmp($a['name'], $b['name']));

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Mutasi Bahan & Kemasan');

        $headers = [
            'Kode Item', 'Nama Item', 'Satuan',
            'Beginning Balance', 'Stock Take', 'Sell Through',
            'Purchase Order', 'Manufacturing', 'Transfer',
            'Adjustment', 'Ending Balance'
        ];
        
        foreach ($headers as $col => $header) {
            $sheet->setCellValueExplicit([$col + 1, 1], $header, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
            $sheet->getStyle([$col + 1, 1])->getFont()->setBold(true);
        }

        $row = 2;
        foreach ($mutations as $m) {
            $sheet->setCellValue([1, $row], $m['code']);
            $sheet->setCellValue([2, $row], $m['name']);
            $sheet->setCellValue([3, $row], $m['unit']);
            $sheet->setCellValue([4, $row], $m['beginning']);
            $sheet->setCellValue([5, $row], $m['stock_take']);
            $sheet->setCellValue([6, $row], $m['sell_through']);
            $sheet->setCellValue([7, $row], $m['purchase_order']);
            $sheet->setCellValue([8, $row], $m['manufacturing']);
            $sheet->setCellValue([9, $row], $m['transfer']);
            $sheet->setCellValue([10, $row], $m['adjustment']);
            $sheet->setCellValue([11, $row], $m['ending']);
            $row++;
        }

        foreach(range(1, 11) as $columnID) {
            $sheet->getColumnDimensionByColumn($columnID)->setAutoSize(true);
        }

        $filename = "Laporan_Mutasi_{$dateFromDt->format('Ymd')}_{$dateToDt->format('Ymd')}.xlsx";

        return response()->streamDownload(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
