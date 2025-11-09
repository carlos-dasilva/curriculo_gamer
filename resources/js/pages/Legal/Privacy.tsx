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

export default function PrivacyPolicy() {
  const page = usePage<PageProps>();
  const auth = (page.props as any).auth;
  const contactEmail = (page.props as any).site?.contact?.email as string | undefined;
  const updatedAtRaw = (page.props as any).updatedAt as string | undefined;
  const effectiveAtRaw = (page.props as any).effectiveAt as string | undefined;
  const updatedAt = updatedAtRaw ? new Date(updatedAtRaw).toLocaleDateString('pt-BR') : undefined;
  const effectiveAt = effectiveAtRaw ? new Date(effectiveAtRaw).toLocaleDateString('pt-BR') : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title="Política de Privacidade">
        <meta name="description" content="Política de Privacidade: saiba como coletamos, usamos e protegemos seus dados no Currículo Gamer." />
      </Head>
      <Header auth={auth} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Política de Privacidade</h1>
        {updatedAt && (
          <p className="mt-2 text-sm text-gray-500">Última atualização: {updatedAt}</p>
        )}
        {effectiveAt && (
          <p className="mt-1 text-xs text-gray-500">Vigente desde: {effectiveAt}</p>
        )}

        <section className="mt-8 space-y-6 text-gray-800">
          <p>
            Esta Política de Privacidade descreve como coletamos, usamos e protegemos suas informações quando você utiliza o Currículo Gamer.
          </p>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Quais dados coletamos</h2>
          <p>
            Podemos coletar: (a) dados de conta (nome e e-mail); (b) dados técnicos (IP, dispositivo, navegador); e (c) dados de uso (páginas acessadas e interações).
          </p>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Como usamos seus dados</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Autenticação, segurança e prevenção a abusos;</li>
            <li>Personalização da experiência e melhorias do serviço;</li>
            <li>Métricas, suporte e comunicações relevantes;</li>
            <li>Cumprimento de obrigações legais.</li>
          </ul>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Cookies</h2>
          <p>
            Utilizamos cookies para lembrar preferências, medir uso e melhorar desempenho. Você pode gerenciá-los nas configurações do navegador.
          </p>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Compartilhamento</h2>
          <p>
            Não vendemos seus dados. Compartilhamos apenas com provedores confiáveis quando necessário para operar o serviço ou quando exigido por lei.
          </p>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Segurança</h2>
          <p>
            Adotamos medidas técnicas e organizacionais para proteção de dados, mas nenhum método é 100% infalível. Recomendamos boas práticas de segurança por parte do usuário.
          </p>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Seus direitos</h2>
          <p>
            Você pode solicitar acesso, correção, exclusão, portabilidade e informações sobre o uso de seus dados. Para exercer seus direitos, entre em contato.
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

