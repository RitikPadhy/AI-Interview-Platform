import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";
import { Toaster } from "sonner";
import Nav from "@/components/Nav";
import "./globals.css";

const monaSans = Mona_Sans({ variable: "--font-mona-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Interview Copilot",
  description: "Local interview prep, resume and outreach tooling running on the Claude CLI.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${monaSans.className} antialiased pattern`}>
        <Nav />
        <main className="shell">{children}</main>
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  );
}
