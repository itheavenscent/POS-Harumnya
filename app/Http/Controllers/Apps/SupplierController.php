<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Http\Requests\Supplier\StoreSupplierRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

class SupplierController extends Controller
{
    private const DEFAULT_PER_PAGE = 12;
    private const DEFAULT_SORT     = 'name';
    private const DEFAULT_DIR      = 'asc';

    // ─── Index ────────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $perPage   = $this->resolvePerPage($request);
        $sortCol   = $this->resolveSortColumn($request);
        $sortDir   = $this->resolveSortDirection($request);

        $suppliers = Supplier::query()
            ->when(
                $request->filled('search'),
                fn ($q) => $q->search($request->search)
            )
            ->when(
                $request->filled('is_active') && $request->is_active !== '',
                fn ($q) => $q->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN))
            )
            ->when(
                $request->filled('payment_term'),
                fn ($q) => $q->byPaymentTerm($request->payment_term)
            )
            ->select([
                'id', 'code', 'name', 'contact_person', 'email',
                'phone', 'payment_term', 'credit_limit', 'is_active', 'created_at',
            ])
            ->orderBy($sortCol, $sortDir)
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn ($s) => $this->transformSupplier($s));

        return Inertia::render('Dashboard/Suppliers/Index', [
            'suppliers'    => $suppliers,
            'filters'      => $request->only([
                'search', 'is_active', 'payment_term',
                'per_page', 'sort', 'direction',
            ]),
            'paymentTerms' => $this->paymentTermOptions(),
        ]);
    }

    // ─── Create ───────────────────────────────────────────────────────────

    public function create(): Response
    {
        return Inertia::render('Dashboard/Suppliers/Create', [
            'paymentTerms'  => $this->paymentTermOptions(),
            'suggestedCode' => $this->generateUniqueCode(),
        ]);
    }

    // ─── Store ────────────────────────────────────────────────────────────

    public function store(StoreSupplierRequest $request): RedirectResponse
    {
        try {
            $supplier = DB::transaction(fn () => Supplier::create($request->validated()));

            Log::info('Supplier created', [
                'supplier_id' => $supplier->id,
                'code'        => $supplier->code,
                'user_id'     => auth()->id(),
            ]);

            return redirect()
                ->route('suppliers.index')
                ->with('success', 'Supplier berhasil ditambahkan! 🚚');

        } catch (\Exception $e) {
            Log::error('Failed to create supplier', [
                'error'   => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return back()
                ->withInput()
                ->with('error', 'Gagal menyimpan supplier. Silakan coba lagi.');
        }
    }

    // ─── Show ─────────────────────────────────────────────────────────────

    public function show(Supplier $supplier): Response
    {
        return Inertia::render('Dashboard/Suppliers/Show', [
            'supplier' => $this->transformSupplierDetail($supplier),
        ]);
    }

    // ─── Edit ─────────────────────────────────────────────────────────────

    public function edit(Supplier $supplier): Response
    {
        return Inertia::render('Dashboard/Suppliers/Edit', [
            'supplier'     => $this->transformSupplierDetail($supplier),
            'paymentTerms' => $this->paymentTermOptions(),
        ]);
    }

    // ─── Update ───────────────────────────────────────────────────────────

    public function update(StoreSupplierRequest $request, Supplier $supplier): RedirectResponse
    {
        try {
            DB::transaction(fn () => $supplier->update($request->validated()));

            Log::info('Supplier updated', [
                'supplier_id' => $supplier->id,
                'code'        => $supplier->code,
                'user_id'     => auth()->id(),
            ]);

            return redirect()
                ->route('suppliers.index')
                ->with('success', 'Data supplier berhasil diperbarui! ✨');

        } catch (\Exception $e) {
            Log::error('Failed to update supplier', [
                'supplier_id' => $supplier->id,
                'error'       => $e->getMessage(),
                'user_id'     => auth()->id(),
            ]);

            return back()
                ->withInput()
                ->with('error', 'Gagal memperbarui supplier. Silakan coba lagi.');
        }
    }

    // ─── Destroy (soft-delete) ────────────────────────────────────────────

    public function destroy(Supplier $supplier): RedirectResponse
    {
        try {
            DB::transaction(fn () => $supplier->delete());

            Log::info('Supplier soft-deleted', [
                'supplier_id' => $supplier->id,
                'code'        => $supplier->code,
                'user_id'     => auth()->id(),
            ]);

            return back()->with('success', 'Supplier berhasil dihapus! 🗑️');

        } catch (\Exception $e) {
            Log::error('Failed to delete supplier', [
                'supplier_id' => $supplier->id,
                'error'       => $e->getMessage(),
                'user_id'     => auth()->id(),
            ]);

            return back()->with('error', 'Gagal menghapus supplier. Silakan coba lagi.');
        }
    }

    // ─── Restore ──────────────────────────────────────────────────────────

    public function restore(string $id): RedirectResponse
    {
        try {
            DB::transaction(function () use ($id) {
                Supplier::withTrashed()->findOrFail($id)->restore();
            });

            Log::info('Supplier restored', [
                'supplier_id' => $id,
                'user_id'     => auth()->id(),
            ]);

            return back()->with('success', 'Supplier berhasil dipulihkan! ♻️');

        } catch (\Exception $e) {
            Log::error('Failed to restore supplier', [
                'supplier_id' => $id,
                'error'       => $e->getMessage(),
                'user_id'     => auth()->id(),
            ]);

            return back()->with('error', 'Gagal memulihkan supplier. Silakan coba lagi.');
        }
    }

    // ─── Toggle Status ────────────────────────────────────────────────────

    public function toggleStatus(Supplier $supplier): RedirectResponse
    {
        try {
            DB::transaction(fn () => $supplier->update(['is_active' => ! $supplier->is_active]));

            $supplier->refresh();
            $status = $supplier->is_active ? 'diaktifkan' : 'dinonaktifkan';

            Log::info('Supplier status toggled', [
                'supplier_id' => $supplier->id,
                'new_status'  => $supplier->is_active,
                'user_id'     => auth()->id(),
            ]);

            return back()->with('success', "Supplier berhasil {$status}!");

        } catch (\Exception $e) {
            Log::error('Failed to toggle supplier status', [
                'supplier_id' => $supplier->id,
                'error'       => $e->getMessage(),
                'user_id'     => auth()->id(),
            ]);

            return back()->with('error', 'Gagal mengubah status supplier. Silakan coba lagi.');
        }
    }

    // ─── Generate Code (AJAX) ─────────────────────────────────────────────

    /**
     * Buat kode supplier unik via AJAX (dipanggil dari tombol Generate di frontend).
     */
    public function generateCode(): \Illuminate\Http\JsonResponse
    {
        return response()->json(['code' => $this->generateUniqueCode()]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    private function transformSupplier(Supplier $s): array
    {
        return [
            'id'                     => $s->id,
            'code'                   => $s->code,
            'name'                   => $s->name,
            'contact_person'         => $s->contact_person,
            'email'                  => $s->email,
            'phone'                  => $s->phone,
            'payment_term'           => $s->payment_term,
            'payment_term_label'     => $s->payment_term_label,
            'credit_limit'           => $s->credit_limit,
            'formatted_credit_limit' => $s->formatted_credit_limit,
            'is_active'              => $s->is_active,
            'status_label'           => $s->status_label,
        ];
    }

    private function transformSupplierDetail(Supplier $s): array
    {
        return array_merge($this->transformSupplier($s), [
            'address'    => $s->address,
            'created_at' => $s->created_at?->toISOString(),
            'updated_at' => $s->updated_at?->toISOString(),
        ]);
    }

    private function paymentTermOptions(): array
    {
        return collect(Supplier::PAYMENT_TERMS)
            ->map(fn ($label, $value) => ['value' => $value, 'label' => $label])
            ->values()
            ->toArray();
    }

    /**
     * Validasi per_page terhadap whitelist — mencegah query cost tak terduga.
     */
    private function resolvePerPage(Request $request): int
    {
        $requested = (int) $request->input('per_page', self::DEFAULT_PER_PAGE);

        return in_array($requested, Supplier::ALLOWED_PER_PAGE, true)
            ? $requested
            : self::DEFAULT_PER_PAGE;
    }

    /**
     * Whitelist kolom sort — mencegah SQL injection via ORDER BY.
     */
    private function resolveSortColumn(Request $request): string
    {
        $col = $request->input('sort', self::DEFAULT_SORT);

        return in_array($col, Supplier::SORTABLE_COLUMNS, true)
            ? $col
            : self::DEFAULT_SORT;
    }

    private function resolveSortDirection(Request $request): string
    {
        return $request->input('direction', self::DEFAULT_DIR) === 'desc' ? 'desc' : 'asc';
    }

    /**
     * Generate kode supplier yang dijamin unik di DB.
     * Format: SUP-XXXXXX (6 karakter acak huruf besar + angka)
     */
    private function generateUniqueCode(): string
    {
        do {
            $code = 'SUP-' . strtoupper(Str::random(6));
        } while (
            Supplier::withTrashed()->where('code', $code)->exists()
        );

        return $code;
    }
}
