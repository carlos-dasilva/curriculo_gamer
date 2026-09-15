<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserCollectionConsoleImage extends Model
{
    protected $fillable = ['url', 'sort_order', 'description', 'is_primary'];

    protected $casts = ['sort_order' => 'integer', 'is_primary' => 'boolean'];

    public function console(): BelongsTo
    {
        return $this->belongsTo(UserCollectionConsole::class, 'console_id');
    }
}
