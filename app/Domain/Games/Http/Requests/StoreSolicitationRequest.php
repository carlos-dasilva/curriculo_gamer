<?php

namespace App\Domain\Games\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSolicitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'name' => ['required','string','max:255'],
            'rawg_id' => ['nullable','integer','min:1'],
            'studio_id' => ['nullable','integer', Rule::exists('studios','id')],
            'cover_url' => ['nullable','url','max:2048'],
            'age_rating' => ['nullable','string','max:50'],
            'description' => ['nullable','string','max:10000'],

            'tag_ids' => ['array'],
            'tag_ids.*' => ['integer', Rule::exists('tags','id')],

            'platform_ids' => ['array'],
            'platform_ids.*' => ['integer', Rule::exists('platforms','id')],
            'platform_releases' => ['array'],
            'platform_releases.*' => ['nullable','date_format:Y-m-d'],

            'gallery_urls' => ['array'],
            'gallery_urls.*' => ['nullable','url','max:2048'],

            'hours_to_finish' => ['nullable','integer','min:0'],
            'ptbr_subtitled' => ['boolean'],
            'ptbr_dubbed' => ['boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Normalize studio_id
        $studio = $this->input('studio_id');
        $studioId = ($studio === '' || $studio === null) ? null : (int) $studio;
        $rawg = $this->input('rawg_id');
        $rawgId = ($rawg === '' || $rawg === null) ? null : (int) $rawg;
        $gallery = collect((array) $this->input('gallery_urls', []))
            ->map(fn($u) => is_string($u) ? trim($u) : ($u ?? ''))
            ->filter(fn($u) => $u !== '')
            ->values()
            ->all();

        $this->merge([
            'rawg_id' => $rawgId,
            'studio_id' => $studioId,
            'ptbr_subtitled' => filter_var($this->ptbr_subtitled, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false,
            'ptbr_dubbed' => filter_var($this->ptbr_dubbed, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false,
            'gallery_urls' => $gallery,
            'hours_to_finish' => ($this->input('hours_to_finish') === '' || $this->input('hours_to_finish') === null) ? null : (int) $this->input('hours_to_finish'),
        ]);
    }

    public function withValidator($validator)
    {
        $validator->after(function ($v) {
            $ids = collect((array) $this->input('platform_ids', []))->map(fn($i)=>(int)$i)->filter()->all();
            $releases = array_keys((array) $this->input('platform_releases', []));
            foreach ($releases as $rid) {
                if (!in_array((int)$rid, $ids, true)) {
                    $v->errors()->add('platform_releases', 'Há datas para plataformas não selecionadas.');
                    break;
                }
            }
        });
    }
}
