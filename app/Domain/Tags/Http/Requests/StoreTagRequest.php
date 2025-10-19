<?php

namespace App\Domain\Tags\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTagRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'name' => ['required','string','min:2','max:100','unique:tags,name'],
            'slug' => ['nullable','string','min:2','max:120','unique:tags,slug'],
            'description' => ['nullable','string','max:2000'],
        ];
    }
}

