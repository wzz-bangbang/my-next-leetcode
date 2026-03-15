import type { Metadata } from "next";
import "./globals.css";
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import Providers from '@/components/Providers';
import LoginModal from '@/components/auth/LoginModal';
import { mantineTheme } from '@/styles/mantine-theme';

export const metadata: Metadata = {
  title: "前端求职指北",
  description: "前端面试八股题和手写题练习平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>
          <MantineProvider theme={mantineTheme}>
            <Notifications position="top-right" />
            <LoginModal />
            {children}
          </MantineProvider>
        </Providers>
      </body>
    </html>
  );
}
