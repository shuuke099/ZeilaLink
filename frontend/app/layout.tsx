import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ErrorSuppressor from '@/components/ErrorSuppressor';
import ChatBot from '@/components/ChatBot';
import Footer from '@/components/Footer';
import ToastProvider from '@/components/ToastProvider';
import type { Language } from '@/lib/translations';

export const metadata: Metadata = {
  title: 'ZeilaLink',
  description: 'Empowering talent with jobs, training, and skills',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  other: {
    google: 'notranslate',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const savedLanguage = cookies().get('language')?.value;
  const initialLanguage: Language = savedLanguage === 'so' ? 'so' : 'en';
  const nonce = headers().get('x-nonce') || undefined;

  return (
    <html lang={initialLanguage} translate="no" suppressHydrationWarning>
      <body>
        <script
          id="theme-init"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var theme = stored === 'dark' || stored === 'light' ? stored : prefersDark ? 'dark' : 'light';
                  var root = document.documentElement;
                  root.setAttribute('data-theme', theme);
                  root.classList.toggle('dark', theme === 'dark');
                } catch (e) {}
              })();
            `,
          }}
        />
        <ErrorSuppressor />
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider initialLanguage={initialLanguage}>
              <div className="flex flex-col min-h-screen">
                <main className="flex-grow">
                  {children}
                </main>
                <Footer />
                <ChatBot />
                <ToastProvider />
              </div>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
