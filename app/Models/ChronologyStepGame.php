<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChronologyStepGame extends Model
{
    use HasFactory;

    protected $fillable = [
        'chronology_step_id',
        'game_id',
        'position',
    ];

    public function step()
    {
        return $this->belongsTo(ChronologyStep::class, 'chronology_step_id');
    }

    public function game()
    {
        return $this->belongsTo(Game::class);
    }
}
