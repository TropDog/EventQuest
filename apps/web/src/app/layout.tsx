import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EventQuest',
  description: 'Kahoot dla wesel, imprez i eventów',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
