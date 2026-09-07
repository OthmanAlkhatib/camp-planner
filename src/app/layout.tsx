import type { Metadata } from 'next';
import '@fontsource-variable/cairo';
import './globals.css';

export const metadata: Metadata = {
  title: 'مخطط المخيم | من الفكرة إلى التقييم',
  description: 'أداة عربية بسيطة لتخطيط المخيم ومتابعة تنفيذه وتقييم نتائجه.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
