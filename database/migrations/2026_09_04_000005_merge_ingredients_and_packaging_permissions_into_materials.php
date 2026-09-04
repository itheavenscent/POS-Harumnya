<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Seeder saja tidak memperbaiki baris permission yang sudah ter-seed di DB
 * (permissions/role_has_permissions), jadi migrasi data ini yang melakukan
 * migrasi baris permission untuk role yang sudah ada:
 *   materials-{access,create,edit,delete} dibuat, diberikan ke setiap role
 *   yang tadinya punya ingredients-* ATAU packaging-* (union), lalu
 *   permission lama dihapus.
 */
return new class extends Migration
{
    private array $suffixes = ['access', 'create', 'edit', 'delete'];

    public function up(): void
    {
        $guard = DB::table('permissions')->value('guard_name') ?? 'web';
        $now = now();

        foreach ($this->suffixes as $suffix) {
            $newPermissionId = DB::table('permissions')->where('name', "materials-{$suffix}")->value('id');

            if (! $newPermissionId) {
                $newPermissionId = DB::table('permissions')->insertGetId([
                    'name' => "materials-{$suffix}",
                    'guard_name' => $guard,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $oldPermissionIds = DB::table('permissions')
                ->whereIn('name', ["ingredients-{$suffix}", "packaging-{$suffix}"])
                ->pluck('id');

            if ($oldPermissionIds->isEmpty()) {
                continue;
            }

            $roleIds = DB::table('role_has_permissions')
                ->whereIn('permission_id', $oldPermissionIds)
                ->pluck('role_id')
                ->unique();

            foreach ($roleIds as $roleId) {
                DB::table('role_has_permissions')->updateOrInsert([
                    'role_id' => $roleId,
                    'permission_id' => $newPermissionId,
                ]);
            }

            $modelIds = DB::table('model_has_permissions')
                ->whereIn('permission_id', $oldPermissionIds)
                ->get(['model_id', 'model_type']);

            foreach ($modelIds->unique(fn ($row) => $row->model_id . '|' . $row->model_type) as $row) {
                DB::table('model_has_permissions')->updateOrInsert([
                    'model_id' => $row->model_id,
                    'model_type' => $row->model_type,
                    'permission_id' => $newPermissionId,
                ]);
            }

            DB::table('role_has_permissions')->whereIn('permission_id', $oldPermissionIds)->delete();
            DB::table('model_has_permissions')->whereIn('permission_id', $oldPermissionIds)->delete();
            DB::table('permissions')->whereIn('id', $oldPermissionIds)->delete();
        }
    }

    public function down(): void
    {
        $guard = DB::table('permissions')->value('guard_name') ?? 'web';
        $now = now();

        foreach ($this->suffixes as $suffix) {
            $newPermissionId = DB::table('permissions')->where('name', "materials-{$suffix}")->value('id');
            if (! $newPermissionId) {
                continue;
            }

            $roleIds = DB::table('role_has_permissions')->where('permission_id', $newPermissionId)->pluck('role_id');

            foreach (["ingredients-{$suffix}", "packaging-{$suffix}"] as $oldName) {
                $oldId = DB::table('permissions')->where('name', $oldName)->value('id');
                if (! $oldId) {
                    $oldId = DB::table('permissions')->insertGetId([
                        'name' => $oldName,
                        'guard_name' => $guard,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
                foreach ($roleIds as $roleId) {
                    DB::table('role_has_permissions')->updateOrInsert([
                        'role_id' => $roleId,
                        'permission_id' => $oldId,
                    ]);
                }
            }

            DB::table('role_has_permissions')->where('permission_id', $newPermissionId)->delete();
            DB::table('model_has_permissions')->where('permission_id', $newPermissionId)->delete();
            DB::table('permissions')->where('id', $newPermissionId)->delete();
        }
    }
};
