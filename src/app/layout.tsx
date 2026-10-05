import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Stock Investment Return Calculator — DCA, Dividends & Risk',
  description:
    'Free stock investment return calculator: simulate monthly investing with dividends, fees, taxes and inflation, see Monte Carlo risk ranges, calculate trade returns, average cost and goal-based contributions.',
  keywords: [
    'stock return calculator',
    'investment calculator',
    'dividend reinvestment calculator',
    'DCA calculator',
    'average cost calculator',
    '주식 수익률 계산기',
    '물타기 계산기',
    '적립식 투자 계산기',
  ],
  openGraph: {
    title: 'Stock Investment Return Calculator',
    description: 'Simulate monthly investing, dividends, fees, taxes and market risk.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f6f3' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0d0d' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
