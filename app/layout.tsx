import './globals.css';
import Link from 'next/link';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
            <Link href="/" style={{ textDecoration: 'none' }}><h1 style={{ margin: 0 }}>Atlas</h1></Link>
            <nav style={{ display: 'flex', gap: '1rem' }}>
              <Link href="/about">About</Link>
              <Link href="/credits">Credits</Link>
            </nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
