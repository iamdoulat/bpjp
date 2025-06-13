
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AppProvider } from '@/contexts/AppContext';

// Metadata can be dynamic if we use generateMetadata with AppContext
// For now, it's static or uses environment variables if needed before context is ready client-side
export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'ImpactBoard', // Use env var or default
  description: 'Donor & Campaign Management Dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
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
      </body>
    </html>
  );
}
