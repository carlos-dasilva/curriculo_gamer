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
      <Head title="PolÃ­tica de Privacidade" />
      <Header auth={auth} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">PolÃ­tica de Privacidade</h1>
        {updatedAt && (
          <p className="mt-2 text-sm text-gray-500">Ãšltima atualizaÃ§Ã£o: {updatedAt}</p>
        )}
        {effectiveAt && (
          <p className="mt-1 text-xs text-gray-500">Vigente desde: {effectiveAt}</p>
        )}

        <section className="mt-8 space-y-6 text-gray-800">
          <p>
            Esta PolÃ­tica de Privacidade descreve como coletamos, usamos e protegemos suas informaÃ§Ãµes quando vocÃª utiliza o CurrÃ­culo Gamer.
          </p>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Quais dados coletamos</h2>
          <p>
            Podemos coletar: (a) dados de conta (nome e eâ€‘mail); (b) dados tÃ©cnicos (IP, dispositivo, navegador); e (c) dados de uso (pÃ¡ginas acessadas e interaÃ§Ãµes).
          </p>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Como usamos seus dados</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>AutenticaÃ§Ã£o, seguranÃ§a e prevenÃ§Ã£o a abusos;</li>
            <li>PersonalizaÃ§Ã£o da experiÃªncia e melhorias do serviÃ§o;</li>
            <li>MÃ©tricas, suporte e comunicaÃ§Ãµes relevantes;</li>
            <li>Cumprimento de obrigaÃ§Ãµes legais.</li>
          </ul>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Cookies</h2>
          <p>
            Utilizamos cookies para lembrar preferÃªncias, medir uso e melhorar desempenho. VocÃª pode gerenciÃ¡-los nas configuraÃ§Ãµes do navegador.
          </p>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Compartilhamento</h2>
          <p>
            NÃ£o vendemos seus dados. Compartilhamos apenas com provedores confiÃ¡veis quando necessÃ¡rio para operar o serviÃ§o ou quando exigido por lei.
          </p>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">SeguranÃ§a</h2>
          <p>
            Adotamos medidas tÃ©cnicas e organizacionais para proteÃ§Ã£o de dados, mas nenhum mÃ©todo Ã© 100% infalÃ­vel. Recomendamos boas prÃ¡ticas de seguranÃ§a por parte do usuÃ¡rio.
          </p>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Seus direitos</h2>
          <p>
            VocÃª pode solicitar acesso, correÃ§Ã£o, exclusÃ£o, portabilidade e informaÃ§Ãµes sobre o uso de seus dados. Para exercer seus direitos, entre em contato.
          </p>

          {contactEmail && (
            <>
              <h2 className="mt-6 text-xl font-semibold text-gray-900">Contato</h2>
              <p>
                DÃºvidas? Escreva para <a href={`mailto:${contactEmail}`} className="text-gray-900 underline-offset-2 hover:underline">{contactEmail}</a>.
              </p>
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}


