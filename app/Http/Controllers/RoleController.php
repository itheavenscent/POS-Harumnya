<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Requests\RoleRequest;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use App\Http\Controllers\Controller;
use Spatie\Permission\Models\Permission;

class RoleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // get all role data
        $roles = Role::query()
            ->with('permissions')
            ->when(request()->search, fn($query) => $query->where('name', 'ilike', '%' . request()->search . '%'))
            ->select('id', 'name')
            ->latest()
            ->paginate(7)
            ->withQueryString();

        // render view
        return Inertia::render('Dashboard/Roles/Index', [
            'roles' => $roles,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Dashboard/Roles/Create', [
            'permissions' => $this->getAvailablePermissions(),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Role $role)
    {
        $role->load('permissions:id,name');

        return Inertia::render('Dashboard/Roles/Edit', [
            'role' => [
                'id'   => $role->id,
                'name' => $role->name,
            ],
            'selectedPermission' => $role->permissions->pluck('name'),
            'permissions'        => $this->getAvailablePermissions(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(RoleRequest $request)
    {
        // create new role data
        $role = Role::create(['name' => $request->name]);

        // give permissions to role
        $role->givePermissionTo($request->selectedPermission);

        return to_route('roles.index');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(RoleRequest $request, Role $role)
    {
        // update role data
        $role->update(['name' => $request->name]);

        // sync role permissions
        $role->syncPermissions($request->selectedPermission);

        return to_route('roles.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Role $role)
    {
        // delete role data
        $role->delete();

        // render view
        return back();
    }

    /**
     * Get grouped permissions for UI (mirror UserController grouping).
     */
    private function getAvailablePermissions()
    {
        return Permission::all()
            ->groupBy(function ($permission) {
                $name = $permission->name;
                if (str_contains($name, 'dashboard')) return 'Dashboard';
                if (str_contains($name, 'transactions')) return 'Transaksi / POS';
                if (str_contains($name, 'intensity-size-prices')) return 'Harga Intensitas';
                if (str_contains($name, 'cash-drawers')) return 'Shift Kasir';
                if (str_contains($name, 'products')) return 'Produk & Katalog';
                if (str_contains($name, 'variants')) return 'Varian';
                if (str_contains($name, 'intensities')) return 'Intensitas';
                if (str_contains($name, 'sizes')) return 'Ukuran';
                if (str_contains($name, 'categories')) return 'Kategori';
                if (str_contains($name, 'recipes')) return 'Resep';
                if (str_contains($name, 'materials')) return 'Bahan Baku & Kemasan';
                if (str_contains($name, 'suppliers')) return 'Supplier';
                if (str_contains($name, 'warehouses')) return 'Gudang';
                if (str_contains($name, 'stores')) return 'Toko';
                if (str_contains($name, 'store-categories')) return 'Kategori Toko';
                if (str_contains($name, 'purchases')) return 'Pembelian';
                if (str_contains($name, 'stock')) return 'Stok Management';
                if (str_contains($name, 'customers')) return 'Pelanggan';
                if (str_contains($name, 'sales-people')) return 'Sales People';
                if (str_contains($name, 'discounts')) return 'Promo & Diskon';
                if (str_contains($name, 'payment-methods')) return 'Metode Pembayaran';
                if (str_contains($name, 'payment-settings')) return 'Pengaturan Pembayaran';
                if (str_contains($name, 'reports') || str_contains($name, 'profits')) return 'Laporan';
                if (str_contains($name, 'users')) return 'User Management';
                if (str_contains($name, 'roles')) return 'Role Management';
                if (str_contains($name, 'permissions')) return 'Permission Management';
                if (str_contains($name, 'settings')) return 'Pengaturan Umum';
                return 'Lainnya';
            })
            ->map(function ($group) {
                return $group->map(fn($p) => ['id' => $p->id, 'name' => $p->name]);
            });
    }
}
