import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/app-context";
import { LogProvider } from "@/context/log-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Feedback Genie - AI-Powered Text Analysis",
  description: "Analyze open-ended feedback responses and identify themes automatically using AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LogProvider>
          <AppProvider>{children}</AppProvider>
        </LogProvider>
      </body>
    </html>
  );
}
