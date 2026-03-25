<?php

namespace App\Http\Requests\Supplier;

use App\Models\Supplier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Saat UPDATE, abaikan kode milik supplier itu sendiri
        $supplierId = $this->route('supplier')?->id;

        return [
            'code' => [
                'required',
                'string',
                'max:50',
                // Hanya alfanumerik + tanda hubung/garis bawah
                'regex:/^[A-Z0-9\-_]+$/',
                Rule::unique('suppliers', 'code')
                    ->ignore($supplierId)
                    ->whereNull('deleted_at'),
            ],
            'name'           => ['required', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'phone'          => ['nullable', 'string', 'max:50', 'regex:/^[\d\s\+\-\(\)]+$/'],
            'email'          => ['nullable', 'email:rfc,dns', 'max:255'],
            'address'        => ['nullable', 'string', 'max:1000'],
            'payment_term'   => ['required', Rule::in(array_keys(Supplier::PAYMENT_TERMS))],
            'credit_limit'   => ['nullable', 'numeric', 'min:0', 'max:9999999999999.99'],
            'is_active'      => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.required'         => 'Kode supplier wajib diisi.',
            'code.max'              => 'Kode supplier maksimal 50 karakter.',
            'code.regex'            => 'Kode hanya boleh berisi huruf kapital, angka, tanda hubung, dan garis bawah.',
            'code.unique'           => 'Kode supplier sudah digunakan.',
            'name.required'         => 'Nama perusahaan wajib diisi.',
            'name.max'              => 'Nama perusahaan maksimal 255 karakter.',
            'contact_person.max'    => 'Nama kontak maksimal 255 karakter.',
            'phone.regex'           => 'Format nomor telepon tidak valid.',
            'phone.max'             => 'Nomor telepon maksimal 50 karakter.',
            'email.email'           => 'Format email tidak valid.',
            'email.max'             => 'Email maksimal 255 karakter.',
            'address.max'           => 'Alamat maksimal 1000 karakter.',
            'payment_term.required' => 'Termin pembayaran wajib dipilih.',
            'payment_term.in'       => 'Termin pembayaran tidak valid.',
            'credit_limit.numeric'  => 'Batas kredit harus berupa angka.',
            'credit_limit.min'      => 'Batas kredit tidak boleh negatif.',
            'credit_limit.max'      => 'Batas kredit melebihi batas maksimum.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            // Paksa kode ke huruf kapital & buang spasi leading/trailing
            'code' => strtoupper(trim((string) $this->code)),

            // Defence layer: kredit harus 0 jika tunai
            'credit_limit' => $this->payment_term === 'cash'
                ? 0
                : max(0, (float) ($this->credit_limit ?? 0)),

            'is_active' => $this->boolean('is_active', true),
        ]);
    }
}
