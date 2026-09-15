<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // O job de testes PHP não gera os assets usados pelas views, inclusive a página 404.
        $this->withoutVite();
    }
}
