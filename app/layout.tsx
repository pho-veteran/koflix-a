import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ToastProvider } from "../providers/toast-provider";

const geistSans = localFont({
    src: '../public/fonts/geist/Geist-VariableFont_wght.ttf',
    variable: '--font-geist-sans',
    display: 'swap',
});

const geistMono = localFont({
    src: '../public/fonts/geist-mono/GeistMono-VariableFont_wght.ttf',
    variable: '--font-geist-mono',
    display: 'swap',
});

export const metadata: Metadata = {
    title: "Koflix - Stream Movies & TV Shows",
    description: "Stream the latest movies and TV shows on Koflix",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <ToastProvider />
                {children}
            </body>
        </html>
    );
}