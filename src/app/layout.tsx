import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quest Study App',
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
        {children}
      </body>
    </html>
  );
}
