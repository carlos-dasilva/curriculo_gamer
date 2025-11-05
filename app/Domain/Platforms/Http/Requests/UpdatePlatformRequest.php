<?php

namespace App\Domain\Platforms\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePlatformRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $platformId = $this->route('platform')?->id ?? null;
        $currentYear = (int) date('Y') + 1;
        return [
            'name' => ['required','string','min:2','max:150', Rule::unique('platforms','name')->ignore($platformId)],
            'rawg_id' => ['nullable','integer','min:1', Rule::unique('platforms','rawg_id')->ignore($platformId)],
            'manufacturer' => ['nullable','string','max:150'],
            'release_year' => ['nullable','integer','min:1970','max:'.$currentYear],
            'description' => ['nullable','string','max:2000'],
        ];
    }
}
