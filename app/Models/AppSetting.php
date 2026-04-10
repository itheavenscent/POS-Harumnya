<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppSetting extends Model
{
    protected $fillable = ['key', 'value', 'group', 'label', 'type'];

    /**
     * Get a setting value by key.
     *
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public static function getValue(string $key, $default = null)
    {
        $setting = self::where('key', $key)->first();

        if (!$setting) {
            return $default;
        }

        return self::castValue($setting->value, $setting->type);
    }

    /**
     * Set a setting value by key.
     *
     * @param string $key
     * @param mixed $value
     * @param string|null $group
     * @param string|null $label
     * @param string|null $type
     * @return self
     */
    public static function setValue(string $key, $value, $group = 'general', $label = null, $type = 'string')
    {
        return self::updateOrCreate(
            ['key' => $key],
            [
                'value' => (string) $value,
                'group' => $group,
                'label' => $label,
                'type'  => $type,
            ]
        );
    }

    /**
     * Cast the value based on type.
     *
     * @param string|null $value
     * @param string $type
     * @return mixed
     */
    protected static function castValue($value, string $type)
    {
        if (is_null($value)) {
            return null;
        }

        return match ($type) {
            'number'  => is_numeric($value) ? (float) $value : $value,
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'json'    => json_decode($value, true),
            default   => $value,
        };
    }
}
