<?php

namespace App\Domain\Legal\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;

class PrivacyController extends Controller
{
    public function index()
    {
        return Inertia::render('Legal/Privacy');
    }
}

