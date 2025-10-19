import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

type PageProps = {
  auth: any;
  site?: {
    contact?: { email?: string | null };
  };
};

export default function TermsOfUse() {
  const page = usePage<PageProps>();
  const auth = (page.props as any).auth;
  const contactEmail = (page.props as any).site?.contact?.email ?? 'contato@exemplo.com';
  const updatedAt = new Date().toLocaleDateString('pt-BR');

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title="Termos de Uso" />
      <Header auth={auth} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Termos de Uso</h1>
        <p className="mt-2 text-sm text-gray-500">Última atualização: {updatedAt}</p>

        <section className="mt-8 space-y-4 text-gray-800">
          <p>
            Ao acessar e utilizar este site, você concorda com os presentes Termos de Uso. Leia-os com atenção
            antes de prosseguir.
          </p>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Uso do serviço</h2>
          <ul className="list-disc pl-6">
            <li>Você concorda em não utilizar o serviço para fins ilícitos ou não autorizados;</li>
            <li>Você é responsável por manter a confidencialidade de suas credenciais;</li>
            <li>Podemos, a nosso critério, modificar ou encerrar funcionalidades a qualquer momento.</li>
          </ul>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Conteúdo e propriedade</h2>
          <p>
            Marcas, logotipos e demais conteúdos exibidos podem estar protegidos por direitos de propriedade
            intelectual. O uso não autorizado é proibido.
          </p>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Limitação de responsabilidade</h2>
          <p>
            O serviço é fornecido “no estado em que se encontra”. Não garantimos disponibilidade ininterrupta ou
            ausência de erros. Em nenhuma hipótese seremos responsáveis por perdas indiretas decorrentes do uso.
          </p>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Alterações dos Termos</h2>
          <p>
            Podemos atualizar estes Termos periodicamente. A versão vigente será sempre publicada nesta página.
          </p>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Contato</h2>
          <p>
            Em caso de dúvidas sobre estes Termos, entre em contato em{' '}
            <a href={`mailto:${contactEmail}`} className="text-gray-900 underline-offset-2 hover:underline">
              {contactEmail}
            </a>.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

