import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Batoo Match",
  description: "Find your dream boat",
  icons: {
    icon: [
      { url: "/icons/favicon/favicon.ico" },
      { url: "/icons/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
