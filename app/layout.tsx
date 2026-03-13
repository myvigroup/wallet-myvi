import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digitale Visitenkarte | MYVI Group",
  description: "Erstelle deine persönliche Apple Wallet Visitenkarte als MYVI Berater.",
};

export const viewport: Viewport = {
  themeColor: "#292525",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
