<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserCollectionAccessory extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'item_status_id',
        'acquired_at',
        'acquisition_location',
        'purchase_price',
        'notes',
        'accessory_type_id',
        'name',
        'model',
        'manufacturer_id',
        'quantity',
        'collection_console_id',
        'classification_id',
        'connection_type',
        'color',
        'serial_number',
        'condition',
        'has_box',
        'box_is_original',
        'box_condition',
        'has_manual',
        'has_original_items',
        'has_original_cables',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'item_status_id' => 'integer',
        'acquired_at' => 'date:Y-m-d',
        'purchase_price' => 'decimal:2',
        'accessory_type_id' => 'integer',
        'manufacturer_id' => 'integer',
        'quantity' => 'integer',
        'collection_console_id' => 'integer',
        'classification_id' => 'integer',
        'condition' => 'integer',
        'has_box' => 'boolean',
        'box_is_original' => 'boolean',
        'box_condition' => 'integer',
        'has_manual' => 'boolean',
        'has_original_items' => 'boolean',
        'has_original_cables' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function itemStatus(): BelongsTo
    {
        return $this->belongsTo(CollectionItemStatus::class, 'item_status_id');
    }

    public function accessoryType(): BelongsTo
    {
        return $this->belongsTo(CollectionAccessoryType::class, 'accessory_type_id');
    }

    public function manufacturer(): BelongsTo
    {
        return $this->belongsTo(CollectionCompany::class, 'manufacturer_id');
    }

    public function console(): BelongsTo
    {
        return $this->belongsTo(UserCollectionConsole::class, 'collection_console_id');
    }

    public function classification(): BelongsTo
    {
        return $this->belongsTo(CollectionAccessoryClassification::class, 'classification_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(UserCollectionAccessoryImage::class, 'accessory_id')->orderBy('sort_order')->orderBy('id');
    }

    public function primaryImage(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(UserCollectionAccessoryImage::class, 'accessory_id')->where('is_primary', true);
    }

    public function platforms(): BelongsToMany
    {
        return $this->belongsToMany(Platform::class, 'user_collection_accessory_platform', 'accessory_id', 'platform_id');
    }
}
