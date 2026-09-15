<?php

namespace App\Domain\Collection\Support;

use Illuminate\Database\Eloquent\Model;

class CollectionItems
{
    public const DEFINITIONS = [
        'consoles' => ['model' => \App\Models\UserCollectionConsole::class, 'label' => 'Consoles', 'singular' => 'Console', 'fields' => [
            ['key' => 'platform_id', 'label' => 'Console / plataforma', 'type' => 'platform', 'group' => 'Item', 'required' => true],
            ['key' => 'nickname', 'label' => 'Apelido', 'type' => 'text', 'group' => 'Item', 'required' => false],
            ['key' => 'serial_number', 'label' => 'Número de série', 'type' => 'text', 'group' => 'Item', 'required' => false],
            ['key' => 'region_id', 'label' => 'Região', 'type' => 'catalog', 'group' => 'Item', 'required' => false, 'catalog' => 'regions'],
            ['key' => 'aesthetic_condition', 'label' => 'Estado estético (1 a 10)', 'type' => 'score', 'group' => 'Estado', 'required' => false],
            ['key' => 'functional_state_id', 'label' => 'Funcionamento', 'type' => 'catalog', 'group' => 'Estado', 'required' => false, 'catalog' => 'functional-states'],
            ['key' => 'has_box', 'label' => 'Possui caixa', 'type' => 'bool', 'group' => 'Caixa e conteúdo', 'required' => false],
            ['key' => 'box_is_original', 'label' => 'Caixa original', 'type' => 'bool', 'group' => 'Caixa e conteúdo', 'required' => false],
            ['key' => 'box_serial_matches', 'label' => 'Serial da caixa corresponde ao console', 'type' => 'bool', 'group' => 'Caixa e conteúdo', 'required' => false],
            ['key' => 'box_condition', 'label' => 'Estado da caixa (1 a 10)', 'type' => 'score', 'group' => 'Caixa e conteúdo', 'required' => false],
            ['key' => 'has_manual', 'label' => 'Possui manual', 'type' => 'bool', 'group' => 'Caixa e conteúdo', 'required' => false],
            ['key' => 'has_inserts', 'label' => 'Possui encartes', 'type' => 'bool', 'group' => 'Caixa e conteúdo', 'required' => false],
            ['key' => 'has_inner_tray', 'label' => 'Possui berço interno', 'type' => 'bool', 'group' => 'Caixa e conteúdo', 'required' => false],
            ['key' => 'has_original_power_supply', 'label' => 'Possui fonte original', 'type' => 'bool', 'group' => 'Caixa e conteúdo', 'required' => false],
            ['key' => 'has_original_video_cable', 'label' => 'Possui cabo de vídeo original', 'type' => 'bool', 'group' => 'Caixa e conteúdo', 'required' => false],
            ['key' => 'has_other_original_cables', 'label' => 'Possui demais cabos originais', 'type' => 'bool', 'group' => 'Caixa e conteúdo', 'required' => false],
            ['key' => 'acquired_at', 'label' => 'Data de aquisição', 'type' => 'date', 'group' => 'Aquisição', 'required' => false],
            ['key' => 'acquisition_location', 'label' => 'Local de aquisição', 'type' => 'text', 'group' => 'Aquisição', 'required' => false],
            ['key' => 'purchase_price', 'label' => 'Valor pago (R$)', 'type' => 'money', 'group' => 'Aquisição', 'required' => false],
            ['key' => 'notes', 'label' => 'Observações', 'type' => 'textarea', 'group' => 'Observações', 'required' => false],
        ]],
        'jogos' => ['model' => \App\Models\UserCollectionGame::class, 'label' => 'Jogos', 'singular' => 'Jogo', 'fields' => [
            ['key' => 'game_id', 'label' => 'Jogo', 'type' => 'game', 'group' => 'Item', 'required' => true],
            ['key' => 'platform_id', 'label' => 'Plataforma desta cópia', 'type' => 'platform', 'group' => 'Item', 'required' => true],
            ['key' => 'media_type', 'label' => 'Tipo de cópia', 'type' => 'media', 'group' => 'Item', 'required' => true],
            ['key' => 'edition_id', 'label' => 'Edição', 'type' => 'catalog', 'group' => 'Item', 'required' => false, 'catalog' => 'editions'],
            ['key' => 'region_id', 'label' => 'Região', 'type' => 'catalog', 'group' => 'Estado', 'required' => false, 'catalog' => 'regions'],
            ['key' => 'originality_id', 'label' => 'Originalidade', 'type' => 'catalog', 'group' => 'Estado', 'required' => false, 'catalog' => 'originalities'],
            ['key' => 'overall_condition', 'label' => 'Estado geral (1 a 10)', 'type' => 'score', 'group' => 'Estado', 'required' => false],
            ['key' => 'media_condition', 'label' => 'Estado da mídia (1 a 10)', 'type' => 'score', 'group' => 'Estado', 'required' => false],
            ['key' => 'box_condition', 'label' => 'Estado da caixa (1 a 10)', 'type' => 'score', 'group' => 'Estado', 'required' => false],
            ['key' => 'manual_condition', 'label' => 'Estado do manual (1 a 10)', 'type' => 'score', 'group' => 'Estado', 'required' => false],
            ['key' => 'inserts_condition', 'label' => 'Estado dos encartes (1 a 10)', 'type' => 'score', 'group' => 'Estado', 'required' => false],
            ['key' => 'has_media', 'label' => 'Possui mídia / cartucho', 'type' => 'bool', 'group' => 'Caixa e conteúdo', 'required' => false],
            ['key' => 'has_box', 'label' => 'Possui caixa', 'type' => 'bool', 'group' => 'Caixa e conteúdo', 'required' => false],
            ['key' => 'has_manual', 'label' => 'Possui manual', 'type' => 'bool', 'group' => 'Caixa e conteúdo', 'required' => false],
            ['key' => 'has_inserts', 'label' => 'Possui encartes', 'type' => 'bool', 'group' => 'Caixa e conteúdo', 'required' => false],
            ['key' => 'has_extras', 'label' => 'Possui extras', 'type' => 'bool', 'group' => 'Caixa e conteúdo', 'required' => false],
            ['key' => 'digital_store_id', 'label' => 'Loja digital', 'type' => 'catalog', 'group' => 'Acesso digital', 'required' => true, 'catalog' => 'digital-stores'],
            ['key' => 'acquisition_type_id', 'label' => 'Forma de aquisição', 'type' => 'catalog', 'group' => 'Acesso digital', 'required' => true, 'catalog' => 'acquisition-types'],
            ['key' => 'digital_service_id', 'label' => 'Serviço de origem', 'type' => 'catalog', 'group' => 'Acesso digital', 'required' => false, 'catalog' => 'digital-services'],
            ['key' => 'digital_ownership_type_id', 'label' => 'Tipo de posse digital', 'type' => 'catalog', 'group' => 'Acesso digital', 'required' => false, 'catalog' => 'digital-ownership-types'],
            ['key' => 'acquired_at', 'label' => 'Data de aquisição', 'type' => 'date', 'group' => 'Aquisição', 'required' => false],
            ['key' => 'acquisition_location', 'label' => 'Local de aquisição', 'type' => 'text', 'group' => 'Aquisição', 'required' => false],
            ['key' => 'purchase_price', 'label' => 'Valor pago (R$)', 'type' => 'money', 'group' => 'Aquisição', 'required' => false],
            ['key' => 'notes', 'label' => 'Observações', 'type' => 'textarea', 'group' => 'Observações', 'required' => false],
        ]],
        'acessorios' => ['model' => \App\Models\UserCollectionAccessory::class, 'label' => 'Acessórios', 'singular' => 'Acessório', 'fields' => [
            ['key' => 'name', 'label' => 'Nome', 'type' => 'text', 'group' => 'Item', 'required' => true],
            ['key' => 'model', 'label' => 'Modelo', 'type' => 'text', 'group' => 'Item', 'required' => false],
            ['key' => 'accessory_type_id', 'label' => 'Tipo de acessório', 'type' => 'catalog', 'group' => 'Item', 'required' => true, 'catalog' => 'accessory-types'],
            ['key' => 'manufacturer_id', 'label' => 'Fabricante do acessório', 'type' => 'catalog', 'group' => 'Item', 'required' => false, 'catalog' => 'companies'],
            ['key' => 'quantity', 'label' => 'Quantidade', 'type' => 'quantity', 'group' => 'Item', 'required' => true],
            ['key' => 'platform_ids', 'label' => 'Plataformas compatíveis', 'type' => 'platforms', 'group' => 'Compatibilidade', 'required' => true],
            ['key' => 'collection_console_id', 'label' => 'Meu console associado (opcional)', 'type' => 'console', 'group' => 'Compatibilidade', 'required' => false],
            ['key' => 'classification_id', 'label' => 'Classificação do fabricante', 'type' => 'catalog', 'group' => 'Estado', 'required' => false, 'catalog' => 'accessory-classifications'],
            ['key' => 'connection_type', 'label' => 'Conexão', 'type' => 'connection', 'group' => 'Estado', 'required' => false],
            ['key' => 'color', 'label' => 'Cor', 'type' => 'text', 'group' => 'Estado', 'required' => false],
            ['key' => 'serial_number', 'label' => 'Número de série', 'type' => 'text', 'group' => 'Estado', 'required' => false],
            ['key' => 'condition', 'label' => 'Estado do grupo (1 a 10)', 'type' => 'score', 'group' => 'Estado', 'required' => false],
            ['key' => 'has_box', 'label' => 'Possui caixa', 'type' => 'bool', 'group' => 'Caixa e conteúdo', 'required' => false],
            ['key' => 'box_is_original', 'label' => 'Caixa original', 'type' => 'bool', 'group' => 'Caixa e conteúdo', 'required' => false],
            ['key' => 'box_condition', 'label' => 'Estado da caixa (1 a 10)', 'type' => 'score', 'group' => 'Caixa e conteúdo', 'required' => false],
            ['key' => 'has_manual', 'label' => 'Possui manual', 'type' => 'bool', 'group' => 'Caixa e conteúdo', 'required' => false],
            ['key' => 'has_original_items', 'label' => 'Possui itens originais', 'type' => 'bool', 'group' => 'Caixa e conteúdo', 'required' => false],
            ['key' => 'has_original_cables', 'label' => 'Possui cabos originais', 'type' => 'bool', 'group' => 'Caixa e conteúdo', 'required' => false],
            ['key' => 'acquired_at', 'label' => 'Data de aquisição', 'type' => 'date', 'group' => 'Aquisição', 'required' => false],
            ['key' => 'acquisition_location', 'label' => 'Local de aquisição', 'type' => 'text', 'group' => 'Aquisição', 'required' => false],
            ['key' => 'purchase_price', 'label' => 'Valor pago pelo grupo (R$)', 'type' => 'money', 'group' => 'Aquisição', 'required' => false],
            ['key' => 'notes', 'label' => 'Observações', 'type' => 'textarea', 'group' => 'Observações', 'required' => false],
        ]],
    ];

    public const PHYSICAL_FIELDS = ['region_id', 'originality_id', 'overall_condition', 'media_condition', 'box_condition', 'manual_condition', 'inserts_condition', 'has_media', 'has_box', 'has_manual', 'has_inserts', 'has_extras'];

    public const DIGITAL_FIELDS = ['digital_store_id', 'acquisition_type_id', 'digital_service_id', 'digital_ownership_type_id'];

    public const BOX_FIELDS = ['box_is_original', 'box_serial_matches', 'box_condition'];

    public static function definition(string $kind): array
    {
        abort_unless(isset(self::DEFINITIONS[$kind]), 404);

        return self::DEFINITIONS[$kind];
    }

    public static function model(string $kind): Model
    {
        return new (self::definition($kind)['model']);
    }

    public static function owned(string $kind, int $ownerId, int $id): Model
    {
        return self::model($kind)->newQuery()->where('user_id', $ownerId)->findOrFail($id);
    }
}
