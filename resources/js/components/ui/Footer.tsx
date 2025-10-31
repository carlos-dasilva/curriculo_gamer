import React from 'react';
import { usePage } from '@inertiajs/react';
import strings from '@/i18n/pt-BR/home.json';

export default function Footer() {
  const page = usePage();
  const site = (page.props as any).site as {
    contact?: { email?: string | null; telefone?: string | null; endereco?: string | null };
    socials?: { github?: string | null; linkedin?: string | null; instagram?: string | null; facebook?: string | null; x?: string | null; youtube?: string | null; whatsapp?: string | null; discord?: string | null };
  } | undefined;


  // Logo no rodapé (2x o tamanho do topo => h-16 no header, aqui h-32)
  const [logoFallback, setLogoFallback] = React.useState<string | null>(null);
  const handleLogoError = () => {
    const svg = encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='128' viewBox='0 0 256 128'>
         <rect width='256' height='128' rx='12' fill='#111827'/>
         <text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' fill='#F9FAFB' font-family='Arial, sans-serif' font-size='28'>LOGO</text>
       </svg>`
    );
    setLogoFallback(`data:image/svg+xml;charset=UTF-8,${svg}`);
  };

  const socials: { name: string; href: string; Icon: (p: { className?: string }) => JSX.Element }[] = [];
  if (site?.socials?.github) socials.push({ name: 'GitHub', href: site.socials.github, Icon: GitHubIcon });
  if (site?.socials?.linkedin) socials.push({ name: 'LinkedIn', href: site.socials.linkedin, Icon: LinkedInIcon });
  if (site?.socials?.instagram) socials.push({ name: 'Instagram', href: site.socials.instagram, Icon: InstagramIcon });
  if (site?.socials?.facebook) socials.push({ name: 'Facebook', href: site.socials.facebook, Icon: FacebookIcon });
  if (site?.socials?.x) socials.push({ name: 'X (Twitter)', href: site.socials.x, Icon: XIcon });
  if (site?.socials?.youtube) socials.push({ name: 'YouTube', href: site.socials.youtube, Icon: YouTubeIcon });
  if (site?.socials?.whatsapp) {
    const raw = site.socials.whatsapp;
    const href = raw?.startsWith('http') ? raw : `https://wa.me/${(raw || '').replace(/\D/g,'')}`;
    socials.push({ name: 'WhatsApp', href, Icon: WhatsAppIcon });
  }
  if (site?.socials?.discord) {
    socials.push({ name: 'Discord', href: site.socials.discord, Icon: DiscordIcon });
  }
  const hasSocials = socials.length > 0;

  return (
    <footer className="border-t border-gray-200 bg-white" aria-label="Rodapé">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-1 gap-8 sm:grid-cols-2 ${hasSocials ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
          {/* Coluna da marca (à esquerda dos itens) */}
          <div className="flex items-center justify-center sm:justify-start">
            {logoFallback ? (
              <img
                src={logoFallback}
                alt="Logo"
                className="h-32 w-auto"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                width={128}
                height={128}
              />
            ) : (
              <img
                src="/img/logo.png"
                alt="Logo"
                className="h-32 w-auto"
                onError={handleLogoError}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                width={128}
                height={128}
              />
            )}
          </div>
          <div className="flex items-center justify-center sm:justify-start">
            <img
              src="/img/nome.png"
              alt="Currículo Gamer"
              className="h-16 md:h-20 w-auto"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              width={256}
              height={64}
              /* TODO: Ajustar width/height para dimensões reais do arquivo */
            />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-sm font-semibold text-gray-900">{strings.footer.sobreTitulo}</h2>
            <p className="mt-3 text-sm text-gray-600">{strings.footer.sobreTexto}</p>
          </div>
          <div className="hidden text-center sm:text-left">
            <h2 className="text-sm font-semibold text-gray-900">{strings.footer.contatoTitulo}</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              {site?.contact?.email && (
                <li>
                  <span className="font-medium">{strings.footer.email}:</span>{' '}
                  <a href={`mailto:${site.contact.email}`} className="text-gray-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:rounded-sm">
                    {site.contact.email}
                  </a>
                </li>
              )}
              {site?.contact?.telefone && (
                <li>
                  <span className="font-medium">{strings.footer.telefone}:</span>{' '}
                  <a href={`tel:${site.contact.telefone}`} className="text-gray-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:rounded-sm">
                    {site.contact.telefone}
                  </a>
                </li>
              )}
              {site?.contact?.endereco && (
                <li>
                  <span className="font-medium">{strings.footer.endereco}:</span>{' '}
                  <span className="text-gray-700">{site.contact.endereco}</span>
                </li>
              )}
            </ul>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-sm font-semibold text-gray-900">{strings.footer.linksTitulo}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a href="/politica-privacidade" className="text-gray-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:rounded-sm">
                  {strings.footer.politicaPrivacidade}
                </a>
              </li>
              <li>
                <a href="/termos-uso" className="text-gray-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:rounded-sm">
                  {strings.footer.termosUso}
                </a>
              </li>
            </ul>
          </div>
          <div className={`${hasSocials ? '' : 'hidden'} text-center sm:text-left`}>
            <h2 className="text-sm font-semibold text-gray-900">{strings.footer.sigaNos}</h2>
            {hasSocials && (
              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3" aria-label={strings.footer.redesSociais}>
                {socials.map(({ name, href, Icon }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    className="inline-flex items-center justify-center rounded-md border border-gray-200 p-2 text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-gray-600 sm:px-6 lg:px-8">
          {strings.footer.direitos}
        </div>
      </div>
    </footer>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.35-1.76-1.35-1.76-1.1-.75.08-.74.08-.74 1.22.09 1.87 1.25 1.87 1.25 1.08 1.85 2.83 1.32 3.52 1.01.11-.79.42-1.32.76-1.63-2.67-.3-5.48-1.34-5.48-5.95 0-1.32.47-2.4 1.24-3.24-.12-.3-.54-1.51.12-3.14 0 0 1.01-.32 3.3 1.24a11.5 11.5 0 0 1 6 0c2.29-1.56 3.3-1.24 3.3-1.24.66 1.63.24 2.84.12 3.14.77.84 1.24 1.92 1.24 3.24 0 4.62-2.81 5.65-5.49 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .5z"/>
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V23h-4V8.5zm7 0h3.8v2h.05c.53-1 1.84-2.05 3.8-2.05 4.07 0 4.82 2.68 4.82 6.17V23h-4v-6.5c0-1.55-.03-3.54-2.16-3.54-2.16 0-2.49 1.68-2.49 3.42V23h-4V8.5z"/>
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.2 2.4.4.6.2 1 .5 1.5 1s.8.9 1 1.5c.2.5.3 1.2.4 2.4.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.9-.4 2.4-.2.6-.5 1-1 1.5s-.9.8-1.5 1c-.5.2-1.2.3-2.4.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.2-2.4-.4-.6-.2-1-.5-1.5-1s-.8-.9-1-1.5c-.2-.5-.3-1.2-.4-2.4C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.9.4-2.4.2-.6.5-1 1-1.5s.9-.8 1.5-1c.5-.2 1.2-.3 2.4-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.8.1-1 .1-1.6.2-1.9.3-.5.2-.8.4-1.1.7-.3.3-.5.6-.7 1.1-.1.3-.2.9-.3 1.9-.1 1.3-.1 1.7-.1 4.8s0 3.5.1 4.8c.1 1 .2 1.6.3 1.9.2.5.4.8.7 1.1.3.3.6.5 1.1.7.3.1.9.2 1.9.3 1.3.1 1.7.1 4.8.1s3.5 0 4.8-.1c1-.1 1.6-.2 1.9-.3.5-.2.8-.4 1.1-.7.3-.3.5-.6.7-1.1.1-.3.2-.9.3-1.9.1-1.3.1-1.7.1-4.8s0-3.5-.1-4.8c-.1-1-.2-1.6-.3-1.9-.2-.5-.4-.8-.7-1.1-.3-.3-.6-.5-1.1-.7-.3-.1-.9-.2-1.9-.3-1.3-.1-1.7-.1-4.8-.1zm0 3.2a5.8 5.8 0 1 1 0 11.6 5.8 5.8 0 0 1 0-11.6zm0 1.8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5.9-2.5a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6z"/>
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.7-3.9 1.1 0 2.3.2 2.3.2v2.6h-1.3c-1.3 0-1.7.8-1.7 1.6V12h2.9l-.5 2.9h-2.4v7A10 10 0 0 0 22 12z"/>
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.9 2H22l-7.1 8.1L23 22h-6.8l-5.3-6.9L4.6 22H2l7.6-8.7L1.5 2h6.9l4.8 6.3L18.9 2zm-1.2 18h1.9L8.4 4H6.4l11.3 16z"/>
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.5 6.2s-.2-1.6-.8-2.3c-.8-.8-1.7-.8-2.1-.8C17.5 3 12 3 12 3h0s-5.5 0-8.6.1c-.4 0-1.3 0-2.1.8-.6.7-.8 2.3-.8 2.3S0 8.2 0 10.3v1.9c0 2.1.2 4.1.2 4.1s.2 1.6.8 2.3c.8.8 1.9.8 2.3.8 1.7.1 7.2.1 7.2.1s5.5 0 8.6-.1c.4 0 1.3 0 2.1-.8.6-.7.8-2.3.8-2.3s.2-2 .2-4.1v-1.9c0-2.1-.2-4.1-.2-4.1zM9.6 13.8V7.8l6.4 3-6.4 3z"/>
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M.057 24l1.687-6.163A11.867 11.867 0 0 1 0 11.985C0 5.367 5.373 0 11.99 0 18.606 0 24 5.367 24 11.985 24 18.6 18.606 24 11.99 24a11.9 11.9 0 0 1-6.077-1.652L.057 24zm6.597-3.807c1.734 1.043 3.276 1.674 5.392 1.674 5.448 0 9.89-4.434 9.89-9.882 0-5.448-4.442-9.89-9.89-9.89-5.45 0-9.882 4.442-9.882 9.89 0 2.225.73 3.794 1.957 5.392l-.957 3.48 3.49-.664zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.03-.967-.272-.1-.47-.149-.669.149-.198.297-.767.967-.94 1.164-.174.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.174-.297-.019-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.496.099-.198.05-.372-.025-.521-.074-.149-.669-1.611-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 245 240" fill="currentColor" aria-hidden="true">
      <path d="M104.4 104.9c-5.7 0-10.2 5-10.2 11.1 0 6.1 4.6 11.1 10.2 11.1 5.7 0 10.3-5 10.2-11.1.1-6.1-4.5-11.1-10.2-11.1zm36.2 0c-5.7 0-10.2 5-10.2 11.1 0 6.1 4.6 11.1 10.2 11.1 5.7 0 10.3-5 10.2-11.1.1-6.1-4.5-11.1-10.2-11.1z"/>
      <path d="M189.5 20h-134C36 20 20 36 20 56.5v127C20 204 36 220 55.5 220h114.7l-5.4-18.8 13 12.1 12.3 11.4 21.9 20V56.5C212 36 196 20 189.5 20zm-31 131s-2.9-3.5-5.3-6.6c10.5-3 14.5-9.6 14.5-9.6-3.3 2.2-6.4 3.8-9.2 4.9-4 1.7-7.9 2.8-11.7 3.5-7.8 1.5-15 1.1-21.2-.1-4.7-.9-8.8-2.1-12.2-3.5-1.9-.7-4-1.6-6.1-2.8-.3-.2-.6-.3-.9-.5-.2-.1-.3-.2-.5-.3-.2-.1-.3-.2-.4-.3-1.8-1-2.8-1.7-2.8-1.7s3.8 6.4 13.8 9.5c-2.4 3.1-5.4 6.7-5.4 6.7-17.8-.6-24.5-12.2-24.5-12.2 0-25.8 11.5-46.7 11.5-46.7 11.5-8.6 22.3-8.4 22.3-8.4l.8 1c-14.3 4.1-20.9 10.4-20.9 10.4s1.7-.9 4.6-2.1c8.3-3.7 14.9-4.7 17.6-5 4.6-.9 9.8-1.1 15.2-1 7.4.1 13.7.9 19.2 2.1 4.7 1.1 9.7 2.7 14.8 5.1 0 0-6.3-6-19.9-10.2l1.2-1.4s10.8-.2 22.3 8.4c0 0 11.5 20.9 11.5 46.7 0 0-6.8 11.6-24.6 12.2z"/>
    </svg>
  );
}
