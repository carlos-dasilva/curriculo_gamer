<?php

namespace App\Domain\Legal\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;

class TermsController extends Controller
{
    public function index()
    {
        return Inertia::render('Legal/Terms', [
            'updatedAt' => config('legal.terms.updated_at'),
            'effectiveAt' => config('legal.terms.effective_at'),
        ]);
    }
}
