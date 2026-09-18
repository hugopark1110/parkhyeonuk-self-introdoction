import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "박현욱",
  description: "박현욱의 작업과 기록.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
