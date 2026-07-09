import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ท้าทายขีดจำกัดความเร็ว | Speed Challenge',
  description: '⚡ Speed Challenge · 30-Second Sprint · Track & Field — วิ่ง 30 วินาที ใครไปได้ไกลสุด',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
