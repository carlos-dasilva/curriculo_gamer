<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class Game extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'rawg_id',
        'studio_id',
        'name',
        'cover_url',
        'status',
        'released_by',
        'created_by',
        'age_rating',
        'description',
        'metacritic_metascore',
        'metacritic_user_score',
        'overall_score',
        'difficulty',
        'gameplay_hours',
        'hours_to_finish',
        'ptbr_subtitled',
        'ptbr_dubbed',
    ];

    protected $casts = [
        'rawg_id' => 'integer',
        'ptbr_subtitled' => 'boolean',
        'ptbr_dubbed' => 'boolean',
        'metacritic_user_score' => 'decimal:2',
        'overall_score' => 'decimal:2',
        'difficulty' => 'decimal:2',
        'gameplay_hours' => 'decimal:1',
        'hours_to_finish' => 'integer',
    ];

    public function studio()
    {
        return $this->belongsTo(Studio::class);
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'game_tag');
    }

    public function platforms()
    {
        return $this->belongsToMany(Platform::class, 'game_platform')->withPivot('release_date');
    }

    public function images()
    {
        return $this->hasMany(GameImage::class);
    }

    public function links()
    {
        return $this->hasMany(GameLink::class);
    }

    public function releasedBy()
    {
        return $this->belongsTo(User::class, 'released_by');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
