<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'group',
        'label',
        'type',
    ];

    /**
     * Helper method to get setting value by key.
     */
    public static function get(string $key, $default = null)
    {
        $setting = static::where('key', $key)->first();
        if (!$setting) {
            return $default;
        }

        if ($setting->type === 'boolean') {
            return filter_var($setting->value, FILTER_VALIDATE_BOOLEAN);
        }

        return $setting->value ?? $default;
    }

    /**
     * Helper method to set setting value by key.
     */
    public static function set(string $key, $value, string $group = 'general', ?string $label = null, string $type = 'text')
    {
        return static::updateOrCreate(
            ['key' => $key],
            [
                'value' => is_bool($value) ? ($value ? 'true' : 'false') : (string)$value,
                'group' => $group,
                'label' => $label ?? $key,
                'type' => $type,
            ]
        );
    }
}
