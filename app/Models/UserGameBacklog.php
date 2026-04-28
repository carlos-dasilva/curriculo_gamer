<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserGameBacklog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'game_id',
        'position',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'game_id' => 'integer',
        'position' => 'integer',
    ];

    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
