<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserCollectionAccessoryImage extends Model
{
    protected $fillable = ['url', 'sort_order', 'description', 'is_primary'];

    protected $casts = ['sort_order' => 'integer', 'is_primary' => 'boolean'];

    public function accessory(): BelongsTo
    {
        return $this->belongsTo(UserCollectionAccessory::class, 'accessory_id');
    }
}
