'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

// Resize an image client-side to keep uploads small (~max 500px)
async function resizeImage(file: File, maxSize = 500): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  if (scale === 1) return file;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', 0.85)
  );
}

const initialForm = {
  full_name: '',
  student_id: '',
  department: '',
  faculty: '',
  year_level: '',
  gender: '' as '' | 'male' | 'female',
  phone: '',
};

const yearOptions = [
  { value: '1', label: 'ปี 1' },
  { value: '2', label: 'ปี 2' },
  { value: '3', label: 'ปี 3' },
  { value: '4', label: 'ปี 4' },
  { value: '5', label: 'อื่นๆ' },
];

export default function RegisterPage() {
  const [form, setForm] = useState(initialForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [idTaken, setIdTaken] = useState(false);

  // Live duplicate check on the student id (debounced)
  useEffect(() => {
    const sid = form.student_id.trim();
    setIdTaken(false);
    if (sid.length < 4) return;
    const t = setTimeout(async () => {
      const { data } = await supabase.rpc('is_student_registered', { sid });
      if (data === true) setIdTaken(true);
    }, 400);
    return () => clearTimeout(t);
  }, [form.student_id]);

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

    const nameParts = form.full_name.trim().split(/\s+/);
    if (nameParts.length < 2) {
      setError('กรุณากรอกทั้งชื่อและนามสกุล (คั่นด้วยเว้นวรรค) เช่น สมชาย ใจดี');
      return;
    }
    const [firstName, ...rest] = nameParts;
    const lastName = rest.join(' ');

    if (idTaken) {
      setError('รหัสนักศึกษานี้ลงทะเบียนไปแล้ว');
      return;
    }
    if (!form.gender) {
      setError('กรุณาเลือกเพศ');
      return;
    }
    if (!form.year_level) {
      setError('กรุณาเลือกชั้นปี');
      return;
    }
    if (!/^0\d{8,9}$/.test(form.phone.trim())) {
      setError('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง เช่น 0812345678');
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl: string | null = null;

      if (photo) {
        const resized = await resizeImage(photo);
        const path = `${form.student_id}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('participant-photos')
          .upload(path, resized, { upsert: false, contentType: 'image/jpeg' });
        if (uploadError) throw uploadError;
        photoUrl = supabase.storage.from('participant-photos').getPublicUrl(path).data.publicUrl;
      }

      const { error: insertError } = await supabase.from('participants').insert({
        student_id: form.student_id.trim(),
        first_name: firstName,
        last_name: lastName,
        year_level: Number(form.year_level),
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
      <>
        <div className="stadium-bg" />
        <div className="track-lines" />
        <main className="reg-success">
          <span style={{ fontSize: '3rem' }}>🎉</span>
          <h1>ลงทะเบียนสำเร็จ!</h1>
          <p>รอเรียกคิวเพื่อขึ้นวิ่งบนลู่วิ่งได้เลยครับ</p>
          <Link href="/">ดูตารางอันดับ</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <div className="stadium-bg" />
      <div className="track-lines" />
      <div className="reg-scroll">
        <header className="site-header">
          <div className="header-inner header-flex" style={{ paddingBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Image
                src="/logo_Group.jpg"
                alt="โลโก้ชมรม"
                width={64}
                height={64}
                className="logo-img"
                priority
              />
              <div>
                <h1 className="site-title text-glow-orange">ลงทะเบียนเข้าร่วม</h1>
                <p className="site-subtitle">⚡ Speed Challenge · 30-Second Sprint</p>
              </div>
            </div>
            <Link href="/" className="tab-btn active" style={{ textDecoration: 'none' }}>
              🏆 ดูตารางอันดับ
            </Link>
          </div>
        </header>

        <main className="reg-wrap">
          <form onSubmit={onSubmit} className="reg-card">
            <div className="reg-grid">
              <label>
                <span className="reg-label">ชื่อ–นามสกุล<span className="req">*</span></span>
                <input
                  required
                  className="reg-input"
                  placeholder="เช่น สมชาย ใจดี"
                  value={form.full_name}
                  onChange={(e) => update('full_name', e.target.value)}
                />
              </label>

              <label>
                <span className="reg-label">รหัสนักศึกษา<span className="req">*</span></span>
                <input
                  required
                  className="reg-input"
                  placeholder="เช่น B68XXXXX"
                  value={form.student_id}
                  onChange={(e) => update('student_id', e.target.value)}
                  style={idTaken ? { borderColor: '#FF4D4D' } : undefined}
                />
                {idTaken && (
                  <span className="reg-hint" style={{ color: '#FF6B6B' }}>
                    ⚠️ รหัสนักศึกษานี้ลงทะเบียนไปแล้ว
                  </span>
                )}
              </label>

              <label>
                <span className="reg-label">สาขาวิชา<span className="req">*</span></span>
                <input
                  required
                  className="reg-input"
                  placeholder="เช่น วิศวกรรมขนส่งและโลจิสติกส์"
                  value={form.department}
                  onChange={(e) => update('department', e.target.value)}
                />
              </label>

              <label>
                <span className="reg-label">ชั้นปี<span className="req">*</span></span>
                <select
                  required
                  className="reg-select"
                  value={form.year_level}
                  onChange={(e) => update('year_level', e.target.value)}
                >
                  <option value="">— เลือกชั้นปี —</option>
                  {yearOptions.map((y) => (
                    <option key={y.value} value={y.value}>{y.label}</option>
                  ))}
                </select>
              </label>

              <label>
                <span className="reg-label">คณะ<span className="req">*</span></span>
                <input
                  required
                  className="reg-input"
                  placeholder="เช่น วิศวกรรมศาสตร์"
                  value={form.faculty}
                  onChange={(e) => update('faculty', e.target.value)}
                />
              </label>

              <label>
                <span className="reg-label">เพศ<span className="req">*</span></span>
                <select
                  required
                  className="reg-select"
                  value={form.gender}
                  onChange={(e) => update('gender', e.target.value as 'male' | 'female')}
                >
                  <option value="">— เลือกเพศ —</option>
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                </select>
              </label>

              <label>
                <span className="reg-label">เบอร์โทรศัพท์<span className="req">*</span></span>
                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  className="reg-input"
                  placeholder="เช่น 0812345678"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
                <span className="reg-hint">ใช้ติดต่อเรียกคิวเท่านั้น ไม่แสดงบนตารางอันดับ</span>
              </label>

              <label>
                <span className="reg-label">รูปโปรไฟล์ <span className="reg-hint" style={{ display: 'inline' }}>(แสดงบนตารางอันดับ)</span></span>
                <div className="reg-photo-row">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onPhotoChange}
                    className="reg-input"
                    style={{ padding: '10px 12px' }}
                  />
                  {preview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="ตัวอย่างรูป" className="reg-photo-preview" />
                  )}
                </div>
              </label>
            </div>

            {error && <p className="reg-error">⚠️ {error}</p>}

            <button type="submit" disabled={submitting} className="reg-submit">
              {submitting ? '⏳ กำลังบันทึก...' : '🏃 ลงทะเบียนเข้าร่วม'}
            </button>
          </form>
        </main>
      </div>
    </>
  );
}
