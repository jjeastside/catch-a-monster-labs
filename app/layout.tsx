import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monster Lab",
  description: "A build planning workspace for monster-catching games.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
