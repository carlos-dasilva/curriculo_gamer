<?php

namespace App\Domain\Games\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Arr;

class SyncGameStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id' => ['nullable', 'integer', 'min:1'],
            'rawg_id' => ['required', 'integer', 'min:1'],
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
            'platforms.*.rawg_id' => ['nullable', 'integer', 'min:1'],
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
        $rawgOriginal = (array) $this->input('rawg_original', []);
        $released = $this->firstFilled([
            $this->input('released'),
            $this->input('release_date'),
            $this->input('data_lancamento'),
            $this->input('data_lançamento'),
            data_get($rawgOriginal, 'released'),
        ]);

        $payload = [
            'id' => $this->toIntOrNull($this->input('id')),
            'rawg_id' => $this->toIntOrNull($this->firstFilled([
                $this->input('rawg_id'),
                data_get($rawgOriginal, 'id'),
                $this->input('id'),
            ])),
            'studio_id' => $this->toIntOrNull($this->input('studio_id')),
            'name' => $this->firstFilled([
                $this->input('name'),
                $this->input('nome'),
                data_get($rawgOriginal, 'name'),
            ]),
            'cover_url' => $this->firstFilled([
                $this->input('cover_url'),
                $this->input('imagem_capa'),
                $this->input('capa'),
                $this->input('background_image'),
                data_get($rawgOriginal, 'background_image'),
            ]),
            'status' => $this->input('status', 'liberado'),
            'age_rating' => $this->normalizeAgeRating($this->firstFilled([
                $this->input('age_rating'),
                $this->input('classificacao_indicativa'),
                $this->input('classificação_indicativa'),
                $this->input('classificacao'),
                data_get($rawgOriginal, 'esrb_rating.name'),
                data_get($rawgOriginal, 'esrb_rating.slug'),
            ])),
            'description' => $this->firstFilled([
                $this->input('description'),
                $this->input('descricao'),
                $this->input('descrição'),
                $this->input('sinopse'),
                $this->input('descricao_sinopse'),
                data_get($rawgOriginal, 'description_raw'),
                data_get($rawgOriginal, 'description'),
            ]),
            'metacritic_metascore' => $this->toIntOrNull($this->firstFilled([
                $this->input('metacritic_metascore'),
                $this->input('metascore'),
                $this->input('metacritic'),
                data_get($rawgOriginal, 'metacritic'),
            ])),
            'metacritic_user_score' => $this->toDecimalOrNull($this->firstFilled([
                $this->input('metacritic_user_score'),
                $this->input('usercore'),
                $this->input('user_score'),
                $this->input('userscore'),
            ])),
            'overall_score' => $this->toDecimalOrNull($this->input('overall_score')),
            'difficulty' => $this->toDecimalOrNull($this->input('difficulty')),
            'gameplay_hours' => $this->toDecimalOrNull($this->input('gameplay_hours')),
            'hours_to_finish' => $this->toIntOrNull($this->firstFilled([
                $this->input('hours_to_finish'),
                $this->input('horas_para_finalizar'),
                $this->input('horas_finalizar'),
            ])),
        ];

        $payload['ptbr_subtitled'] = $this->toBool($this->input('ptbr_subtitled'), false);
        $payload['ptbr_dubbed'] = $this->toBool($this->input('ptbr_dubbed'), false);
        $payload['studio'] = $this->normalizeStudio($this->firstFilled([
            $this->input('studio'),
            $this->input('estudio'),
            $this->input('estúdio'),
            Arr::first((array) data_get($rawgOriginal, 'developers', [])),
        ]));
        $payload['tags'] = $this->normalizeTags($this->firstFilled([
            $this->input('tags'),
            $this->input('marcadores'),
            data_get($rawgOriginal, 'genres'),
            data_get($rawgOriginal, 'tags'),
        ], []));
        $payload['platforms'] = $this->normalizePlatforms($this->firstFilled([
            $this->input('platforms'),
            $this->input('plataformas'),
            data_get($rawgOriginal, 'platforms'),
        ], []), $released);
        $payload['images'] = $this->normalizeImages($this->firstFilled([
            $this->input('images'),
            $this->input('imagens'),
            $this->input('short_screenshots'),
            data_get($rawgOriginal, 'short_screenshots'),
        ], []));
        if ($this->has('external_links')) {
            $payload['external_links'] = $this->normalizeLinks($this->input('external_links', []));
        }

        $this->merge(array_filter($payload, fn ($value) => $value !== null));
    }

    private function toIntOrNull($value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
    }

    private function toBool($value, ?bool $default = null): ?bool
    {
        if ($value === null || $value === '') {
            return $default;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    }

    private function toDecimalOrNull($value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (float) str_replace(',', '.', (string) $value);
    }

    private function firstFilled(array $values, $default = null)
    {
        foreach ($values as $value) {
            if ($value !== null && $value !== '') {
                return $value;
            }
        }

        return $default;
    }

    private function normalizeAgeRating($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $rating = mb_strtolower(trim((string) $value));

        return match ($rating) {
            'ec', 'early childhood' => '3+',
            'e', 'everyone' => '6+',
            'e10', 'e10+', 'everyone 10+', 'everyone-10-plus' => '10+',
            't', 'teen' => '13+',
            'm', 'mature', 'mature 17+' => '17+',
            'ao', 'adults only', 'adults only 18+' => '18+',
            default => preg_match('/^\d+\+$/', $rating) ? $rating : trim((string) $value),
        };
    }

    private function normalizeStudio($studio): array
    {
        if (is_string($studio)) {
            $studio = ['name' => $studio];
        }

        $id = $this->toIntOrNull(data_get($studio, 'id'));
        $name = is_string(data_get($studio, 'name')) ? trim((string) data_get($studio, 'name')) : '';

        return array_filter([
            'id' => $id,
            'name' => $name,
        ], fn ($value) => $value !== null && $value !== '');
    }

    private function normalizeTags($tags): array
    {
        return collect((array) $tags)
            ->take(8)
            ->map(function ($tag) {
                return [
                    'id' => $this->toIntOrNull(data_get($tag, 'id')),
                    'name' => is_string(data_get($tag, 'name')) ? trim((string) data_get($tag, 'name')) : '',
                    'slug' => is_string(data_get($tag, 'slug')) ? trim((string) data_get($tag, 'slug')) : '',
                ];
            })
            ->filter(fn ($tag) => $tag['id'] !== null || $tag['name'] !== '')
            ->values()
            ->all();
    }

    private function normalizePlatforms($platforms, ?string $fallbackReleaseDate = null): array
    {
        return collect((array) $platforms)
            ->map(function ($platform) use ($fallbackReleaseDate) {
                $release = is_string(data_get($platform, 'release_date')) ? trim((string) data_get($platform, 'release_date')) : null;
                $release = $release ?: (is_string(data_get($platform, 'released_at')) ? trim((string) data_get($platform, 'released_at')) : null);
                $release = $release ?: $fallbackReleaseDate;
                $rawgPlatform = (array) data_get($platform, 'platform', []);
                $rawgId = $this->toIntOrNull($this->firstFilled([
                    data_get($platform, 'rawg_id'),
                    data_get($rawgPlatform, 'id'),
                ]));

                return [
                    'id' => $this->toIntOrNull(data_get($platform, 'local_id') ?? ($rawgId === null ? data_get($platform, 'id') : null)),
                    'rawg_id' => $rawgId,
                    'name' => $this->firstFilled([
                        is_string(data_get($platform, 'name')) ? trim((string) data_get($platform, 'name')) : null,
                        is_string(data_get($rawgPlatform, 'name')) ? trim((string) data_get($rawgPlatform, 'name')) : null,
                    ], ''),
                    'release_date' => $release ?: null,
                ];
            })
            ->filter(fn ($platform) => $platform['id'] !== null || $platform['rawg_id'] !== null || $platform['name'] !== '')
            ->values()
            ->all();
    }

    private function normalizeImages($images): array
    {
        return collect((array) $images)
            ->values()
            ->map(function ($image, int $index) {
                return [
                    'url' => $this->firstFilled([
                        is_string(data_get($image, 'url')) ? trim((string) data_get($image, 'url')) : null,
                        is_string(data_get($image, 'image')) ? trim((string) data_get($image, 'image')) : null,
                    ], ''),
                    'sort_order' => $this->toIntOrNull(data_get($image, 'sort_order')) ?? $index,
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
                return [
                    'label' => is_string(data_get($link, 'label')) ? trim((string) data_get($link, 'label')) : '',
                    'url' => is_string(data_get($link, 'url')) ? trim((string) data_get($link, 'url')) : '',
                ];
            })
            ->filter(fn ($link) => $link['label'] !== '' || $link['url'] !== '')
            ->values()
            ->all();
    }
}
