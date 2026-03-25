<?php

namespace App\Http\Requests\Ingredient;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateIngredientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $ingredientId = $this->route('ingredient')?->id;

        return [
            'ingredient_category_id' => ['required', 'uuid', 'exists:ingredient_categories,id'],
            'code'                   => ['required', 'string', 'max:100', Rule::unique('ingredients', 'code')->ignore($ingredientId)],
            'name'                   => ['required', 'string', 'max:255'],
            'unit'                   => ['required', 'string', 'in:ml,gr,kg,liter,pcs'],
            'description'            => ['nullable', 'string', 'max:1000'],
            'image'                  => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_image'           => ['nullable', 'boolean'],
            'selling_price'          => ['nullable', 'numeric', 'min:0', 'max:99999999999.99'],
            'sort_order'             => ['nullable', 'integer', 'min:0'],
            'is_active'              => ['boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'ingredient_category_id' => 'Kategori',
            'code'                   => 'Kode Bahan',
            'name'                   => 'Nama Bahan',
            'unit'                   => 'Satuan',
            'selling_price'          => 'Harga Jual',
            'sort_order'             => 'Urutan Tampil',
        ];
    }
}
