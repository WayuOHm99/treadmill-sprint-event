'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase, LeaderboardRow } from '@/lib/supabaseClient';

const medalColor = ['text-gold', 'text-silver', 'text-bronze', 'text-cream', 'text-cream'];

function RankRow({ row, rank }: { row: LeaderboardRow; rank: number }) {
  const isTop = rank === 1;
  return (
    <div
      className={`flex items-center gap-4 rounded-xl border border-line bg-panel px-4 py-3 ${
        isTop ? 'speed-streak border-hot/40' : ''
      }`}
    >
      <div className={`w-12 shrink-0 text-center font-display text-4xl ${medalColor[rank - 1] ?? 'text-cream'}`}>
        {rank}
      </div>
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-line bg-panel2">
        {row.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.photo_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted">?</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-cream">
          {row.first_name} {row.last_name}
        </p>
        <p className="truncate text-sm text-muted">
          {row.faculty} · {row.department}
        </p>
      </div>
      <div className="tabular shrink-0 font-display text-3xl text-hot">
        {row.distance_m.toFixed(1)}
        <span className="ml-1 text-sm font-body font-normal text-muted">ม.</span>
      </div>
    </div>
  );
}

function Board({ title, rows }: { title: string; rows: LeaderboardRow[] }) {
  return (
    <section className="flex-1 min-w-0">
      <h2 className="mb-3 font-display text-2xl tracking-wide text-cream">{title}</h2>
      <div className="flex flex-col gap-2">
        {rows.length === 0 && (
          <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-muted">
            ยังไม่มีผลการวิ่ง
          </p>
        )}
        {rows.map((row, i) => (
          <RankRow key={row.id} row={row} rank={i + 1} />
        ))}
      </div>
    </section>
  );
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data, error } = await supabase
        .from('leaderboard_public')
        .select('id, first_name, last_name, faculty, department, gender, photo_url, distance_m')
        .order('distance_m', { ascending: false });
      if (active && !error && data) setRows(data as LeaderboardRow[]);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel('leaderboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard_public' }, () => {
        load();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const overall = useMemo(() => rows.slice(0, 5), [rows]);
  const men = useMemo(() => rows.filter((r) => r.gender === 'male').slice(0, 5), [rows]);
  const women = useMemo(() => rows.filter((r) => r.gender === 'female').slice(0, 5), [rows]);

  return (
    <main className="min-h-screen bg-ink px-6 py-10 md:px-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-hot">30 วินาที · ระยะทางสูงสุด</p>
          <h1 className="font-display text-5xl leading-none text-cream md:text-6xl">
            CURVED TREADMILL SPRINT
          </h1>
        </div>
        <Link
          href="/register/"
          className="rounded-full bg-hot px-6 py-3 font-semibold text-ink transition hover:brightness-110"
        >
          ลงทะเบียนเข้าร่วม
        </Link>
      </header>

      {loading ? (
        <p className="text-muted">กำลังโหลดข้อมูล...</p>
      ) : (
        <div className="flex flex-col gap-10">
          <Board title="อันดับรวม TOP 5" rows={overall} />
          <div className="flex flex-col gap-10 md:flex-row">
            <Board title="ชาย TOP 5" rows={men} />
            <Board title="หญิง TOP 5" rows={women} />
          </div>
        </div>
      )}
    </main>
  );
}
