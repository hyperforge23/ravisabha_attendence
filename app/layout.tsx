import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AttendanceProvider } from "@/components/AttendanceProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Attendance Manager",
  description: "Efficiently manage and export attendance records.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <AttendanceProvider>
              <div className="min-h-screen bg-gray-50 text-gray-900">
                <Navbar />
                <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
                  {children}
                </main>
              </div>
              <Toaster position="top-right" duration={1500} richColors />
            </AttendanceProvider>
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
