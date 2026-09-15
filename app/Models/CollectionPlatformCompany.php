<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CollectionPlatformCompany extends Model
{
    protected $fillable = ['platform_id', 'company_id'];

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(CollectionCompany::class, 'company_id');
    }
}
