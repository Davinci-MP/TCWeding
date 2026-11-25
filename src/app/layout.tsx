import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "https://tcwedding.vn"),
  title: { default: "TCWedding — Chụp ảnh cưới, thiệp mời online & album cưới", template: "%s · TCWedding" },
  description: "TCWedding chụp ảnh cưới studio, ngoại cảnh, phóng sự ngày cưới; làm album cưới và thiệp mời online gửi bằng một đường link.",
  icons: { icon: "/favicon.svg" },
  openGraph: { siteName: "TCWedding", locale: "vi_VN", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Playfair+Display:ital,wght@0,600;1,400&display=swap&subset=vietnamese"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
