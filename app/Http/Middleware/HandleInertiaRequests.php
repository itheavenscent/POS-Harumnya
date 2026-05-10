<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): string|null
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $activeCashDrawer = null;

        if ($user && $user->default_store_id) {
            $activeCashDrawer = \App\Models\CashDrawer::where('store_id', $user->default_store_id)
                ->where('cashier_id', $user->id)
                ->where('status', 'open')
                ->latest()
                ->first();
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'roles' => $user ? $user->getRoleNames() : [],
                'permissions' => $user ? $user->getPermissions() : [],
                'super' => $user ? $user->isSuperAdmin() : false,
            ],
            'activeCashDrawer' => $activeCashDrawer,
        ];
    }
}
