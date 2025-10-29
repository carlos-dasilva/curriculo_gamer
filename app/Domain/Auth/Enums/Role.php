<?php

namespace App\Domain\Auth\Enums;

enum Role: string
{
    case CO_MUM = 'co.mum';
    case MODERADOR = 'moderador';
    case ADMIN = 'admin';
}

