<?php

namespace App\Domain\Platforms\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePlatformRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $currentYear = (int) date('Y') + 1;
        return [
            'name' => ['required','string','min:2','max:150','unique:platforms,name'],
            'rawg_id' => ['nullable','integer','min:1','unique:platforms,rawg_id'],
            'manufacturer' => ['nullable','string','max:150'],
            'release_year' => ['nullable','integer','min:1970','max:'.$currentYear],
            'description' => ['nullable','string','max:2000'],
        ];
    }
}
