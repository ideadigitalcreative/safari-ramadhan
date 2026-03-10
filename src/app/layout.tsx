import type { Metadata } from "next";
import "./globals.css";
import KeepAliveTrigger from "@/components/KeepAliveTrigger";
import UrlParamsCheck from "@/components/UrlParamsCheck";

export const metadata: Metadata = {
  title: "Safari Ramadhan - Manajemen Donasi",
  description: "Aplikasi manajemen donasi Safari Ramadhan untuk pengelolaan jadwal, pencatatan donasi, dan monitoring komitmen donatur",
  keywords: "safari ramadhan, donasi, manajemen, masjid, ramadhan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <UrlParamsCheck />
        <KeepAliveTrigger />
        {children}
      </body>
    </html>
  );
}
