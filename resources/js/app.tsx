import './bootstrap';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import type { ComponentType } from 'react';

const appName = 'Curr\u00EDculo Gamer';

createInertiaApp({
  resolve: async (name) => {
    const pages = import.meta.glob<{ default: ComponentType }>([
      './pages/**/*.tsx',
      '!./pages/Collection/**/*.tsx',
      '!./pages/Admin/Collection/**/*.tsx',
    ], { eager: true });
    const collectionPages = import.meta.glob<{ default: ComponentType }>([
      './pages/Collection/**/*.tsx',
      './pages/Admin/Collection/**/*.tsx',
    ]);
    const path = `./pages/${name}.tsx`;
    return collectionPages[path] ? await collectionPages[path]() : pages[path];
  },
  title: (title) => (title ? `${title} | ${appName}` : appName),
  setup({ el, App, props }) {
    const root = createRoot(el as HTMLElement);
    root.render(<App {...props} />);
  },
  progress: {
    // Mantém UX fluida no carregamento
    color: '#0ea5e9',
  },
});
