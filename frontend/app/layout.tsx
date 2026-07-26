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
import GoogleAnalytics from '@/components/GoogleAnalytics';
import {
  absoluteUrl,
  BING_SITE_VERIFICATION,
  canonicalUrl,
  createPageMetadata,
  GOOGLE_ANALYTICS_ID,
  GOOGLE_SITE_VERIFICATION,
  ORGANIZATION_ID,
  SITE_CONTACT_EMAIL,
  SITE_CONTACT_PHONE,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_LANGUAGES,
  SITE_NAME,
  SITE_ORIGIN,
  SITE_TITLE,
  SITE_URL,
  WEBSITE_ID,
} from '@/lib/seo';

export function generateMetadata(): Metadata {
  const pathname = headers().get('x-canonical-path') || '/';
  const canonical = canonicalUrl(pathname);
  const pageMetadata = createPageMetadata({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    path: pathname,
  });

  return {
    metadataBase: SITE_URL,
    ...pageMetadata,
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: SITE_ORIGIN }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    generator: 'Next.js',
    category: 'jobs, training, professional services, and business directory',
    referrer: 'strict-origin-when-cross-origin',
    keywords: SITE_KEYWORDS,
    manifest: '/manifest.webmanifest',
    alternates: {
      canonical,
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    appleWebApp: {
      capable: true,
      title: SITE_NAME,
      statusBarStyle: 'default',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: GOOGLE_SITE_VERIFICATION
      ? { google: GOOGLE_SITE_VERIFICATION }
      : undefined,
    other: {
      'content-language': 'en, so',
      ...(BING_SITE_VERIFICATION
        ? { 'msvalidate.01': BING_SITE_VERIFICATION }
        : {}),
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const savedLanguage = cookies().get('language')?.value;
  const initialLanguage: Language = savedLanguage === 'so' ? 'so' : 'en';
  const nonce = headers().get('x-nonce') || undefined;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORGANIZATION_ID,
        name: SITE_NAME,
        url: absoluteUrl('/'),
        logo: {
          '@type': 'ImageObject',
          url: absoluteUrl('/icon-512.png'),
          width: 512,
          height: 512,
        },
        description: SITE_DESCRIPTION,
        email: SITE_CONTACT_EMAIL,
        telephone: SITE_CONTACT_PHONE,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          email: SITE_CONTACT_EMAIL,
          telephone: SITE_CONTACT_PHONE,
          availableLanguage: ['English', 'Somali'],
        },
        knowsLanguage: SITE_LANGUAGES,
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: absoluteUrl('/'),
        name: SITE_NAME,
        alternateName: 'ZeilaLink Platform',
        description: SITE_DESCRIPTION,
        inLanguage: SITE_LANGUAGES,
        publisher: {
          '@id': ORGANIZATION_ID,
        },
      },
    ],
  };

  return (
    <html lang={initialLanguage} suppressHydrationWarning>
      <body>
        <script
          id="zeilalink-website-structured-data"
          nonce={nonce}
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
          }}
        />
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
        <GoogleAnalytics measurementId={GOOGLE_ANALYTICS_ID} nonce={nonce} />
      </body>
    </html>
  );
}
