'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import { staffExport } from '@/lib/edgeFunctions';
import { getStaffKey } from '@/lib/staffKey';

const GENDER_TH: Record<string, string> = { male: 'ชาย', female: 'หญิง' };
const SOURCE_TH: Record<string, string> = { manual: 'กรอกมือ', device: 'ลู่วิ่งอัตโนมัติ' };

function ExportInner() {
  const params = useSearchParams();
  const secret = getStaffKey(params.get('key'));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);

  async function download() {
    setLoading(true);
    setError(null);
    try {
      const { rows } = await staffExport(secret);
      setCount(rows.length);

      const sheetData = rows.map((r, i) => ({
        อันดับ: r.distance_m != null ? i + 1 : '-',
        รหัสนักศึกษา: r.student_id,
        ชื่อ: r.first_name,
        นามสกุล: r.last_name,
        ชั้นปี: r.year_level,
        คณะ: r.faculty,
        สาขา: r.department,
        เบอร์โทรศัพท์: r.phone,
        เพศ: GENDER_TH[r.gender] ?? r.gender,
        'ระยะทาง (ม.)': r.distance_m ?? '',
        แหล่งที่มา: r.result_source ? SOURCE_TH[r.result_source] ?? r.result_source : '',
        เวลาลงทะเบียน: new Date(r.created_at).toLocaleString('th-TH'),
      }));

      const ws = XLSX.utils.json_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'ผลการวิ่ง');
      const filename = `treadmill-sprint-${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ดึงข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  if (!secret) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink px-6 text-center text-muted">
        ลิงก์นี้ไม่มีรหัสผ่าน (key) กรุณาใช้ลิงก์ที่ได้รับจากผู้ดูแลระบบ
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 bg-ink px-6 text-center">
      <nav style={{ display: 'flex', gap: 8 }}>
        <a href="/" className="tab-btn" style={{ textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 8 }}>🏆 หน้าลีดเดอร์บอร์ด</a>
        <a href="/staff/results/" className="tab-btn" style={{ textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 8 }}>⏱️ บันทึกผล</a>
      </nav>
      <h1 className="font-display text-3xl text-cream">Export ข้อมูลเป็น Excel</h1>
      <p className="text-muted">ดึงข้อมูลผู้ลงทะเบียนและผลการวิ่งทั้งหมดเป็นไฟล์ .xlsx</p>
      <button
        onClick={download}
        disabled={loading}
        className="rounded-full bg-hot px-8 py-4 font-display text-lg text-ink disabled:opacity-50"
      >
        {loading ? 'กำลังดึงข้อมูล...' : 'ดาวน์โหลด Excel'}
      </button>
      {count !== null && <p className="text-muted">ดาวน์โหลดแล้ว {count} รายการ</p>}
      {error && <p className="text-hot">{error}</p>}
    </main>
  );
}

export default function StaffExportPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-ink" />}>
      <ExportInner />
    </Suspense>
  );
}
