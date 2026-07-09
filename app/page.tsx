'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase, LeaderboardRow } from '@/lib/supabaseClient';

/* ============================================================
   HELPER: Animate a number counting up
============================================================ */
function useCountUp(target: number, decimals = 0, duration = 900) {
  const [display, setDisplay] = useState('—');
  const prevTarget = useRef<number | null>(null);

  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;

    const start = performance.now();
    let raf: number;

    function step(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = target * ease;
      setDisplay(
        decimals > 0
          ? val.toFixed(decimals)
          : Math.round(val).toLocaleString('th-TH')
      );
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setDisplay(
          decimals > 0
            ? target.toFixed(decimals)
            : target.toLocaleString('th-TH')
        );
      }
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, decimals, duration]);

  return display;
}

/* ============================================================
   STAT CARD COMPONENT
============================================================ */
function StatCard({
  label,
  icon,
  value,
  unit,
  decimals = 0,
  colorVar,
  glowClass,
  variant,
}: {
  label: string;
  icon: string;
  value: number;
  unit: string;
  decimals?: number;
  colorVar: string;
  glowClass?: string;
  variant: string;
}) {
  const display = useCountUp(value, decimals);

  return (
    <div className={`stat-card ${variant}`}>
      <p className="stat-label">
        {icon} {label}
      </p>
      <div
        className={`stat-value ${glowClass || ''}`}
        style={{ color: `var(${colorVar})` }}
      >
        {display}
      </div>
      <p className="stat-unit">{unit}</p>
    </div>
  );
}

/* ============================================================
   RANK CARD — renders ranking items with medals/particles
============================================================ */
function RankCard({ row, rank, maxDist }: { row: LeaderboardRow; rank: number; maxDist: number }) {
  const barRef = useRef<HTMLDivElement>(null);
  const dist = row.distance_m;
  const pct = maxDist > 0 ? ((dist / maxDist) * 100).toFixed(1) : '0';
  const firstName = row.first_name;
  const medals = ['🥇', '🥈', '🥉'];

  const genderBadge =
    row.gender === 'female' ? (
      <span className="gender-badge gender-f">👩 หญิง</span>
    ) : row.gender === 'male' ? (
      <span className="gender-badge gender-m">👨 ชาย</span>
    ) : null;

  // Animate progress bar on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (barRef.current) {
        barRef.current.style.width = `${pct}%`;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [pct]);

  if (rank === 1) {
    return (
      <div className="rank-card r1">
        <div className="rc-particles">
          <span style={{ width: 4, height: 4, left: '10%', animationDuration: '4s', animationDelay: '0s' }} />
          <span style={{ width: 3, height: 3, left: '30%', animationDuration: '5s', animationDelay: '0.8s' }} />
          <span style={{ width: 5, height: 5, left: '55%', animationDuration: '3.5s', animationDelay: '0.3s' }} />
          <span style={{ width: 3, height: 3, left: '75%', animationDuration: '4.5s', animationDelay: '1.2s' }} />
          <span style={{ width: 4, height: 4, left: '90%', animationDuration: '6s', animationDelay: '2s' }} />
        </div>
        <span className="crown-anim">👑</span>
        <div className="rc-left">
          <div className="rc-medal">
            <span className="medal-emoji">{medals[0]}</span>
          </div>
          <div className="rc-info">
            <div className="rc-name">{firstName} {row.last_name}</div>
            <div className="rc-meta">
              <span className="rc-tag">🏆 อันดับ 1</span>
              <span className="rc-tag">{row.faculty}</span>
              <span className="rc-tag">{row.department}</span>
              {genderBadge}
            </div>
            <div className="rc-bar-wrap">
              <div ref={barRef} className="rc-bar-fill" style={{ width: 0 }} />
            </div>
          </div>
        </div>
        <div className="rc-right">
          <div className="rc-dist">{dist.toFixed(1)}</div>
          <div className="rc-unit">เมตร</div>
        </div>
      </div>
    );
  }

  if (rank === 2) {
    return (
      <div className="rank-card r2">
        <div className="rc-left">
          <div className="rc-medal">
            <span className="medal-emoji">{medals[1]}</span>
          </div>
          <div className="rc-info">
            <div className="rc-name">{firstName} {row.last_name}</div>
            <div className="rc-meta">
              <span className="rc-tag">🥈 อันดับ 2</span>
              <span className="rc-tag">{row.faculty}</span>
              <span className="rc-tag">{row.department}</span>
              {genderBadge}
            </div>
            <div className="rc-bar-wrap">
              <div ref={barRef} className="rc-bar-fill" style={{ width: 0 }} />
            </div>
          </div>
        </div>
        <div className="rc-right">
          <div className="rc-dist">{dist.toFixed(1)}</div>
          <div className="rc-unit">เมตร</div>
        </div>
      </div>
    );
  }

  if (rank === 3) {
    return (
      <div className="rank-card r3">
        <div className="rc-left">
          <div className="rc-medal">
            <span className="medal-emoji">{medals[2]}</span>
          </div>
          <div className="rc-info">
            <div className="rc-name">{firstName} {row.last_name}</div>
            <div className="rc-meta">
              <span className="rc-tag">🥉 อันดับ 3</span>
              <span className="rc-tag">{row.faculty}</span>
              <span className="rc-tag">{row.department}</span>
              {genderBadge}
            </div>
            <div className="rc-bar-wrap">
              <div ref={barRef} className="rc-bar-fill" style={{ width: 0 }} />
            </div>
          </div>
        </div>
        <div className="rc-right">
          <div className="rc-dist">{dist.toFixed(1)}</div>
          <div className="rc-unit">เมตร</div>
        </div>
      </div>
    );
  }

  // Rank 4+
  return (
    <div className={`rank-card r-other ${rank === 4 ? 'r4' : ''}`}>
      <div className="rc-left">
        <div className="rc-medal">
          <span className="rc-num">{rank}</span>
        </div>
        <div className="rc-info">
          <div className="rc-name">{firstName} {row.last_name}</div>
          <div className="rc-meta">
            <span className="rc-tag">{row.faculty}</span>
            <span className="rc-tag">{row.department}</span>
            {genderBadge}
          </div>
        </div>
      </div>
      <div className="rc-right">
        <div className="rc-dist">{dist.toFixed(1)}</div>
        <div className="rc-unit">ม.</div>
      </div>
    </div>
  );
}

/* ============================================================
   RANKING LIST (with gender filter tabs)
============================================================ */
function RankingSection({ title, rows }: { title: string; rows: LeaderboardRow[] }) {
  const maxDist = useMemo(
    () => (rows.length > 0 ? Math.max(...rows.map((r) => r.distance_m)) : 0),
    [rows]
  );

  if (rows.length === 0) {
    return (
      <div>
        <h3 className="section-title">{title}</h3>
        <div className="empty-state">
          <div className="empty-icon">🏟️</div>
          <p className="empty-text">ยังไม่มีข้อมูลการแข่งขัน</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="section-title">
        {title}
        <span className="badge">{rows.length} คน</span>
      </h3>
      <div className="ranking-list">
        {rows.map((row, i) => (
          <RankCard key={row.id} row={row} rank={i + 1} maxDist={maxDist} />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   SKELETON LOADING
============================================================ */
function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skel-row skeleton" />
      ))}
    </>
  );
}

/* ============================================================
   MAIN PAGE
============================================================ */
export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'male' | 'female'>('leaderboard');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('leaderboard_public')
      .select('id, first_name, last_name, faculty, department, gender, photo_url, distance_m')
      .order('distance_m', { ascending: false });
    if (!error && data) setRows(data as LeaderboardRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();

    const channel = supabase
      .channel('leaderboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard_public' }, () => {
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  // Derived data
  const withDistance = useMemo(() => rows.filter((r) => r.distance_m > 0), [rows]);
  const men = useMemo(() => withDistance.filter((r) => r.gender === 'male'), [withDistance]);
  const women = useMemo(() => withDistance.filter((r) => r.gender === 'female'), [withDistance]);

  const totalParticipants = rows.length;
  const maxDistance = useMemo(
    () => (withDistance.length > 0 ? Math.max(...withDistance.map((r) => r.distance_m)) : 0),
    [withDistance]
  );
  const avgDistance = useMemo(
    () =>
      withDistance.length > 0
        ? withDistance.reduce((sum, r) => sum + r.distance_m, 0) / withDistance.length
        : 0,
    [withDistance]
  );

  // Filter by search
  const filteredRows = useMemo(() => {
    let list: LeaderboardRow[];
    switch (activeTab) {
      case 'male':
        list = men;
        break;
      case 'female':
        list = women;
        break;
      default:
        list = withDistance;
    }

    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (r) =>
        r.first_name.toLowerCase().includes(q) ||
        r.last_name.toLowerCase().includes(q) ||
        r.faculty.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q)
    );
  }, [activeTab, men, women, withDistance, search]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'leaderboard', label: '🏆 ลีดเดอร์บอร์ดรวม' },
    { key: 'male', label: '👨 ชาย' },
    { key: 'female', label: '👩 หญิง' },
  ];

  return (
    <>
      {/* Stadium background effects */}
      <div className="stadium-bg" />
      <div className="track-lines" />

      {/* Header */}
      <header className="site-header">
        <div className="header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Club Logo */}
            <Image
              src="/logo_Group.jpg"
              alt="โลโก้ชมรม"
              width={64}
              height={64}
              className="logo-img"
              priority
            />
            <div>
              <h1 className="site-title text-glow-orange">ท้าทายขีดจำกัดความเร็ว</h1>
              <p className="site-subtitle">⚡ Speed Challenge · 30-Second Sprint · Track &amp; Field</p>
            </div>
          </div>

          {/* Navigation tabs */}
          <nav className="nav-tabs" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="main-wrap">
        {/* Stat cards */}
        <div className="stat-grid">
          <StatCard
            label="ผู้เข้าร่วมทั้งหมด"
            icon="👟"
            value={totalParticipants}
            unit="คน"
            colorVar="--neon-orange"
            glowClass="text-glow-orange"
            variant="c-total"
          />
          <StatCard
            label="สถิติสูงสุด"
            icon="🚀"
            value={maxDistance}
            unit="เมตร (สูงสุด)"
            decimals={1}
            colorVar="--neon-green"
            glowClass="text-glow-green"
            variant="c-max"
          />
          <StatCard
            label="ระยะทางเฉลี่ย"
            icon="📊"
            value={avgDistance}
            unit="เมตร (เฉลี่ย)"
            decimals={2}
            colorVar="--neon-blue"
            variant="c-avg"
          />
        </div>

        {/* Search & Refresh */}
        <div className="lb-controls">
          <input
            type="search"
            className="search-input"
            placeholder="🔍 ค้นหา ชื่อ, คณะ, สาขา..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className={`btn-refresh ${refreshing ? 'spinning' : ''}`}
            onClick={handleRefresh}
          >
            <span className="refresh-icon" style={{ display: 'inline-block' }}>
              ↻
            </span>
            รีเฟรช
          </button>
        </div>

        {/* Register button */}
        <div style={{ marginBottom: 28 }}>
          <Link href="/register/" className="btn-register">
            📝 ลงทะเบียนเข้าร่วม
          </Link>
        </div>

        {/* Rankings */}
        {loading ? (
          <SkeletonRows count={5} />
        ) : (
          <div className="tab-panel active">
            {activeTab === 'leaderboard' && (
              <>
                {/* Top 5 Male & Female side-by-side */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28, marginBottom: 40 }}>
                  <RankingSection title="🏆 ชาย TOP 5" rows={men.slice(0, 5)} />
                  <RankingSection title="🏆 หญิง TOP 5" rows={women.slice(0, 5)} />
                </div>
                <RankingSection title="🏅 อันดับรวมทั้งหมด" rows={filteredRows} />
              </>
            )}

            {activeTab === 'male' && (
              <RankingSection title="👨 อันดับชาย" rows={filteredRows} />
            )}

            {activeTab === 'female' && (
              <RankingSection title="👩 อันดับหญิง" rows={filteredRows} />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <p>⚡ ท้าทายขีดจำกัดความเร็ว · Speed Challenge · 30-Second Sprint Record System</p>
      </footer>
    </>
  );
}
