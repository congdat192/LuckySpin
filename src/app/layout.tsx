import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Lucky Spin - Vòng Quay May Mắn | Mắt Kính Tâm Đức",
    template: "%s | Lucky Spin - Mắt Kính Tâm Đức",
  },
  description: "Tham gia vòng quay may mắn để nhận voucher giảm giá và quà tặng hấp dẫn từ Mắt Kính Tâm Đức. Mua hàng - Quay số - Nhận quà liền tay!",
  keywords: ["lucky spin", "vòng quay may mắn", "mắt kính tâm đức", "voucher", "khuyến mãi", "quà tặng"],
  authors: [{ name: "Mắt Kính Tâm Đức" }],
  creator: "Mắt Kính Tâm Đức",
  publisher: "Mắt Kính Tâm Đức",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: "/apple-icon.png",
    shortcut: "/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "Lucky Spin - Mắt Kính Tâm Đức",
    title: "Lucky Spin - Vòng Quay May Mắn | Mắt Kính Tâm Đức",
    description: "Tham gia vòng quay may mắn để nhận voucher giảm giá và quà tặng hấp dẫn từ Mắt Kính Tâm Đức.",
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://luckyspin.matkinhtamduc.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
