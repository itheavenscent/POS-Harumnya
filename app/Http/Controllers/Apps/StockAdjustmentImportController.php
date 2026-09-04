<?php

namespace App\Http\Controllers\Apps;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\StockAdjustment;
use App\Models\StockMovement;
use App\Models\Material;
use App\Models\Warehouse;
use App\Models\Store;
use App\Models\WarehouseIngredientStock;
use App\Models\WarehousePackagingStock;
use App\Models\StoreIngredientStock;
use App\Models\StorePackagingStock;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class StockAdjustmentImportController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard/StockAdjustments/Import', [
            'warehouses' => Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']),
            'stores'     => Store::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    public function downloadTemplate(Request $request)
    {
        $request->validate([
            'location_type' => 'required|in:warehouse,store',
            'location_id'   => 'required|uuid',
        ]);

        $locationType = $request->location_type;
        $locationId   = $request->location_id;
        $locationName = $locationType === 'warehouse'
            ? (Warehouse::find($locationId)?->name ?? '-')
            : (Store::find($locationId)?->name ?? '-');

        $ingredients = Material::bahanBaku()->active()->orderBy('name')->get(['id', 'name', 'code', 'unit']);
        $packagings  = Material::bahanKemasan()->active()
            ->with('size:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'size_id']);

        $spreadsheet = new Spreadsheet();

        // ── Sheet 1: Import SOG ──
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Import SOG');

        // Title row
        $sheet->setCellValue('A1', "TEMPLATE IMPORT SOG (Stock Opname / Selisih)");
        $sheet->mergeCells('A1:H1');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '0F172A']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Info row
        $sheet->setCellValue('A2', "Lokasi: {$locationName} ({$locationType}) | Dibuat: " . now()->format('d/m/Y H:i') . ' WIB');
        $sheet->mergeCells('A2:H2');
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['size' => 10, 'italic' => true, 'color' => ['rgb' => '64748B']],
        ]);

        // Instructions
        $sheet->setCellValue('A3', 'Keterangan: (+) data kelebihan, (-) data kurang, 0 = tidak ada selisih. Hapus baris contoh sebelum import.');
        $sheet->mergeCells('A3:H3');
        $sheet->getStyle('A3')->applyFromArray([
            'font' => ['size' => 9, 'bold' => true, 'color' => ['rgb' => 'B45309']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FEF3C7']],
        ]);

        // Headers at row 4
        $headers = ['item_type', 'item_code', 'item_name', 'unit', 'system_qty', 'physical_qty', 'selisih', 'keterangan'];
        $headerLabels = ['Tipe Item', 'Kode Item', 'Nama Item', 'Satuan', 'Stok Sistem', 'Stok Fisik', 'Selisih (+/-/0)', 'Keterangan'];

        foreach ($headers as $i => $h) {
            $col = chr(65 + $i);
            $sheet->setCellValue("{$col}4", $headerLabels[$i]);
            $sheet->getStyle("{$col}4")->applyFromArray([
                'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => '1E293B']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E2E8F0']],
                'borders' => ['bottom' => ['borderStyle' => Border::BORDER_THIN]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
        }

        // Fill with item data + current stock
        $row = 5;

        foreach ($ingredients as $ing) {
            $stock = $this->findStock($locationType, $locationId, 'ingredient', $ing->id);
            $sysQty = $stock ? (int) $stock->quantity : 0;

            $sheet->setCellValue("A{$row}", 'ingredient');
            $sheet->setCellValue("B{$row}", $ing->code);
            $sheet->setCellValue("C{$row}", $ing->name);
            $sheet->setCellValue("D{$row}", $ing->unit);
            $sheet->setCellValue("E{$row}", $sysQty);
            $sheet->setCellValue("F{$row}", ''); // physical_qty → user fills
            $sheet->setCellValue("G{$row}", ''); // selisih → user fills or formula
            $sheet->setCellValue("H{$row}", '');

            $sheet->getStyle("A{$row}:H{$row}")->applyFromArray([
                'font' => ['size' => 9],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
            ]);
            $sheet->getStyle("E{$row}:G{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $row++;
        }

        foreach ($packagings as $pkg) {
            $stock = $this->findStock($locationType, $locationId, 'packaging_material', $pkg->id);
            $sysQty = $stock ? (int) $stock->quantity : 0;

            $sheet->setCellValue("A{$row}", 'packaging_material');
            $sheet->setCellValue("B{$row}", $pkg->code);
            $sheet->setCellValue("C{$row}", $pkg->name);
            $sheet->setCellValue("D{$row}", $pkg->size?->name ?? 'pcs');
            $sheet->setCellValue("E{$row}", $sysQty);
            $sheet->setCellValue("F{$row}", '');
            $sheet->setCellValue("G{$row}", '');
            $sheet->setCellValue("H{$row}", '');

            $sheet->getStyle("A{$row}:H{$row}")->applyFromArray([
                'font' => ['size' => 9],
                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
            ]);
            $sheet->getStyle("E{$row}:G{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $row++;
        }

        // Add example rows with colors
        $exRow = $row + 1;
        $sheet->setCellValue("A{$exRow}", '── CONTOH (hapus baris ini) ──');
        $sheet->mergeCells("A{$exRow}:H{$exRow}");
        $sheet->getStyle("A{$exRow}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 9, 'color' => ['rgb' => '7C3AED']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'EDE9FE']],
        ]);

        $exRow++;
        $examples = [
            ['ingredient', 'BB-001', 'Bibit Parfum A', 'ml', 100, 105, 5, 'Kelebihan 5 (+)'],
            ['ingredient', 'BB-002', 'Bibit Parfum B', 'ml', 50,  47, -3, 'Kurang 3 (-)'],
            ['ingredient', 'BB-003', 'Bibit Parfum C', 'ml', 200, 200, 0, 'Tidak ada selisih (0)'],
        ];
        foreach ($examples as $ex) {
            foreach ($ex as $ci => $cv) {
                $sheet->setCellValue(chr(65 + $ci) . $exRow, $cv);
            }
            $sheet->getStyle("A{$exRow}:H{$exRow}")->applyFromArray([
                'font' => ['size' => 9, 'italic' => true, 'color' => ['rgb' => '7C3AED']],
            ]);
            $exRow++;
        }

        // Auto-size columns
        foreach (range('A', 'H') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Save & download
        $filename = 'template_sog_' . str_replace(' ', '_', strtolower($locationName)) . '_' . now()->format('Ymd_His') . '.xlsx';
        $tmpDir = storage_path('app/tmp');
        if (!is_dir($tmpDir)) mkdir($tmpDir, 0755, true);
        $tmpPath = "{$tmpDir}/{$filename}";

        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save($tmpPath);

        return response()->download($tmpPath, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function validate(Request $request)
    {
        $request->validate([
            'file'          => 'required|file|mimes:xlsx,xls|max:5120',
            'location_type' => 'required|in:warehouse,store',
            'location_id'   => 'required|uuid',
        ]);

        $rows   = $this->parseExcel($request->file('file'));
        $result = $this->validateRows($rows, $request->location_type, $request->location_id);

        return response()->json($result);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file'          => 'required|file|mimes:xlsx,xls|max:5120',
            'location_type' => 'required|in:warehouse,store',
            'location_id'   => 'required|uuid',
            'skip_zeros'    => 'boolean',
            'skip_errors'   => 'boolean',
        ]);

        $locationType = $request->location_type;
        $locationId   = $request->location_id;
        $skipZeros    = $request->boolean('skip_zeros', true);
        $skipErrors   = $request->boolean('skip_errors', true);

        $rows   = $this->parseExcel($request->file('file'));
        $result = $this->validateRows($rows, $locationType, $locationId);

        if (!$skipErrors && count($result['errors']) > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Import dibatalkan: ditemukan ' . count($result['errors']) . ' baris error.',
                'errors'  => $result['errors'],
                'summary' => $result['summary'],
            ], 422);
        }

        $validRows = $result['valid_rows'];
        if ($skipZeros) {
            $validRows = array_values(array_filter($validRows, fn($r) => (int) $r['difference'] !== 0));
        }

        if (empty($validRows)) {
            return response()->json([
                'success' => true,
                'message' => 'Tidak ada selisih yang perlu di-adjust.',
                'imported' => 0,
                'skipped_zeros' => $result['zero_count'],
                'adjustment_id' => null,
            ]);
        }

        $adjustmentId = null;

        DB::transaction(function () use ($validRows, $locationType, $locationId, &$adjustmentId) {
            $adj = StockAdjustment::create([
                'adjustment_number' => StockAdjustment::generateNumber(),
                'location_type'     => $locationType,
                'location_id'       => $locationId,
                'adjustment_date'   => now()->toDateString(),
                'type'              => 'stock_opname',
                'status'            => 'draft',
                'notes'             => 'Import SOG (Stock Opname / Selisih) — ' . now()->format('d/m/Y H:i'),
                'created_by'        => auth()->id(),
            ]);

            $adjustmentId = $adj->id;

            foreach ($validRows as $item) {
                $adj->items()->create([
                    'item_type'         => $item['item_type'],
                    'item_id'           => $item['item_id'],
                    'system_quantity'   => $item['system_qty'],
                    'physical_quantity' => $item['physical_qty'],
                    'difference'        => $item['difference'],
                    'unit_cost'         => $item['unit_cost'],
                    'value_difference'  => round(abs($item['difference']) * $item['unit_cost'], 2),
                    'notes'             => $item['notes'] ?: null,
                ]);
            }
        });

        return response()->json([
            'success'       => true,
            'message'       => count($validRows) . ' item berhasil diimport sebagai draft adjustment.',
            'imported'      => count($validRows),
            'skipped_zeros' => $result['zero_count'],
            'errors'        => $result['errors'],
            'adjustment_id' => $adjustmentId,
        ]);
    }

    private function parseExcel($file): array
    {
        $spreadsheet = IOFactory::load($file->getRealPath());
        $sheet       = $spreadsheet->getSheetByName('Import SOG') ?? $spreadsheet->getActiveSheet();

        $rows     = [];
        $maxRow   = $sheet->getHighestDataRow();
        $startRow = 5; // row 1-3 = title/info, row 4 = header, row 5+ = data

        for ($r = $startRow; $r <= $maxRow; $r++) {
            $itemType = trim((string) $sheet->getCell("A{$r}")->getValue());
            $itemCode = trim((string) $sheet->getCell("B{$r}")->getValue());

            // Skip empty rows and example section
            if (empty($itemType) && empty($itemCode)) continue;
            if (str_contains($itemType, 'CONTOH') || str_contains($itemType, '──')) continue;

            $physicalQty = $sheet->getCell("F{$r}")->getValue();
            $selisih     = $sheet->getCell("G{$r}")->getValue();
            $notes       = trim((string) ($sheet->getCell("H{$r}")->getValue() ?? ''));

            $rows[] = [
                'row'          => $r,
                'item_type'    => $itemType,
                'item_code'    => $itemCode,
                'item_name'    => trim((string) $sheet->getCell("C{$r}")->getValue()),
                'unit'         => trim((string) $sheet->getCell("D{$r}")->getValue()),
                'system_qty'   => $sheet->getCell("E{$r}")->getValue(),
                'physical_qty' => $physicalQty,
                'selisih'      => $selisih,
                'notes'        => $notes,
            ];
        }

        return $rows;
    }

    private function validateRows(array $rows, string $locationType, string $locationId): array
    {
        $ingredients = Material::bahanBaku()->active()->pluck('id', 'code');
        $packagings  = Material::bahanKemasan()->active()->pluck('id', 'code');

        $validRows  = [];
        $errorRows  = [];
        $zeroCount  = 0;
        $surplusCount = 0;
        $shortageCount = 0;

        foreach ($rows as $row) {
            $rowErrors = [];

            // Validate item_type
            if (!in_array($row['item_type'], ['ingredient', 'packaging_material'])) {
                $rowErrors[] = "item_type harus 'ingredient' atau 'packaging_material'";
            }

            // Resolve item_id
            $itemId = null;
            if ($row['item_type'] === 'ingredient') {
                $itemId = $ingredients->get($row['item_code']);
                if (!$itemId && empty($rowErrors)) {
                    $rowErrors[] = "Kode item '{$row['item_code']}' tidak ditemukan di daftar bahan baku";
                }
            } elseif ($row['item_type'] === 'packaging_material') {
                $itemId = $packagings->get($row['item_code']);
                if (!$itemId && empty($rowErrors)) {
                    $rowErrors[] = "Kode item '{$row['item_code']}' tidak ditemukan di daftar packaging";
                }
            }

            // Determine difference: prefer selisih column, fallback to physical_qty - system_qty
            $selisih     = $row['selisih'];
            $physicalQty = $row['physical_qty'];
            $systemQty   = is_numeric($row['system_qty']) ? (int) $row['system_qty'] : 0;

            $difference = null;
            $finalPhysicalQty = null;

            if ($selisih !== null && $selisih !== '' && is_numeric($selisih)) {
                $difference = (int) $selisih;
                $finalPhysicalQty = $systemQty + $difference;
            } elseif ($physicalQty !== null && $physicalQty !== '' && is_numeric($physicalQty)) {
                $finalPhysicalQty = (int) $physicalQty;
                $difference = $finalPhysicalQty - $systemQty;
            } else {
                $rowErrors[] = 'Isi kolom Stok Fisik atau Selisih (salah satu wajib diisi)';
            }

            if (count($rowErrors) > 0) {
                $errorRows[] = [
                    'row'    => $row['row'],
                    'data'   => $row,
                    'errors' => $rowErrors,
                ];
                continue;
            }

            // Get current stock for unit_cost
            $stock   = $this->findStock($locationType, $locationId, $row['item_type'], $itemId);
            $unitCost = $stock ? (float) $stock->average_cost : 0.0;
            $currentSystemQty = $stock ? (int) $stock->quantity : 0;

            if ($difference === 0) $zeroCount++;
            elseif ($difference > 0) $surplusCount++;
            else $shortageCount++;

            $validRows[] = [
                'row'          => $row['row'],
                'item_type'    => $row['item_type'],
                'item_id'      => $itemId,
                'item_code'    => $row['item_code'],
                'item_name'    => $row['item_name'],
                'unit'         => $row['unit'],
                'system_qty'   => $currentSystemQty,
                'physical_qty' => $finalPhysicalQty,
                'difference'   => $difference,
                'unit_cost'    => $unitCost,
                'value_diff'   => round(abs($difference) * $unitCost, 2),
                'notes'        => $row['notes'],
            ];
        }

        return [
            'valid_rows'     => $validRows,
            'errors'         => $errorRows,
            'summary'        => [
                'surplus'  => $surplusCount,
                'shortage' => $shortageCount,
                'zero'     => $zeroCount,
            ],
            'total_rows'     => count($rows),
            'valid_count'    => count($validRows),
            'error_count'    => count($errorRows),
            'zero_count'     => $zeroCount,
            'surplus_count'  => $surplusCount,
            'shortage_count' => $shortageCount,
        ];
    }

    private function findStock(string $locType, string $locId, string $itemType, string $itemId)
    {
        return match ([$locType, $itemType]) {
            ['warehouse', 'ingredient']         => WarehouseIngredientStock::where('warehouse_id', $locId)->where('ingredient_id', $itemId)->first(),
            ['warehouse', 'packaging_material'] => WarehousePackagingStock::where('warehouse_id', $locId)->where('packaging_material_id', $itemId)->first(),
            ['store',     'ingredient']         => StoreIngredientStock::where('store_id', $locId)->where('ingredient_id', $itemId)->first(),
            ['store',     'packaging_material'] => StorePackagingStock::where('store_id', $locId)->where('packaging_material_id', $itemId)->first(),
            default => null,
        };
    }
}
