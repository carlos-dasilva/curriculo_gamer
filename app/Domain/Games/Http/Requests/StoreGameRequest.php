<?php

namespace App\Domain\Games\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGameRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        $gameId = $this->route('game')?->id ?? null;
        return [
            'rawg_id' => ['nullable','integer','min:1', Rule::unique('games','rawg_id')->ignore($gameId)],
            'name' => ['required','string','max:255'],
            'studio_id' => ['nullable','integer', Rule::exists('studios','id')],
            'cover_url' => ['nullable','url','max:2048'],
            'status' => ['nullable', Rule::in(['avaliacao','liberado'])],
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

            'external_links' => ['array'],
            'external_links.*.label' => ['nullable','string','max:80','required_with:external_links.*.url'],
            'external_links.*.url' => ['nullable','url','max:2048','required_with:external_links.*.label'],

            'metacritic_metascore' => ['nullable','integer','min:0','max:100'],
            'metacritic_user_score' => ['nullable','numeric','min:0','max:10'],
            'overall_score' => ['nullable','numeric','min:0','max:10'],
            'difficulty' => ['nullable','numeric','min:0','max:10'],
            'gameplay_hours' => ['nullable','numeric','min:0'],
            'hours_to_finish' => ['nullable','integer','min:0'],
            'ptbr_subtitled' => ['boolean'],
            'ptbr_dubbed' => ['boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // Normalize studio_id and optional numeric fields
        $studio = $this->input('studio_id');
        $studioId = ($studio === '' || $studio === null) ? null : (int) $studio;
        $rawg = $this->input('rawg_id');
        $rawgId = ($rawg === '' || $rawg === null) ? null : (int) $rawg;

        $normalizeNum = function ($key, $cast = 'float') {
            $val = $this->input($key);
            if ($val === '' || $val === null) return null;
            return $cast === 'int' ? (int) $val : (float) $val;
        };
        $gallery = collect((array) $this->input('gallery_urls', []))
            ->map(fn($u) => is_string($u) ? trim($u) : ($u ?? ''))
            ->filter(fn($u) => $u !== '')
            ->values()
            ->all();

        $links = collect((array) $this->input('external_links', []))
            ->map(function ($l) {
                $label = is_string(data_get($l, 'label')) ? trim((string) data_get($l, 'label')) : '';
                $url = is_string(data_get($l, 'url')) ? trim((string) data_get($l, 'url')) : '';
                return ['label' => $label, 'url' => $url];
            })
            ->filter(fn($l) => $l['label'] !== '' || $l['url'] !== '')
            ->values()
            ->all();

        $this->merge([
            'rawg_id' => $rawgId,
            'studio_id' => $studioId,
            'ptbr_subtitled' => filter_var($this->ptbr_subtitled, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false,
            'ptbr_dubbed' => filter_var($this->ptbr_dubbed, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false,
            'gallery_urls' => $gallery,
            'external_links' => $links,
            'metacritic_metascore' => $normalizeNum('metacritic_metascore', 'int'),
            'metacritic_user_score' => $normalizeNum('metacritic_user_score'),
            'overall_score' => $normalizeNum('overall_score'),
            'difficulty' => $normalizeNum('difficulty'),
            'gameplay_hours' => $normalizeNum('gameplay_hours'),
            'hours_to_finish' => $normalizeNum('hours_to_finish', 'int'),
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
