import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin System",
  description: "Next.js + Prisma 后台权限系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50 text-[14px] text-gray-900">{children}</body>
    </html>
  );
}
