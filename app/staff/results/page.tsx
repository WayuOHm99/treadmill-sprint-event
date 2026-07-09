'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { staffSearch, staffSubmitResult, StaffSearchResult } from '@/lib/edgeFunctions';
import { TreadmillBluetoothSession } from '@/lib/treadmillBluetooth';
import { getStaffKey } from '@/lib/staffKey';

const RUN_SECONDS = 30;

function ResultsInner() {
  const params = useSearchParams();
  const secret = getStaffKey(params.get('key'));

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StaffSearchResult[]>([]);
  const [selected, setSelected] = useState<StaffSearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [distanceInput, setDistanceInput] = useState('');
  const [source, setSource] = useState<'manual' | 'device'>('manual');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  const [btSupported] = useState(() => TreadmillBluetoothSession.isSupported());
  const [btConnected, setBtConnected] = useState(false);
  const [btLiveDistance, setBtLiveDistance] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RUN_SECONDS);
  const sessionRef = useRef<TreadmillBluetoothSession | null>(null);
  const startDistanceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setSearchError(null);
        const { results } = await staffSearch(secret, query.trim());
        setResults(results);
      } catch (e) {
        setSearchError(e instanceof Error ? e.message : 'ค้นหาไม่สำเร็จ');
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query, secret]);

  function selectParticipant(p: StaffSearchResult) {
    setSelected(p);
    setDistanceInput(p.distance_m != null ? String(p.distance_m) : '');
    setSource('manual');
    setSubmitMsg(null);
    setBtLiveDistance(null);
  }

  async function connectBluetooth() {
    try {
      const session = new TreadmillBluetoothSession();
      session.onReading = (r) => {
        if (r.totalDistanceMeters !== null) setBtLiveDistance(r.totalDistanceMeters);
      };
      await session.connect();
      sessionRef.current = session;
      setBtConnected(true);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'เชื่อมต่อลู่วิ่งไม่สำเร็จ');
    }
  }

  function startTimedRun() {
    startDistanceRef.current = sessionRef.current?.latestDistance ?? btLiveDistance ?? 0;
    setSecondsLeft(RUN_SECONDS);
    setTimerRunning(true);

    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setTimerRunning(false);
          const endDistance = sessionRef.current?.latestDistance ?? btLiveDistance ?? 0;
          const start = startDistanceRef.current ?? 0;
          const delta = Math.max(0, endDistance - start);
          setDistanceInput(delta.toFixed(1));
          setSource('device');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  async function submit() {
    if (!selected) return;
    const distance = Number(distanceInput);
    if (!distance || distance < 0) {
      setSubmitMsg('กรุณากรอกระยะทางให้ถูกต้อง');
      return;
    }
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      await staffSubmitResult(secret, selected.id, distance, source);
      setSubmitMsg('บันทึกผลสำเร็จ!');
      setSelected({ ...selected, distance_m: distance });
    } catch (e) {
      setSubmitMsg(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  }

  if (!secret) {
    return (
      <main className="reg-success">
        <p>ลิงก์นี้ไม่มีรหัสผ่าน (key) กรุณาใช้ลิงก์ที่ได้รับจากผู้ดูแลระบบ</p>
      </main>
    );
  }

  return (
    <div className="reg-scroll">
      <div className="stadium-bg" />
      <div className="track-lines" />
      <main className="reg-wrap" style={{ maxWidth: 720 }}>
        <nav style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <a href="/" className="tab-btn" style={{ textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 8 }}>🏆 หน้าลีดเดอร์บอร์ด</a>
          <a href="/staff/export/" className="tab-btn" style={{ textDecoration: 'none', border: '1px solid var(--border)', borderRadius: 8 }}>📥 Export Excel</a>
        </nav>
        <h1 className="site-title text-glow-orange" style={{ marginBottom: 20 }}>⏱️ บันทึกผลการวิ่ง</h1>

        <input
          placeholder="ค้นหาด้วยรหัสนักศึกษา หรือ ชื่อ-นามสกุล"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="reg-input"
        />
        {searchError && <p className="reg-error">⚠️ {searchError}</p>}

      <div className="mt-3 flex flex-col gap-2">
        {results.map((r) => (
          <button
            key={r.id}
            onClick={() => selectParticipant(r)}
            className="rank-card"
            style={{
              padding: '12px 16px', textAlign: 'left', cursor: 'pointer', width: '100%',
              borderColor: selected?.id === r.id ? 'var(--neon-orange)' : undefined,
            }}
          >
            <span style={{ fontWeight: 700, color: '#fff' }}>
              {r.first_name} {r.last_name}
            </span>
            <span className="rc-tag" style={{ marginLeft: 8 }}>{r.student_id}</span>
            {r.distance_m != null && (
              <span className="rc-tag" style={{ marginLeft: 8, color: 'var(--neon-orange)' }}>
                ผลเดิม {r.distance_m} ม.
              </span>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <div className="reg-card" style={{ marginTop: 28 }}>
          <h2 className="section-title" style={{ marginBottom: 16 }}>
            🏃 {selected.first_name} {selected.last_name}
          </h2>

          <div className="reg-card" style={{ background: 'var(--bg-card2)', marginBottom: 20, padding: 18 }}>
            <p className="reg-hint" style={{ marginBottom: 10 }}>โหมดอัตโนมัติ (Bluetooth) — ไม่บังคับ</p>
            {!btSupported && (
              <p className="reg-hint">เบราว์เซอร์นี้ไม่รองรับ Web Bluetooth (ใช้ Chrome บนคอมพิวเตอร์/Android)</p>
            )}
            {btSupported && !btConnected && (
              <button onClick={connectBluetooth} className="tab-btn active" style={{ cursor: 'pointer' }}>
                📡 เชื่อมต่อลู่วิ่ง
              </button>
            )}
            {btConnected && !timerRunning && (
              <button onClick={startTimedRun} className="reg-submit" style={{ marginTop: 0, width: 'auto', padding: '10px 24px', fontSize: '1rem' }}>
                ▶️ เริ่มจับเวลา {RUN_SECONDS} วินาที
              </button>
            )}
            {timerRunning && (
              <p className="rc-dist" style={{ fontSize: '2.6rem', color: 'var(--neon-orange)' }}>{secondsLeft} วิ</p>
            )}
            {btLiveDistance !== null && (
              <p className="reg-hint" style={{ marginTop: 8 }}>ระยะสะสมปัจจุบันจากลู่วิ่ง: {btLiveDistance} ม.</p>
            )}
          </div>

          <label style={{ display: 'block', marginBottom: 14 }}>
            <span className="reg-label">ระยะทางที่วิ่งได้ (เมตร) — แก้ไขได้เสมอ</span>
            <input
              type="number"
              step="0.1"
              value={distanceInput}
              onChange={(e) => {
                setDistanceInput(e.target.value);
                setSource('manual');
              }}
              className="reg-input"
              style={{ fontSize: '1.3rem' }}
            />
          </label>

          <p className="reg-hint" style={{ marginBottom: 14 }}>
            แหล่งที่มา: {source === 'device' ? 'อ่านจากลู่วิ่งอัตโนมัติ' : 'กรอกด้วยมือ'}
          </p>

          <button onClick={submit} disabled={submitting} className="reg-submit">
            {submitting ? '⏳ กำลังบันทึก...' : '💾 บันทึกผล'}
          </button>

          {submitMsg && (
            <p style={{ marginTop: 12, textAlign: 'center', color: submitMsg.includes('สำเร็จ') ? 'var(--neon-green)' : '#FF6B6B' }}>
              {submitMsg}
            </p>
          )}
        </div>
      )}
      </main>
    </div>
  );
}

export default function StaffResultsPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: '100vh' }} />}>
      <ResultsInner />
    </Suspense>
  );
}
