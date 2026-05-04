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
            'loyalty_reward_threshold' => (int) AppSetting::getValue('loyalty_reward_threshold', 30),
            'loyalty_reward_description' => AppSetting::getValue('loyalty_reward_description', 'Free parfum P30 EDT + Botol'),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request)
    {
        $request->validate([
            'loyalty_point_rate' => 'required|integer|min:0',
            'loyalty_reward_threshold' => 'required|integer|min:1',
            'loyalty_reward_description' => 'required|string|max:255',
        ]);

        AppSetting::setValue('loyalty_point_rate', $request->loyalty_point_rate, 'loyalty', 'Nilai Kelipatan Poin (Rp per 1 Poin)', 'number');
        AppSetting::setValue('loyalty_reward_threshold', $request->loyalty_reward_threshold, 'loyalty', 'Ambang Batas Penukaran Poin', 'number');
        AppSetting::setValue('loyalty_reward_description', $request->loyalty_reward_description, 'loyalty', 'Deskripsi Hadiah Poin', 'string');

        return back()->with('success', 'Pengaturan loyalty berhasil diperbarui');
    }
}
