import React from 'react';
import { Head } from '@inertiajs/react';
import Header from '@/components/ui/Header';
import Hero from '@/components/ui/Hero';
import CardsGrid, { type Site } from '@/components/ui/CardsGrid';
import Footer from '@/components/ui/Footer';

type AuthInfo = {
  isAuthenticated: boolean;
  user?: { name: string; email: string } | null;
  loginUrl?: string;
  logoutUrl?: string;
  abilities?: { manageUsers?: boolean };
};

type Props = {
  sites: Site[];
  auth: AuthInfo;
  flash?: { success?: string; error?: string };
};

export default function HomeIndex({ sites, auth, flash }: Props) {
  const handleCta = () => {
    const el = document.getElementById('sites');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title="Início" />
      <Header auth={auth} />
      <main>
        {flash?.error && (
          <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
              {flash.error}
            </div>
          </div>
        )}
        <Hero onCtaClick={handleCta} />
        <CardsGrid sites={sites} />
      </main>
      <Footer />
    </div>
  );
}
