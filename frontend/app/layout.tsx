import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Osamah Portfolio",
    template: "%s | Osamah Portfolio",
  },
  description:
    "Explore Osamah’s software engineering projects, technical work, and professional credentials.",
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
