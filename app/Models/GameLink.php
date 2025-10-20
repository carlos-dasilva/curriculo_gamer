<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GameLink extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_id',
        'label',
        'url',
    ];

    public function game()
    {
        return $this->belongsTo(Game::class);
    }
}

