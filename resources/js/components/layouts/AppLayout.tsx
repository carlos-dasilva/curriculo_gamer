import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

type Props = {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
  children: React.ReactNode;
};

export default function AppLayout({ title, description, canonical, ogImage, noIndex, children }: Props) {
  const page = usePage();
  const auth = (page.props as any)?.auth;
  const siteUrl = 'https://curriculogamer.com.br';
  const url =
    canonical || (typeof window !== 'undefined' ? window.location.href : `${siteUrl}/`);
  const finalTitle = title || 'Currículo Gamer';
  const finalDesc = description || 'Organize e compartilhe seu Currículo Gamer: jogos jogados, finalizados, metas e plataformas.';
  const finalImage = ogImage || '/img/logo.png';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Head title={finalTitle}>
        <meta name="description" content={finalDesc} />
        {noIndex ? <meta name="robots" content="noindex,nofollow" /> : null}
        {/* Canonical + hreflang */}
        <link rel="canonical" href={url} />
        <link rel="alternate" hrefLang="pt-BR" href={url} />
        {/* Open Graph */}
        <meta property="og:title" content={finalTitle} />
        <meta property="og:description" content={finalDesc} />
        <meta property="og:url" content={url} />
        <meta property="og:site_name" content="Currículo Gamer" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={finalImage} />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={finalTitle} />
        <meta name="twitter:description" content={finalDesc} />
        <meta name="twitter:image" content={finalImage} />
        {/* JSON-LD Organization + WebSite */}
        <script type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'Currículo Gamer',
                url: siteUrl,
                logo: `${siteUrl}/img/logo.png`,
                sameAs: [
                  // adicione suas redes sociais aqui
                ],
              },
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'Currículo Gamer',
                url: siteUrl,
                potentialAction: {
                  '@type': 'SearchAction',
                  target: `${siteUrl}/?q={search_term_string}`,
                  'query-input': 'required name=search_term_string',
                },
              },
            ]),
          }}
        />
      </Head>
      <Header auth={auth} />
      <main role="main">{children}</main>
      <Footer />
    </div>
  );
}
