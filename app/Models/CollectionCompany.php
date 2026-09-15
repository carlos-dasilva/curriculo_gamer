<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CollectionCompany extends Model
{
    protected $fillable = ['name', 'slug', 'website_url', 'logo_url', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function platforms(): BelongsToMany
    {
        return $this->belongsToMany(Platform::class, 'collection_platform_companies', 'company_id', 'platform_id')->withTimestamps();
    }

    public function accessories(): HasMany
    {
        return $this->hasMany(UserCollectionAccessory::class, 'manufacturer_id');
    }
}
