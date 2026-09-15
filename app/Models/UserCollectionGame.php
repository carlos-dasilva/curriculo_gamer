<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserCollectionGame extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'item_status_id',
        'acquired_at',
        'acquisition_location',
        'purchase_price',
        'notes',
        'game_id',
        'platform_id',
        'media_type',
        'edition_id',
        'region_id',
        'originality_id',
        'overall_condition',
        'media_condition',
        'box_condition',
        'manual_condition',
        'inserts_condition',
        'has_media',
        'has_box',
        'has_manual',
        'has_inserts',
        'has_extras',
        'digital_store_id',
        'acquisition_type_id',
        'digital_service_id',
        'digital_ownership_type_id',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'item_status_id' => 'integer',
        'acquired_at' => 'date:Y-m-d',
        'purchase_price' => 'decimal:2',
        'game_id' => 'integer',
        'platform_id' => 'integer',
        'edition_id' => 'integer',
        'region_id' => 'integer',
        'originality_id' => 'integer',
        'overall_condition' => 'integer',
        'media_condition' => 'integer',
        'box_condition' => 'integer',
        'manual_condition' => 'integer',
        'inserts_condition' => 'integer',
        'has_media' => 'boolean',
        'has_box' => 'boolean',
        'has_manual' => 'boolean',
        'has_inserts' => 'boolean',
        'has_extras' => 'boolean',
        'digital_store_id' => 'integer',
        'acquisition_type_id' => 'integer',
        'digital_service_id' => 'integer',
        'digital_ownership_type_id' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function itemStatus(): BelongsTo
    {
        return $this->belongsTo(CollectionItemStatus::class, 'item_status_id');
    }

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class, 'game_id')->withTrashed();
    }

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class, 'platform_id');
    }

    public function edition(): BelongsTo
    {
        return $this->belongsTo(CollectionEdition::class, 'edition_id');
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(CollectionRegion::class, 'region_id');
    }

    public function originality(): BelongsTo
    {
        return $this->belongsTo(CollectionOriginality::class, 'originality_id');
    }

    public function digitalStore(): BelongsTo
    {
        return $this->belongsTo(CollectionDigitalStore::class, 'digital_store_id');
    }

    public function acquisitionType(): BelongsTo
    {
        return $this->belongsTo(CollectionAcquisitionType::class, 'acquisition_type_id');
    }

    public function digitalService(): BelongsTo
    {
        return $this->belongsTo(CollectionDigitalService::class, 'digital_service_id');
    }

    public function digitalOwnershipType(): BelongsTo
    {
        return $this->belongsTo(CollectionDigitalOwnershipType::class, 'digital_ownership_type_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(UserCollectionGameImage::class, 'game_id')->orderBy('sort_order')->orderBy('id');
    }

    public function primaryImage(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(UserCollectionGameImage::class, 'game_id')->where('is_primary', true);
    }
}
