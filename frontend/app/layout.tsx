import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ErrorSuppressor from '@/components/ErrorSuppressor';
import ChatBot from '@/components/ChatBot';
import Footer from '@/components/Footer';
import ToastProvider from '@/components/ToastProvider';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  preload: true,
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'ZeilaLink',
  description: 'Empowering talent with jobs, training, and skills',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const theme = stored === 'dark' || stored === 'light' ? stored : prefersDark ? 'dark' : 'light';
                  document.documentElement.setAttribute('data-theme', theme);
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
                
                // Suppress harmless browser extension errors
                window.addEventListener('error', function(e) {
                  if (e.message && (
                    e.message.includes('disconnected port object') ||
                    e.message.includes('Extension context invalidated') ||
                    e.message.includes('chrome-extension://') ||
                    e.message.includes('moz-extension://')
                  )) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                }, true);
                
                // Suppress unhandled promise rejections from extensions
                window.addEventListener('unhandledrejection', function(e) {
                  if (e.reason && (
                    e.reason.message?.includes('disconnected port object') ||
                    e.reason.message?.includes('Extension context invalidated') ||
                    e.reason.message?.includes('chrome-extension://') ||
                    e.reason.message?.includes('moz-extension://')
                  )) {
                    e.preventDefault();
                    return false;
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body className={poppins.className}>
        <ErrorSuppressor />
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
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
