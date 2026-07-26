import Script from "next/script";

interface GoogleAnalyticsProps {
  measurementId?: string;
  nonce?: string;
}

export default function GoogleAnalytics({
  measurementId,
  nonce,
}: GoogleAnalyticsProps) {
  if (!measurementId || !/^G-[A-Z0-9]+$/i.test(measurementId)) {
    return null;
  }

  return (
    <>
      <Script
        id="zeilalink-google-analytics-library"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
        strategy="afterInteractive"
        nonce={nonce}
      />
      <Script
        id="zeilalink-google-analytics-config"
        strategy="afterInteractive"
        nonce={nonce}
      >
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}
