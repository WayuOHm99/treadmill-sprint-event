'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { staffSearch, staffSubmitResult, StaffSearchResult } from '@/lib/edgeFunctions';
import { TreadmillBluetoothSession } from '@/lib/treadmillBluetooth';

const RUN_SECONDS = 30;

function ResultsInner() {
  const params = useSearchParams();
  const secret = params.get('key') ?? '';

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
      <main className="flex min-h-screen items-center justify-center bg-ink px-6 text-center text-muted">
        ลิงก์นี้ไม่มีรหัสผ่าน (key) กรุณาใช้ลิงก์ที่ได้รับจากผู้ดูแลระบบ
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-ink px-6 py-10">
      <h1 className="mb-6 font-display text-3xl text-cream">บันทึกผลการวิ่ง</h1>

      <input
        placeholder="ค้นหาด้วยรหัสนักศึกษา หรือ ชื่อ-นามสกุล"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg px-4 py-3"
      />
      {searchError && <p className="mt-2 text-hot">{searchError}</p>}

      <div className="mt-3 flex flex-col gap-2">
        {results.map((r) => (
          <button
            key={r.id}
            onClick={() => selectParticipant(r)}
            className={`rounded-lg border px-4 py-3 text-left transition ${
              selected?.id === r.id ? 'border-hot bg-panel2' : 'border-line bg-panel hover:border-muted'
            }`}
          >
            <span className="font-semibold text-cream">
              {r.first_name} {r.last_name}
            </span>
            <span className="ml-2 text-sm text-muted">{r.student_id}</span>
            {r.distance_m != null && (
              <span className="ml-2 text-sm text-hot">ผลเดิม {r.distance_m} ม.</span>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <div className="mt-8 rounded-xl border border-line bg-panel p-6">
          <h2 className="mb-4 font-display text-2xl text-cream">
            {selected.first_name} {selected.last_name}
          </h2>

          <div className="mb-6 rounded-lg border border-line bg-panel2 p-4">
            <p className="mb-2 text-sm text-muted">โหมดอัตโนมัติ (Bluetooth) — ไม่บังคับ</p>
            {!btSupported && (
              <p className="text-sm text-muted">เบราว์เซอร์นี้ไม่รองรับ Web Bluetooth (ใช้ Chrome บนคอมพิวเตอร์/Android)</p>
            )}
            {btSupported && !btConnected && (
              <button onClick={connectBluetooth} className="rounded-full bg-panel2 border border-line px-4 py-2 text-cream">
                เชื่อมต่อลู่วิ่ง
              </button>
            )}
            {btConnected && !timerRunning && (
              <button onClick={startTimedRun} className="rounded-full bg-hot px-4 py-2 font-semibold text-ink">
                เริ่มจับเวลา {RUN_SECONDS} วินาที
              </button>
            )}
            {timerRunning && (
              <p className="font-display text-4xl text-hot tabular">{secondsLeft} วิ</p>
            )}
            {btLiveDistance !== null && (
              <p className="mt-2 text-sm text-muted">ระยะสะสมปัจจุบันจากลู่วิ่ง: {btLiveDistance} ม.</p>
            )}
          </div>

          <label className="mb-4 block">
            <span className="mb-1 block text-sm text-muted">ระยะทางที่วิ่งได้ (เมตร) — แก้ไขได้เสมอ</span>
            <input
              type="number"
              step="0.1"
              value={distanceInput}
              onChange={(e) => {
                setDistanceInput(e.target.value);
                setSource('manual');
              }}
              className="w-full rounded-lg px-4 py-3 text-xl"
            />
          </label>

          <p className="mb-4 text-sm text-muted">
            แหล่งที่มา: {source === 'device' ? 'อ่านจากลู่วิ่งอัตโนมัติ' : 'กรอกด้วยมือ'}
          </p>

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full rounded-full bg-hot py-4 font-display text-lg text-ink disabled:opacity-50"
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึกผล'}
          </button>

          {submitMsg && <p className="mt-3 text-center text-cream">{submitMsg}</p>}
        </div>
      )}
    </main>
  );
}

export default function StaffResultsPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-ink" />}>
      <ResultsInner />
    </Suspense>
  );
}
