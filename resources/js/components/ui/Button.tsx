import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md';
  block?: boolean;
  pill?: boolean;
};

const base = 'inline-flex items-center justify-center font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition';

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-2',
};

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600',
  secondary: 'bg-gray-900 text-white hover:bg-gray-800 focus-visible:outline-gray-900',
  outline: 'bg-white text-gray-800 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-brand-600',
  ghost: 'bg-transparent text-gray-800 hover:bg-gray-50 focus-visible:outline-brand-600',
};

export default function Button({ variant = 'primary', size = 'md', block, pill, className = '', ...props }: ButtonProps) {
  const rounded = pill ? 'rounded-full' : 'rounded-md';
  const width = block ? 'w-full' : '';
  const cls = [base, sizes[size], variants[variant], rounded, width, className].filter(Boolean).join(' ');
  return <button className={cls} {...props} />;
}

