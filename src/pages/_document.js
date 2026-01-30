import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Global Meta Tags */}
        <meta charSet="utf-8" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Global SEO Tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />

        {/* DNS Prefetch for External Services */}
        <link rel="dns-prefetch" href="https://analytics.vercel.com" />
        <link rel="dns-prefetch" href="https://auth.rebabel.org" />
        <link rel="dns-prefetch" href="https://api.supabase.co" />

        {/* Preconnect to critical origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* LLM Access Guide */}
        <link rel="alternate" type="text/plain" href="https://rebabel.org/llms.txt" title="LLM Access Guide" />
        <meta name="llms-txt" content="https://rebabel.org/llms.txt" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
