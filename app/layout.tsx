import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "HigherEd Signals",
    template: "%s | HigherEd Signals",
  },
  description:
    "Insights and analysis on trends shaping higher education.",
  openGraph: {
    title: "HigherEd Signals",
    description:
      "Insights and analysis on trends shaping higher education.",
    type: "website",
    locale: "en_US",
    siteName: "HigherEd Signals",
  },
  twitter: {
    card: "summary_large_image",
    title: "HigherEd Signals",
    description:
      "Insights and analysis on trends shaping higher education.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="border-b border-gray-200">
          <nav className="mx-auto max-w-3xl px-6 py-4">
            <a href="/" className="text-lg font-semibold text-gray-900">
              HigherEd Signals
            </a>
          </nav>
        </header>
        <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
        <footer className="border-t border-gray-200">
          <div className="mx-auto max-w-3xl px-6 py-6 text-sm text-gray-500">
            &copy; {new Date().getFullYear()} HigherEd Signals
          </div>
        </footer>
      </body>
    </html>
  );
}
