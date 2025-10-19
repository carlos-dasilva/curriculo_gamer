import './bootstrap';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('./pages/**/*.tsx', { eager: true });
    // @ts-ignore
    return pages[`./pages/${name}.tsx`];
  },
  setup({ el, App, props }) {
    const root = createRoot(el as HTMLElement);
    root.render(<App {...props} />);
  },
  progress: {
    // Mantém UX fluida no carregamento
    color: '#0ea5e9',
  },
});

