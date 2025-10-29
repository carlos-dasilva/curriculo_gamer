<?php

return [
    'privacy' => [
        // Datas no formato ISO (YYYY-MM-DD). Mantenha aqui a data real da última alteração.
        'updated_at' => env('LEGAL_PRIVACY_UPDATED_AT', '2025-10-01'),
        // Opcional: data de vigência, se diferente da data de atualização
        'effective_at' => env('LEGAL_PRIVACY_EFFECTIVE_AT', null),
    ],
    'terms' => [
        'updated_at' => env('LEGAL_TERMS_UPDATED_AT', '2025-10-01'),
        'effective_at' => env('LEGAL_TERMS_EFFECTIVE_AT', null),
    ],
];

