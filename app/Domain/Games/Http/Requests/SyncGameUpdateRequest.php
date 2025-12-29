<?php

namespace App\Domain\Games\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncGameUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Autenticacao feita via middleware de token na rota.
        return true;
    }

    public function rules(): array
    {
        return [
            'id' => ['required', 'integer', 'exists:games,id'],
            'rawg_id' => ['nullable', 'integer', 'min:1'],
            'studio_id' => ['nullable', 'integer', 'exists:studios,id'],
            'name' => ['required', 'string', 'max:255'],
            'cover_url' => ['nullable', 'url', 'max:2048'],
            'status' => ['nullable', Rule::in(['avaliacao', 'liberado'])],
            'age_rating' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string', 'max:10000'],
            'metacritic_metascore' => ['nullable', 'integer', 'min:0', 'max:100'],
            'metacritic_user_score' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'overall_score' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'difficulty' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'gameplay_hours' => ['nullable', 'numeric', 'min:0'],
            'hours_to_finish' => ['nullable', 'integer', 'min:0'],
            'ptbr_subtitled' => ['boolean'],
            'ptbr_dubbed' => ['boolean'],

            'studio' => ['array'],
            'studio.id' => ['nullable', 'integer', 'exists:studios,id'],
            'studio.name' => ['nullable', 'string', 'max:255'],

            'tags' => ['array'],
            'tags.*.id' => ['nullable', 'integer', 'exists:tags,id'],
            'tags.*.name' => ['required_without:tags.*.id', 'string', 'max:255'],
            'tags.*.slug' => ['nullable', 'string', 'max:255'],

            'platforms' => ['array'],
            'platforms.*.id' => ['nullable', 'integer', 'exists:platforms,id'],
            'platforms.*.name' => ['required_without:platforms.*.id', 'string', 'max:255'],
            'platforms.*.release_date' => ['nullable', 'date_format:Y-m-d'],

            'images' => ['array'],
            'images.*.url' => ['required', 'url', 'max:2048'],
            'images.*.sort_order' => ['nullable', 'integer', 'min:0'],

            'external_links' => ['array'],
            'external_links.*.label' => ['required', 'string', 'max:80'],
            'external_links.*.url' => ['required', 'url', 'max:2048'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $payload = [
            'id' => $this->toInt($this->input('id') ?? $this->route('game')?->id),
            'rawg_id' => $this->toIntOrNull($this->input('rawg_id')),
            'studio_id' => $this->toIntOrNull($this->input('studio_id')),
        ];

        if ($this->has('ptbr_subtitled')) {
            $payload['ptbr_subtitled'] = $this->toBool($this->input('ptbr_subtitled'));
        }
        if ($this->has('ptbr_dubbed')) {
            $payload['ptbr_dubbed'] = $this->toBool($this->input('ptbr_dubbed'));
        }
        if ($this->has('studio')) {
            $payload['studio'] = $this->normalizeStudio($this->input('studio'));
        }
        if ($this->has('tags')) {
            $payload['tags'] = $this->normalizeTags($this->input('tags', []));
        }
        if ($this->has('platforms')) {
            $payload['platforms'] = $this->normalizePlatforms($this->input('platforms', []));
        }
        if ($this->has('images')) {
            $payload['images'] = $this->normalizeImages($this->input('images', []));
        }
        if ($this->has('external_links')) {
            $payload['external_links'] = $this->normalizeLinks($this->input('external_links', []));
        }

        $this->merge($payload);
    }

    private function toInt($value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }
        return (int) $value;
    }

    private function toIntOrNull($value): ?int
    {
        return $this->toInt($value);
    }

    private function toBool($value, $default = null): ?bool
    {
        if ($value === null || $value === '') {
            return $default;
        }
        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    }

    private function normalizeStudio($studio): array
    {
        $id = $this->toIntOrNull(data_get($studio, 'id'));
        $name = is_string(data_get($studio, 'name')) ? trim((string) data_get($studio, 'name')) : '';
        return array_filter([
            'id' => $id,
            'name' => $name,
        ], function ($val) {
            return $val !== null && $val !== '';
        });
    }

    private function normalizeTags($tags): array
    {
        return collect((array) $tags)
            ->map(function ($tag) {
                $id = $this->toIntOrNull(data_get($tag, 'id'));
                $name = is_string(data_get($tag, 'name')) ? trim((string) data_get($tag, 'name')) : '';
                $slug = is_string(data_get($tag, 'slug')) ? trim((string) data_get($tag, 'slug')) : '';
                return [
                    'id' => $id,
                    'name' => $name,
                    'slug' => $slug,
                ];
            })
            ->filter(fn ($tag) => $tag['id'] !== null || $tag['name'] !== '')
            ->values()
            ->all();
    }

    private function normalizePlatforms($platforms): array
    {
        return collect((array) $platforms)
            ->map(function ($platform) {
                $id = $this->toIntOrNull(data_get($platform, 'id'));
                $name = is_string(data_get($platform, 'name')) ? trim((string) data_get($platform, 'name')) : '';
                $release = is_string(data_get($platform, 'release_date')) ? trim((string) data_get($platform, 'release_date')) : null;
                return [
                    'id' => $id,
                    'name' => $name,
                    'release_date' => $release ?: null,
                ];
            })
            ->filter(fn ($platform) => $platform['id'] !== null || $platform['name'] !== '')
            ->values()
            ->all();
    }

    private function normalizeImages($images): array
    {
        return collect((array) $images)
            ->map(function ($image) {
                $url = is_string(data_get($image, 'url')) ? trim((string) data_get($image, 'url')) : '';
                $sort = $this->toIntOrNull(data_get($image, 'sort_order'));
                return [
                    'url' => $url,
                    'sort_order' => $sort,
                ];
            })
            ->filter(fn ($image) => $image['url'] !== '')
            ->values()
            ->all();
    }

    private function normalizeLinks($links): array
    {
        return collect((array) $links)
            ->map(function ($link) {
                $label = is_string(data_get($link, 'label')) ? trim((string) data_get($link, 'label')) : '';
                $url = is_string(data_get($link, 'url')) ? trim((string) data_get($link, 'url')) : '';
                return [
                    'label' => $label,
                    'url' => $url,
                ];
            })
            ->filter(fn ($link) => $link['label'] !== '' || $link['url'] !== '')
            ->values()
            ->all();
    }
}
