<?php

namespace App\Domain\Studios\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $studioId = $this->route('studio')?->id ?? null;
        return [
            'name' => ['required','string','min:2','max:150', Rule::unique('studios','name')->ignore($studioId)],
            'website' => ['nullable','string','max:200'],
            'email' => ['nullable','email','max:150'],
            'phone' => ['nullable','string','max:50'],
            'country' => ['nullable','string','max:80'],
            'founded_year' => ['nullable','integer','min:1800','max:'.(date('Y')+1)],
            'description' => ['nullable','string','max:2000'],
        ];
    }
}

