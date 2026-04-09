import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navigation from "../components/Navigation";

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
  openGraph: {
    title: "OOTD AI — AI 패션 스타일리스트",
    description: "사진 한 장으로 AI가 코디를 분석하고 스타일링을 추천합니다",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#000000" />
        
        {/* iOS PWA: 홈 화면에서 앱처럼 실행 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="OOTD AI" />
        
        {/* Pretendard Variable Font */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-zinc-900">
        <Navigation />
        {/* Main content area: offset by sidebar on desktop, pad bottom for mobile tab */}
        <main className="lg:ml-[220px] pb-20 lg:pb-0 flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
