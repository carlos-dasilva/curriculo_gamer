<?php

namespace App\Domain\Legal\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;

class PrivacyController extends Controller
{
    public function index()
    {
        return Inertia::render('Legal/Privacy', [
            'updatedAt' => config('legal.privacy.updated_at'),
            'effectiveAt' => config('legal.privacy.effective_at'),
        ]);
    }
}
