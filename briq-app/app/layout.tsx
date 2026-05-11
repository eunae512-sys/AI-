import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://briq.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "BRIQ — 사장님 대신 브랜드를 운영해주는 AI",
    template: "%s · BRIQ",
  },
  description:
    "사진 몇 장만 올리면 BRIQ가 브랜드 톤을 기억하고 릴스·카드뉴스·블로그를 자동으로 만듭니다. 광고대행사 없이도 운영되는 1인 브랜드의 온라인 직원.",
  applicationName: "BRIQ",
  keywords: [
    "BRIQ",
    "AI 브랜드 운영",
    "릴스 자동 생성",
    "카드뉴스 자동",
    "소상공인 SaaS",
    "콘텐츠 자동화",
    "브랜드 톤 학습",
    "한국 AI 마케팅",
  ],
  authors: [{ name: "BRIQ" }],
  creator: "BRIQ",
  publisher: "BRIQ",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "BRIQ — AI 브랜드 운영 시스템",
    description: "소상공인의 온라인 직원. 사장님 대신 매일 콘텐츠를 만듭니다.",
    type: "website",
    locale: "ko_KR",
    siteName: "BRIQ",
    url: SITE_URL,
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "BRIQ — 사장님 대신 브랜드를 운영해주는 AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BRIQ — AI 브랜드 운영 시스템",
    description: "소상공인의 온라인 직원. 사장님 대신 매일 콘텐츠를 만듭니다.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: SITE_URL },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
