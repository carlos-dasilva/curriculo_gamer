<?php

namespace App\Domain\Tags\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTagRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $id = $this->route('tag')?->id ?? null;
        return [
            'name' => ['required','string','min:2','max:100', Rule::unique('tags','name')->ignore($id)],
            'slug' => ['nullable','string','min:2','max:120', Rule::unique('tags','slug')->ignore($id)],
            'description' => ['nullable','string','max:2000'],
        ];
    }
}

