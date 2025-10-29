<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'telefone',
        'endereco',
        'github',
        'linkedin',
        'instagram',
        'facebook',
        'x',
        'youtube',
        'whatsapp',
        'discord',
        'system_logs_enabled',
        'system_logs_path',
    ];
}
