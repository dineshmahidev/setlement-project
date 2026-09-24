<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    protected $fillable = ['key', 'value', 'type'];

    public static function getValue(string $key, mixed $default = null): mixed
    {
        $row = static::where('key', $key)->first();
        if (! $row) {
            return $default;
        }
        $value = $row->value;
        return match ($row->type) {
            'BOOLEAN' => in_array(strtolower((string) $value), ['1', 'true', 'yes'], true),
            'JSON' => json_decode($value, true),
            'NUMBER' => is_numeric($value) ? $value + 0 : $value,
            default => $value,
        };
    }

    public static function setValue(string $key, mixed $value, string $type = 'TEXT'): void
    {
        if ($type === 'JSON') {
            $value = json_encode($value);
        }
        static::updateOrCreate(['key' => $key], ['value' => $value, 'type' => $type]);
    }
}
