import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navigation from "../components/Navigation";
import ClientMain from "../components/ClientMain";
import { ThemeProvider } from "../components/ThemeProvider";
import { ToastProvider } from "../components/ToastProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "OOTD AI — AI 패션 스타일리스트",
  description:
    "사진 한 장으로 AI가 당신의 오늘의 코디를 분석하고, 맞춤 스타일링을 추천해주는 스마트 패션 어시스턴트",
  keywords: ["OOTD", "AI", "패션", "스타일리스트", "코디", "옷장"],
  metadataBase: new URL("https://ootdai.me"),
  openGraph: {
    title: "OOTD AI — AI 패션 스타일리스트",
    description: "사진 한 장으로 AI가 코디를 분석하고 스타일링을 추천합니다",
    type: "website",
    url: "https://ootdai.me",
    siteName: "OOTD AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "OOTD AI — AI 패션 스타일리스트",
    description: "사진 한 장으로 AI가 코디를 분석하고 스타일링을 추천합니다",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#000000" />
        
        {/* iOS PWA: 홈 화면에서 앱처럼 실행 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="OOTD AI" />
        
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono&display=swap" rel="stylesheet" />
        
        {/* Pretendard Variable Font */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-[#0c0c0f] text-zinc-900 dark:text-white">
        <ThemeProvider>
          <ToastProvider>
            <Navigation />
            <ClientMain>
              {children}
            </ClientMain>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
