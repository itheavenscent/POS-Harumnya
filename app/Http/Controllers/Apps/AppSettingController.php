<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AppSettingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('Dashboard/Settings/Index', [
            'settings' => AppSetting::all(),
            'loyalty_point_rate' => (int) AppSetting::getValue('loyalty_point_rate', 10000),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request)
    {
        $request->validate([
            'loyalty_point_rate' => 'required|integer|min:0',
        ]);

        AppSetting::setValue('loyalty_point_rate', $request->loyalty_point_rate, 'loyalty', 'Nilai Kelipatan Poin', 'number');

        return back()->with('success', 'Pengaturan berhasil diperbarui');
    }
}
