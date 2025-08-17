
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AppProvider } from '@/contexts/AppContext';
import { Analytics } from "@vercel/analytics/next"; // Added Vercel Analytics import

// Metadata can be dynamic if we use generateMetadata with AppContext
// For now, it's static or uses environment variables if needed before context is ready client-side
export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'BPJP', // Use env var or default
  description: 'Donor & Campaign Management Dashboard',
  manifest: '/manifest.json', // Added manifest link here for metadata
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appTitle = process.env.NEXT_PUBLIC_APP_NAME || 'BPJP';
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3D006A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={appTitle} />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AppProvider> {/* AppProvider wraps AuthProvider now */}
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </AppProvider>
        </ThemeProvider>
        <Analytics /> {/* Added Vercel Analytics component here */}
      </body>
    </html>
  );
}
