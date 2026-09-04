<?php

namespace App\Http\Requests\Material;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $materialId = $this->route('material')?->id;
        $isKemasan  = $this->input('material_type') === 'bahan_kemasan';

        return [
            'material_type'          => ['required', Rule::in(['bahan_baku', 'bahan_kemasan'])],
            'material_category_id'   => [
                'required', 'uuid',
                Rule::exists('material_categories', 'id')->where('material_type', $this->input('material_type')),
            ],
            'code'                   => ['required', 'string', 'max:100', Rule::unique('materials', 'code')->ignore($materialId)],
            'name'                   => ['required', 'string', 'max:255'],
            'unit'                   => $isKemasan
                ? ['required', 'string', 'max:50']
                : ['required', 'string', Rule::in(['ml', 'gr', 'kg', 'liter', 'pcs'])],
            'description'            => ['nullable', 'string', 'max:1000'],
            'image'                  => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_image'           => ['nullable', 'boolean'],
            'selling_price'          => ['nullable', 'numeric', 'min:0', 'max:99999999999.99'],
            'sort_order'             => ['nullable', 'integer', 'min:0'],
            'is_active'              => ['boolean'],

            // Hanya relevan untuk material_type = bahan_kemasan
            'size_id'                => ['nullable', 'exists:sizes,id'],
            'purchase_price'         => [Rule::requiredIf($isKemasan), 'nullable', 'numeric', 'min:0'],
            'is_free'                => ['boolean'],
            'free_condition_note'    => ['nullable', 'string', 'max:255'],
            'is_available_as_addon'  => ['boolean'],
            'is_assembly'            => ['boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'material_category_id' => 'Kategori',
            'code'                  => 'Kode',
            'name'                  => 'Nama',
            'unit'                  => 'Satuan',
            'selling_price'         => 'Harga Jual',
            'purchase_price'        => 'Harga Beli',
            'sort_order'            => 'Urutan Tampil',
        ];
    }
}
