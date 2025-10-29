import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

type PageProps = {
  auth: any;
  site?: {
    contact?: { email?: string | null };
  };
  updatedAt?: string | null;
  effectiveAt?: string | null;
};

export default function TermsOfUse() {
  const page = usePage<PageProps>();
  const auth = (page.props as any).auth;
  const contactEmail = (page.props as any).site?.contact?.email as string | undefined;
  const updatedAtRaw = (page.props as any).updatedAt as string | undefined;
  const effectiveAtRaw = (page.props as any).effectiveAt as string | undefined;
  const updatedAt = updatedAtRaw ? new Date(updatedAtRaw).toLocaleDateString('pt-BR') : undefined;
  const effectiveAt = effectiveAtRaw ? new Date(effectiveAtRaw).toLocaleDateString('pt-BR') : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title="Termos de Uso" />
      <Header auth={auth} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Termos de Uso</h1>
        {updatedAt && (
          <p className="mt-2 text-sm text-gray-500">Última atualização: {updatedAt}</p>
        )}
        {effectiveAt && (
          <p className="mt-1 text-xs text-gray-500">Vigente desde: {effectiveAt}</p>
        )}

        <section className="mt-8 space-y-6 text-gray-800">
          <p>
            Ao acessar e utilizar o Currículo Gamer, você concorda com estes Termos. Leia-os com atenção.
          </p>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Uso do serviço</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Não utilize o serviço para fins ilícitos ou não autorizados;</li>
            <li>Você é responsável por manter a confidencialidade de suas credenciais;</li>
            <li>Podemos, a nosso critério, modificar ou encerrar funcionalidades a qualquer momento.</li>
          </ul>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Conteúdo e propriedade</h2>
          <p>
            Marcas, logotipos e interfaces podem estar protegidos por direitos de propriedade intelectual. O uso não autorizado é proibido.
          </p>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Limitação de responsabilidade</h2>
          <p>
            O serviço é fornecido “no estado em que se encontra”. Não garantimos disponibilidade ininterrupta ou ausência de erros. Em nenhuma hipótese seremos responsáveis por danos indiretos decorrentes do uso.
          </p>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Alterações destes Termos</h2>
          <p>
            Estes Termos podem ser atualizados periodicamente. A versão vigente e a data de atualização são exibidas nesta página.
          </p>

          {contactEmail && (
            <>
              <h2 className="mt-6 text-xl font-semibold text-gray-900">Contato</h2>
              <p>
                Dúvidas? Escreva para <a href={`mailto:${contactEmail}`} className="text-gray-900 underline-offset-2 hover:underline">{contactEmail}</a>.
              </p>
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
