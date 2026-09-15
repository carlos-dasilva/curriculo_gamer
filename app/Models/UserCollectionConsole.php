<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserCollectionConsole extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'item_status_id',
        'acquired_at',
        'acquisition_location',
        'purchase_price',
        'notes',
        'platform_id',
        'nickname',
        'serial_number',
        'region_id',
        'aesthetic_condition',
        'functional_state_id',
        'has_box',
        'box_is_original',
        'box_serial_matches',
        'box_condition',
        'has_manual',
        'has_inserts',
        'has_inner_tray',
        'has_original_power_supply',
        'has_original_video_cable',
        'has_other_original_cables',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'item_status_id' => 'integer',
        'acquired_at' => 'date:Y-m-d',
        'purchase_price' => 'decimal:2',
        'platform_id' => 'integer',
        'region_id' => 'integer',
        'aesthetic_condition' => 'integer',
        'functional_state_id' => 'integer',
        'has_box' => 'boolean',
        'box_is_original' => 'boolean',
        'box_serial_matches' => 'boolean',
        'box_condition' => 'integer',
        'has_manual' => 'boolean',
        'has_inserts' => 'boolean',
        'has_inner_tray' => 'boolean',
        'has_original_power_supply' => 'boolean',
        'has_original_video_cable' => 'boolean',
        'has_other_original_cables' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function itemStatus(): BelongsTo
    {
        return $this->belongsTo(CollectionItemStatus::class, 'item_status_id');
    }

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class, 'platform_id');
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(CollectionRegion::class, 'region_id');
    }

    public function functionalState(): BelongsTo
    {
        return $this->belongsTo(CollectionFunctionalState::class, 'functional_state_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(UserCollectionConsoleImage::class, 'console_id')->orderBy('sort_order')->orderBy('id');
    }

    public function primaryImage(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(UserCollectionConsoleImage::class, 'console_id')->where('is_primary', true);
    }

    public function accessories(): HasMany
    {
        return $this->hasMany(UserCollectionAccessory::class, 'collection_console_id');
    }
}
