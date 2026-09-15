<?php

namespace App\Domain\Collection\Http\Requests;

use App\Domain\Collection\Rules\ExternalUrl;
use App\Domain\Collection\Support\CollectionCatalogs;
use App\Domain\Collection\Support\CollectionItems;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SaveCollectionItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        if (! $this->user()) {
            return false;
        }
        if ($this->route('item')) {
            CollectionItems::owned($this->route('kind'), $this->user()->id, (int) $this->route('item'));
        }

        return true;
    }

    protected function prepareForValidation(): void
    {
        $clear = [];
        if ($this->route('kind') === 'jogos') {
            $fields = $this->input('media_type') === 'digital' ? CollectionItems::PHYSICAL_FIELDS : CollectionItems::DIGITAL_FIELDS;
            foreach ($fields as $field) {
                $clear[$field] = null;
            }
        }
        if (! $this->boolean('has_box')) {
            foreach (CollectionItems::BOX_FIELDS as $field) {
                $clear[$field] = null;
            }
        }
        $this->merge($clear);
    }

    public function rules(): array
    {
        $kind = $this->route('kind');
        $definition = CollectionItems::definition($kind);
        $current = $this->route('item') ? CollectionItems::owned($kind, $this->user()->id, (int) $this->route('item')) : null;
        $rules = [
            'user_id' => ['prohibited'], 'item_status_id' => ['prohibited'],
            'images' => ['present', 'array', 'max:20'],
            'images.*' => ['array:url,description,is_primary'],
            'images.*.url' => ['required', 'string', 'max:2048', new ExternalUrl],
            'images.*.description' => ['nullable', 'string', 'max:255'],
            'images.*.is_primary' => ['required', 'boolean'],
        ];
        foreach ($definition['fields'] as $field) {
            $key = $field['key'];
            $required = $field['required'];
            if ($kind === 'jogos' && in_array($key, CollectionItems::DIGITAL_FIELDS)) {
                $required = $required && $this->input('media_type') === 'digital';
            }
            $rule = [$required ? 'required' : 'nullable'];
            switch ($field['type']) {
                case 'catalog':
                    $table = CollectionCatalogs::model($field['catalog'])->getTable();
                    $rule = [...$rule, 'integer', Rule::exists($table, 'id')->where(function ($query) use ($current, $key) {
                        $query->where(fn ($q) => $q->where('is_active', true)->orWhere('id', $current?->{$key} ?? 0));
                    })];
                    break;
                case 'game':
                    $rule = [...$rule, 'integer', Rule::exists('games', 'id')->where(function ($q) use ($current) {
                        $q->where(fn ($sub) => $sub->where(fn ($visible) => $visible->whereNull('deleted_at')->where('status', 'liberado'))
                            ->orWhere('id', $current?->game_id ?? 0));
                    })];
                    break;
                case 'platform': $rule = [...$rule, 'integer', 'exists:platforms,id'];
                    break;
                case 'platforms': $rule = [...$rule, 'array', 'min:1', 'max:100'];
                    $rules['platform_ids.*'] = ['required', 'integer', 'distinct', 'exists:platforms,id'];
                    break;
                case 'console':
                    $rule = [...$rule, 'integer', Rule::exists('user_collection_consoles', 'id')->where('user_id', $this->user()->id)->whereNull('deleted_at')];
                    break;
                case 'score': $rule = [...$rule, 'integer', 'min:1', 'max:10'];
                    break;
                case 'quantity': $rule = [...$rule, 'integer', 'min:1', 'max:1000000'];
                    break;
                case 'money': $rule = [...$rule, 'numeric', 'decimal:0,2', 'min:0', 'max:9999999999.99'];
                    break;
                case 'date': $rule = [...$rule, 'date_format:Y-m-d', 'before_or_equal:today'];
                    break;
                case 'bool': $rule[] = 'boolean';
                    break;
                case 'media': $rule[] = Rule::in(['physical', 'digital']);
                    break;
                case 'connection': $rule[] = Rule::in(['wired', 'wireless', 'both', 'unknown']);
                    break;
                default: $rule = [...$rule, 'string', 'max:'.($field['type'] === 'textarea' ? 10000 : 255)];
            }
            $rules[$key] = $rule;
        }

        return $rules;
    }

    public function after(): array
    {
        return [function ($validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }
            if ($this->route('kind') === 'jogos') {
                $current = $this->route('item') ? CollectionItems::owned('jogos', $this->user()->id, (int) $this->route('item')) : null;
                $unchangedCopy = $current && $current->game_id === $this->integer('game_id') && $current->platform_id === $this->integer('platform_id');
                if (! $unchangedCopy && ! DB::table('game_platform')
                    ->where('game_id', $this->integer('game_id'))->where('platform_id', $this->integer('platform_id'))->exists()) {
                    $validator->errors()->add('platform_id', 'Selecione uma plataforma cadastrada para este jogo.');
                }
            }
            if ($this->route('kind') === 'acessorios' && $this->filled('collection_console_id')) {
                $platform = DB::table('user_collection_consoles')->where('id', $this->integer('collection_console_id'))->value('platform_id');
                if (! in_array((int) $platform, array_map('intval', $this->input('platform_ids', [])), true)) {
                    $validator->errors()->add('collection_console_id', 'O console deve pertencer a uma plataforma compatível.');
                }
            }
            if (collect($this->input('images', []))->filter(fn ($image) => (bool) ($image['is_primary'] ?? false))->count() > 1) {
                $validator->errors()->add('images', 'Escolha somente uma imagem principal.');
            }
        }];
    }

    public function attributes(): array
    {
        return collect(CollectionItems::definition($this->route('kind'))['fields'])->pluck('label', 'key')->all();
    }

    public function messages(): array
    {
        return ['required' => 'Informe :attribute.', 'exists' => 'A opção selecionada não está disponível.',
            'integer' => 'Informe um número inteiro.', 'min' => 'O valor mínimo permitido é :min.',
            'max' => 'O limite permitido é :max.', 'date_format' => 'Informe uma data válida.',
            'before_or_equal' => 'A aquisição não pode estar no futuro.', 'decimal' => 'Use no máximo duas casas decimais.',
            'numeric' => 'Informe um número válido.', 'boolean' => 'Selecione sim, não ou não informado.',
            'prohibited' => 'Este campo não pode ser informado.', 'in' => 'Selecione uma opção válida.',
            'images.present' => 'Informe a lista de imagens, mesmo que vazia.',
            'distinct' => 'Não repita plataformas.', 'array' => 'Formato inválido.'];
    }
}
