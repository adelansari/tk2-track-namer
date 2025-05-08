
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Header } from '@/components/custom/Header';
import { Toaster } from '@/components/ui/toaster';
import { SpeedInsights } from "@vercel/speed-insights/next"

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap', // Added for better font loading behavior
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap', // Added for better font loading behavior
});

export const metadata: Metadata = {
  title: 'TrackNamer',
  description: 'Suggest names for kart racing game tracks and arenas!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.className} ${geistMono.className}`} suppressHydrationWarning>
      <body className={`antialiased min-h-screen flex flex-col bg-background text-foreground`}>
        <AuthProvider>
          <Header />
          <main className="flex-grow container py-8">
            {children}
          </main>
          <Toaster />
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}

