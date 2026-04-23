// src/pages/blog/BlogLayout.tsx
import type { ReactNode } from 'react';
import Header from '../landing/Header';
import Footer from '../landing/Footer';

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
