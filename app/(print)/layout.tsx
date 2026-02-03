import "@/app/globals.css";
import { Geist_Mono } from "next/font/google";

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