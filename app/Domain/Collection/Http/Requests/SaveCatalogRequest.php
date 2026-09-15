<?php

namespace App\Domain\Collection\Http\Requests;

use App\Domain\Auth\Enums\Role;
use App\Domain\Collection\Rules\ExternalUrl;
use App\Domain\Collection\Support\CollectionCatalogs;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class SaveCatalogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === Role::ADMIN;
    }

    protected function prepareForValidation(): void
    {
        if (! $this->filled('slug')) {
            $this->merge(['slug' => Str::slug((string) $this->input('name'))]);
        }
    }

    public function rules(): array
    {
        $model = CollectionCatalogs::model($this->route('catalog'));
        $rules = [
            'name' => ['required', 'string', 'max:150'],
            'slug' => ['required', 'string', 'max:150', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique($model->getTable(), 'slug')->ignore($this->route('entry'))],
            'is_active' => ['required', 'boolean'],
        ];
        if ($this->route('catalog') !== 'companies') {
            $rules['sort_order'] = ['required', 'integer', 'min:0', 'max:100000'];
        }
        if (in_array($this->route('catalog'), ['companies', 'digital-stores'])) {
            foreach (['website_url', 'logo_url'] as $field) {
                $rules[$field] = ['nullable', 'string', 'max:2048', new ExternalUrl];
            }
        }
        if ($this->route('catalog') === 'digital-stores') {
            $rules['icon_url'] = ['nullable', 'string', 'max:2048', new ExternalUrl];
            $rules['color'] = ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return ['required' => 'Este campo é obrigatório.', 'unique' => 'Este identificador já está em uso.',
            'max' => 'O valor excede o limite permitido.', 'regex' => 'Formato inválido.',
            'integer' => 'Informe um número inteiro.', 'min' => 'O valor está abaixo do mínimo permitido.'];
    }
}
