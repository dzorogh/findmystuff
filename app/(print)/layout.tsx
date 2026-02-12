import "@/app/globals.css";
import { Geist_Mono } from "next/font/google";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s - FindMyStuff",
    default: "FindMyStuff",
  },
};

const geistMono = Geist_Mono({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-geist-mono",
    fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
});

export default function PrintLayout({ children }: { children: React.ReactNode }) {
    return (
        <html>
            <body className={geistMono.className}>
                {children}
            </body>
        </html>
    )
}