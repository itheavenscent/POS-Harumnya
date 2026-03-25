<?php

namespace App\Http\Controllers\Apps;

use Inertia\Inertia;
use Inertia\Response;
use App\Models\Variant;
use Illuminate\Http\Request;
use App\Services\VariantService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Validator;
use App\Http\Requests\Variant\StoreVariantRequest;
use App\Http\Requests\Variant\UpdateVariantRequest;

class VariantController extends Controller
{
    /**
     * The variant service instance.
     */
    protected VariantService $variantService;

    /**
     * Create a new controller instance.
     */
    public function __construct(VariantService $variantService)
    {
        $this->variantService = $variantService;
    }

    /**
     * Display a listing of variants.
     */
    public function index(Request $request): Response
    {
        $filters = [
            'search'   => $request->input('search'),
            'gender'   => $request->input('gender'),
            'is_active' => $request->input('is_active'),
            'per_page' => $request->input('per_page', 20),
        ];

        $variants = $this->variantService
            ->getPaginatedVariants($filters)
            ->through(fn($variant) => $this->variantService->transformVariant($variant));

        return Inertia::render('Dashboard/Variants/Index', [
            'variants' => $variants,
            'filters'  => $filters,
        ]);
    }

    /**
     * Show the form for creating a new variant.
     */
    public function create(): Response
    {
        return Inertia::render('Dashboard/Variants/Create');
    }

    /**
     * Store a newly created variant in storage.
     */
    public function store(StoreVariantRequest $request): RedirectResponse
    {
        try {
            $this->variantService->createVariant($request->validated());

            return redirect()
                ->route('variants.index')
                ->with('success', 'Varian berhasil ditambahkan!');
        } catch (\Exception $e) {
            return back()
                ->withInput()
                ->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }

    /**
     * Show the form for editing the specified variant.
     */
    public function edit(Variant $variant): Response
    {
        return Inertia::render('Dashboard/Variants/Edit', [
            'variant' => [
                'id'          => $variant->id,
                'code'        => $variant->code,
                'name'        => $variant->name,
                'image_url'   => $variant->image_url,
                'image'       => $variant->image,
                'gender'      => $variant->gender,
                'description' => $variant->description,
                'is_active'   => $variant->is_active,
            ],
        ]);
    }

    /**
     * Update the specified variant in storage.
     */
    public function update(UpdateVariantRequest $request, Variant $variant): RedirectResponse
    {
        try {
            $this->variantService->updateVariant($variant, $request->validated());

            return redirect()
                ->route('variants.index')
                ->with('success', 'Varian berhasil diperbarui!');
        } catch (\Exception $e) {
            return back()
                ->withInput()
                ->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified variant from storage.
     */
    public function destroy(Variant $variant): RedirectResponse
    {
        try {
            $this->variantService->deleteVariant($variant);

            return redirect()
                ->route('variants.index')
                ->with('success', 'Varian berhasil dihapus!');
        } catch (\Exception $e) {
            return back()
                ->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }

    /**
     * Bulk delete variants.
     */
    public function bulkDelete(Request $request): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'ids'    => 'required|array|min:1',
            'ids.*'  => 'exists:variants,id',
        ], [
            'ids.required' => 'Pilih minimal 1 varian untuk dihapus',
            'ids.min'      => 'Pilih minimal 1 varian untuk dihapus',
            'ids.*.exists' => 'Varian tidak ditemukan',
        ]);

        if ($validator->fails()) {
            return back()->with('error', $validator->errors()->first());
        }

        try {
            $count = $this->variantService->bulkDeleteVariants($request->ids);

            return redirect()
                ->route('variants.index')
                ->with('success', "{$count} varian berhasil dihapus!");
        } catch (\Exception $e) {
            return back()
                ->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }
}
