<?php

namespace App\Domain\Chronologies\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreChronologyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'description' => ['nullable', 'string', 'max:5000'],
            'steps' => ['required', 'array', 'min:1', 'max:80'],
            'steps.*.title' => ['nullable', 'string', 'max:160'],
            'steps.*.game_ids' => ['required', 'array', 'min:1', 'max:12'],
            'steps.*.game_ids.*' => [
                'required',
                'integer',
                Rule::exists('games', 'id')->where(fn ($query) => $query->where('status', 'liberado')),
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        $steps = collect((array) $this->input('steps', []))
            ->map(function ($step) {
                $gameIds = collect((array) data_get($step, 'game_ids', []))
                    ->map(fn ($id) => (int) $id)
                    ->filter(fn ($id) => $id > 0)
                    ->unique()
                    ->values()
                    ->all();

                return [
                    'title' => trim((string) data_get($step, 'title', '')),
                    'game_ids' => $gameIds,
                ];
            })
            ->filter(fn ($step) => count($step['game_ids']) > 0)
            ->values()
            ->all();

        $this->merge([
            'name' => trim((string) $this->input('name', '')),
            'description' => trim((string) $this->input('description', '')) ?: null,
            'steps' => $steps,
        ]);
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $allGameIds = collect((array) $this->input('steps', []))
                ->flatMap(fn ($step) => (array) data_get($step, 'game_ids', []))
                ->map(fn ($id) => (int) $id)
                ->filter();

            if ($allGameIds->duplicates()->isNotEmpty()) {
                $validator->errors()->add('steps', 'Um mesmo jogo não pode aparecer em mais de uma etapa da cronologia.');
            }
        });
    }
}
