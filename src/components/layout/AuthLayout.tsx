import type { ReactNode } from 'react';
import { Logo } from '@/components/icons/Logo';
import Link from 'next/link';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/50 p-4">
      <div className="w-full max-w-md space-y-6">
        <Link href="/" className="flex flex-col items-center justify-center text-primary hover:opacity-80 transition-opacity">
            <Logo className="h-16 w-16 mb-2" />
            <h1 className="text-3xl font-bold text-center text-primary">Nutrition Navigator</h1>
        </Link>
        <div className="rounded-lg border bg-card text-card-foreground shadow-xl p-6 sm:p-8">
            <h2 className="text-2xl font-semibold text-center mb-1">{title}</h2>
            {description && <p className="text-muted-foreground text-center mb-6">{description}</p>}
            {children}
        </div>
      </div>
    </div>
  );
}
