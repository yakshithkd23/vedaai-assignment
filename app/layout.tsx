import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VedaAI — Assessment Extraction & Answer Mapping',
  description:
    'Upload a question paper and a handwritten answer sheet to automatically extract, map, highlight, and grade student answers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
