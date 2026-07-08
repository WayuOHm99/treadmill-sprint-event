'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

const initialForm = {
  student_id: '',
  first_name: '',
  last_name: '',
  year_level: '',
  faculty: '',
  department: '',
  phone: '',
  gender: '' as '' | 'male' | 'female',
};

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhoto(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.gender) {
      setError('กรุณาเลือกเพศ');
      return;
    }
    const yearNum = Number(form.year_level);
    if (!yearNum || yearNum < 1 || yearNum > 8) {
      setError('กรุณากรอกชั้นปีให้ถูกต้อง');
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl: string | null = null;

      if (photo) {
        const ext = photo.name.split('.').pop() || 'jpg';
        const path = `${form.student_id}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('participant-photos')
          .upload(path, photo, { upsert: false });
        if (uploadError) throw uploadError;
        photoUrl = supabase.storage.from('participant-photos').getPublicUrl(path).data.publicUrl;
      }

      const { error: insertError } = await supabase.from('participants').insert({
        student_id: form.student_id.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        year_level: yearNum,
        faculty: form.faculty.trim(),
        department: form.department.trim(),
        phone: form.phone.trim(),
        gender: form.gender,
        photo_url: photoUrl,
      });

      if (insertError) {
        if (insertError.message.includes('duplicate') || insertError.code === '23505') {
          throw new Error('รหัสนักศึกษานี้ลงทะเบียนไปแล้ว');
        }
        throw insertError;
      }

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink px-6 text-center">
        <h1 className="font-display text-4xl text-hot">ลงทะเบียนสำเร็จ!</h1>
        <p className="text-muted">รอเรียกคิวเพื่อขึ้นวิ่งบนลู่วิ่งได้เลยครับ</p>
        <Link href="/" className="mt-4 rounded-full bg-hot px-6 py-3 font-semibold text-ink">
          ดูตารางอันดับ
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-ink px-6 py-10">
      <h1 className="mb-1 font-display text-3xl text-cream">ลงทะเบียนเข้าร่วม</h1>
      <p className="mb-8 text-muted">กรอกข้อมูลให้ครบก่อนขึ้นวิ่งบนลู่วิ่ง Curved Treadmill</p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="รหัสนักศึกษา">
          <input
            required
            value={form.student_id}
            onChange={(e) => update('student_id', e.target.value)}
            className="w-full rounded-lg px-4 py-3"
          />
        </Field>

        <div className="flex gap-3">
          <Field label="ชื่อจริง" className="flex-1">
            <input
              required
              value={form.first_name}
              onChange={(e) => update('first_name', e.target.value)}
              className="w-full rounded-lg px-4 py-3"
            />
          </Field>
          <Field label="นามสกุล" className="flex-1">
            <input
              required
              value={form.last_name}
              onChange={(e) => update('last_name', e.target.value)}
              className="w-full rounded-lg px-4 py-3"
            />
          </Field>
        </div>

        <div className="flex gap-3">
          <Field label="ชั้นปี" className="w-28">
            <input
              required
              type="number"
              min={1}
              max={8}
              value={form.year_level}
              onChange={(e) => update('year_level', e.target.value)}
              className="w-full rounded-lg px-4 py-3"
            />
          </Field>
          <Field label="เพศ" className="flex-1">
            <select
              required
              value={form.gender}
              onChange={(e) => update('gender', e.target.value as 'male' | 'female')}
              className="w-full rounded-lg px-4 py-3"
            >
              <option value="">เลือก</option>
              <option value="male">ชาย</option>
              <option value="female">หญิง</option>
            </select>
          </Field>
        </div>

        <Field label="คณะ">
          <input
            required
            value={form.faculty}
            onChange={(e) => update('faculty', e.target.value)}
            className="w-full rounded-lg px-4 py-3"
          />
        </Field>

        <Field label="สาขา">
          <input
            required
            value={form.department}
            onChange={(e) => update('department', e.target.value)}
            className="w-full rounded-lg px-4 py-3"
          />
        </Field>

        <Field label="เบอร์โทรศัพท์">
          <input
            required
            type="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            className="w-full rounded-lg px-4 py-3"
          />
        </Field>

        <Field label="รูปภาพส่วนตัว (ใช้แสดงบนตารางอันดับ)">
          <input type="file" accept="image/*" onChange={onPhotoChange} className="w-full rounded-lg px-4 py-3" />
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="ตัวอย่างรูป" className="mt-3 h-28 w-28 rounded-full object-cover" />
          )}
        </Field>

        {error && <p className="rounded-lg bg-hot/10 px-4 py-3 text-hot">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-hot px-6 py-4 font-display text-lg tracking-wide text-ink transition hover:brightness-110 disabled:opacity-50"
        >
          {submitting ? 'กำลังบันทึก...' : 'ลงทะเบียน'}
        </button>
      </form>
    </main>
  );
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}
