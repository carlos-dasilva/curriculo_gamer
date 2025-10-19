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

export default function PrivacyPolicy() {
  const page = usePage<PageProps>();
  const auth = (page.props as any).auth;
  const contactEmail = (page.props as any).site?.contact?.email ?? 'contato@exemplo.com';
  const updatedAt = new Date().toLocaleDateString('pt-BR');

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title="Política de Privacidade" />
      <Header auth={auth} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-gray-500">Última atualização: {updatedAt}</p>

        <section className="mt-8 space-y-4 text-gray-800">
          <p>
            Esta Política de Privacidade descreve como coletamos, usamos e protegemos suas informações quando
            você utiliza nosso site e serviços.
          </p>
          <h2 className="mt-6 text-xl font-semibold text-gray-900">Informações que coletamos</h2>
          <p>
            Podemos coletar informações fornecidas por você (como nome e e-mail), dados técnicos (endereço IP,
            tipo de dispositivo e navegador) e informações de uso (páginas visitadas e interações realizadas).
          </p>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Como utilizamos suas informações</h2>
          <ul className="list-disc pl-6">
            <li>Fornecer, manter e melhorar nossos serviços;</li>
            <li>Personalizar a experiência de uso;</li>
            <li>Comunicar atualizações, alertas ou novidades relevantes;</li>
            <li>Cumprir obrigações legais e garantir segurança.</li>
          </ul>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Cookies e tecnologias similares</h2>
          <p>
            Utilizamos cookies para melhorar desempenho, analisar tráfego e lembrar preferências. Você pode
            gerenciar cookies nas configurações do seu navegador.
          </p>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Compartilhamento de dados</h2>
          <p>
            Não vendemos suas informações. Podemos compartilhá-las com provedores de serviço confiáveis, somente
            quando necessário para operação do sistema ou exigido por lei.
          </p>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Segurança</h2>
          <p>
            Adotamos medidas técnicas e organizacionais para proteger seus dados. Ainda assim, nenhum método é
            100% seguro e recomendamos boas práticas de segurança por parte do usuário.
          </p>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Seus direitos</h2>
          <p>
            Você pode solicitar acesso, atualização ou exclusão de seus dados conforme aplicável. Entre em
            contato para exercer seus direitos.
          </p>

          <h2 className="mt-6 text-xl font-semibold text-gray-900">Contato</h2>
          <p>
            Em caso de dúvidas sobre esta Política, entre em contato em{' '}
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

