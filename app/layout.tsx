import type { Metadata, Viewport } from 'next';
import { Archivo, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const display = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-display', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'Udayraj Yadav | Battery Energy Storage Engineer',
  description:
    'Senior Engineer in new product development, testing, validation and commissioning of battery energy storage systems (BESS), ESS and EV packs.',
  openGraph: {
    title: 'Udayraj Yadav | Battery Energy Storage Engineer',
    description: 'From one cell to a 361.72 kWh grid asset: NPD, BMS validation and BESS commissioning.',
    images: ['/udayraj.jpg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#02040a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
