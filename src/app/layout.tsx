import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quest Study Dashboard',
  description: 'Gamified studying and productivity platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <main className="app-container">
          <header className="app-header">
            <h1>Quest Study ⚔️</h1>
            <p>당신의 학구열을 진화시키세요</p>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
