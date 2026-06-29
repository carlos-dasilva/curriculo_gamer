<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChronologyStep extends Model
{
    use HasFactory;

    protected $fillable = [
        'chronology_id',
        'position',
        'title',
    ];

    public function chronology()
    {
        return $this->belongsTo(Chronology::class);
    }

    public function stepGames()
    {
        return $this->hasMany(ChronologyStepGame::class)->orderBy('position');
    }

    public function games()
    {
        return $this->belongsToMany(Game::class, 'chronology_step_games')
            ->withPivot('position')
            ->withTimestamps()
            ->orderBy('chronology_step_games.position');
    }
}
