import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#183E32",
};

export const metadata: Metadata = {
  title: "StockPulse",
  description:
    "Real-time Indian stock portfolio tracker, live market quotes, STCG/LTCG tax breakdown, SEBI charge calculator, and secure data sync.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${jakarta.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedUser = localStorage.getItem('stocks_app_user');
                  var userEmail = savedUser ? JSON.parse(savedUser).email : null;
                  var userKey = userEmail ? 'stockpulse-theme-preference_' + userEmail.toLowerCase() : null;
                  var theme = (userKey && localStorage.getItem(userKey)) || localStorage.getItem('stockpulse-theme-preference') || 'light';
                  document.documentElement.setAttribute('data-theme', theme);
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {
                  document.documentElement.setAttribute('data-theme', 'light');
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-[var(--app-bg)] text-[var(--text-primary)] transition-colors duration-200">
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
