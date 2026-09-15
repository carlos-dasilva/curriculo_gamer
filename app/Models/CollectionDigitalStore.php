<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CollectionDigitalStore extends Model
{
    protected $fillable = ['name', 'slug', 'is_active', 'sort_order', 'logo_url', 'icon_url', 'color', 'website_url'];

    protected $casts = ['is_active' => 'boolean', 'sort_order' => 'integer'];
}
