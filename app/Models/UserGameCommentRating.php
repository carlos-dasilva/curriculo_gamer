<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserGameCommentRating extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_id', 'comment_user_id', 'rated_by_user_id', 'rating',
    ];
}

