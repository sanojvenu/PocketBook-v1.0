import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppLayout from "../components/layout/AppLayout";
import { AuthContextProvider } from "@/context/AuthContext";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { Toaster } from "sonner";
import AppInitializer from "@/components/AppInitializer";
import NotificationListener from "@/components/NotificationListener";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://YOUR_PROJECT_ID.web.app'),
  title: {
    default: "PocketBook: Smart AI Personal Finance Tracker",
    template: "%s | PocketBook"
  },
  description: "100% Free, No Ads. Maximum Privacy. PocketBook is India's simple digital cashbook to track income, expenses & reminders. Start saving today.",
  manifest: "/manifest.json",
  icons: {
    icon: '/favicon.png',
    apple: '/icons/icon-192x192.png', // Assuming these exist from PWA setup
  },
  openGraph: {
    title: "PocketBook: Smart AI Personal Finance Tracker",
    description: "100% Free, No Ads. Maximum Privacy. PocketBook is India's simple digital cashbook to track income, expenses & reminders.",
    url: 'https://YOUR_PROJECT_ID.web.app',
    siteName: 'PocketBook',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/icons/icon-512x512.png', // Fallback to app icon if no specific OG image
        width: 512,
        height: 512,
        alt: 'PocketBook App Icon',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "PocketBook: Smart AI Personal Finance Tracker",
    description: "100% Free, No Ads. Maximum Privacy. Track income, expenses & reminders.",
    images: ['/icons/icon-512x512.png'],
  },
  alternates: {
    canonical: '/',
  },
  keywords: [
    'free expense tracker',
    'no ads budget app',
    'digital cashbook India',
    'personal finance app india',
    'free money manager',
    'expense tracker no ads',
    'daily expense manager',
    'khata book app',
    'spending tracker india',
    'budget planner free'
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PocketBook",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "google-site-verification": "verification_token", // Placeholder
  }
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PocketBook',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Android, Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'INR',
  },
  description: "100% Free, No Ads. Maximum Privacy. PocketBook is India's simple digital cashbook to track income, expenses & reminders.",
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1000',
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // For app-like feel
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ErrorBoundary>
          <AuthContextProvider>
            <AppInitializer />
            <NotificationListener />
            <AppLayout>{children}</AppLayout>
            <Toaster richColors position="top-center" />
          </AuthContextProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
