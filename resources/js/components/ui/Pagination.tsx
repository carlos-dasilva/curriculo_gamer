import React from 'react';
import { Link } from '@inertiajs/react';

type PaginationLink = { url: string | null; label: string; active: boolean };

type Props = {
  links: PaginationLink[];
  className?: string;
  maxNumbers?: number; // quantity of numeric pages rendered (approx)
};

function normalizeLabel(label: string): string {
  return label.replace('&laquo;', '<').replace('&raquo;', '>').replace('&hellip;', '…');
}

export default function Pagination({ links, className = 'mt-8 flex justify-center', maxNumbers = 5 }: Props) {
  if (!Array.isArray(links) || links.length === 0) return null;

  const normalized = links.map((l) => ({ ...l, label: normalizeLabel(l.label) }));
  const prev = normalized[0];
  const next = normalized[normalized.length - 1];
  const pageLinks = normalized.slice(1, normalized.length - 1);

  // Collect numeric pages and current page
  const numeric = pageLinks.filter((l) => /^\d+$/.test(l.label));
  if (numeric.length === 0) {
    // Fallback: render as-is
    return (
      <nav className={className} aria-label="Paginação">
        <ul className="inline-flex items-center gap-1">
          {normalized.map((l, idx) => {
            const isPrev = idx === 0;
            const isNext = idx === normalized.length - 1;
            const common = 'min-w-9 select-none rounded-md px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900';
            if (!l.url) {
              return (
                <li key={idx}>
                  <span className={`${common} cursor-not-allowed bg-gray-100 text-gray-400`} aria-hidden={isPrev || isNext} aria-label={isPrev ? 'Anterior' : isNext ? 'Próxima' : undefined}>
                    {l.label}
                  </span>
                </li>
              );
            }
            return (
              <li key={idx}>
                <Link
                  href={l.url}
                  className={`${common} ${l.active ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50'}`}
                  aria-label={isPrev ? 'Anterior' : isNext ? 'Próxima' : undefined}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  const current = Number(numeric.find((l) => l.active)?.label || '1');
  const last = Math.max(...numeric.map((l) => Number(l.label)));
  const first = 1;

  // Determine which numeric pages to show
  const siblingCount = Math.max(1, Math.floor((maxNumbers - 1) / 2));
  const pagesToShow = new Set<number>();
  pagesToShow.add(first);
  pagesToShow.add(last);
  pagesToShow.add(current);
  for (let i = 1; i <= siblingCount; i++) {
    if (current - i > first) pagesToShow.add(current - i);
    if (current + i < last) pagesToShow.add(current + i);
  }

  const sortedPages = Array.from(pagesToShow).sort((a, b) => a - b);

  const pageUrl = (n: number) => pageLinks.find((l) => l.label === String(n))?.url || null;

  const items: Array<{ key: string; type: 'prev' | 'next' | 'page' | 'ellipsis'; label?: string; url?: string | null; active?: boolean }>
    = [];

  // Prev
  items.push({ key: 'prev', type: 'prev', label: '<', url: prev?.url || null, active: false });

  // Pages with ellipsis
  let lastAdded = 0;
  sortedPages.forEach((p) => {
    if (lastAdded && p - lastAdded > 1) {
      items.push({ key: `e-${lastAdded}-${p}`, type: 'ellipsis' });
    }
    items.push({ key: `p-${p}`, type: 'page', label: String(p), url: pageUrl(p), active: p === current });
    lastAdded = p;
  });

  // Next
  items.push({ key: 'next', type: 'next', label: '>', url: next?.url || null, active: false });

  const common = 'min-w-9 select-none rounded-md px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900';

  return (
    <nav className={className} aria-label="Paginação">
      <ul className="inline-flex items-center gap-1">
        {items.map((it) => {
          if (it.type === 'ellipsis') {
            return (
              <li key={it.key}>
                <span className={`${common} cursor-default bg-white text-gray-500 ring-1 ring-inset ring-gray-200`} aria-hidden>
                  …
                </span>
              </li>
            );
          }
          if (!it.url) {
            return (
              <li key={it.key}>
                <span className={`${common} cursor-not-allowed bg-gray-100 text-gray-400`} aria-hidden={it.type === 'prev' || it.type === 'next'} aria-label={it.type === 'prev' ? 'Anterior' : it.type === 'next' ? 'Próxima' : undefined}>
                  {it.label}
                </span>
              </li>
            );
          }
          return (
            <li key={it.key}>
              <Link
                href={it.url}
                className={`${common} ${it.active ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50'}`}
                aria-current={it.active ? 'page' : undefined}
                aria-label={it.type === 'prev' ? 'Anterior' : it.type === 'next' ? 'Próxima' : undefined}
              >
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
