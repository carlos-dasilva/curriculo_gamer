import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

type Props = {
  title?: string;
  description?: string;
  children: React.ReactNode;
};

export default function AppLayout({ title, description, children }: Props) {
  const page = usePage();
  const auth = (page.props as any)?.auth;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Head title={title ?? ''}>
        {description ? <meta name="description" content={description} /> : null}
      </Head>
      <Header auth={auth} />
      <main role="main">{children}</main>
      <Footer />
    </div>
  );
}

