'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import QRCode from 'qrcode';
import { supabase, LeaderboardRow } from '@/lib/supabaseClient';
import { staffSearch } from '@/lib/edgeFunctions';
import { getStaffKey, saveStaffKey, clearStaffKey } from '@/lib/staffKey';

/* ============================================================
   REGISTER QR — corner badge on the big screen
============================================================ */
function RegisterQR() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, `${window.location.origin}/register/`, {
        width: 130, margin: 1,
        color: { dark: '#0B0F1A', light: '#FFFFFF' },
      });
    }
  }, [open]);
  return (
    <div style={{ position: 'fixed', right: 14, bottom: 14, zIndex: 20, textAlign: 'right' }}>
      {open && (
        <div style={{
          background: '#fff', borderRadius: 12, padding: '8px 8px 4px',
          border: '2px solid var(--neon-orange)', textAlign: 'center',
          boxShadow: '0 0 20px rgba(255,107,0,0.4)', marginBottom: 8,
        }}>
          <canvas ref={canvasRef} />
          <div style={{ color: '#0B0F1A', fontWeight: 700, fontSize: '0.72rem', paddingBottom: 2 }}>
            สแกนเพื่อร่วมวิ่ง
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: 'linear-gradient(90deg, #FF6B00, #FFA500)', color: '#0B1120',
          border: 'none', borderRadius: 99, padding: '8px 16px',
          fontFamily: 'Kanit, sans-serif', fontWeight: 700, fontSize: '0.85rem',
          cursor: 'pointer', boxShadow: '0 2px 14px rgba(255,107,0,0.45)',
        }}
      >
        {open ? '✕ ซ่อน QR' : '📱 QR ลงทะเบียน'}
      </button>
    </div>
  );
}

/* ============================================================
   LATEST RESULT BANNER — pops for ~10s when a result is saved
============================================================ */
function LatestBanner({ row }: { row: LeaderboardRow }) {
  return (
    <div style={{
      position: 'fixed', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 30,
      display: 'flex', alignItems: 'center', gap: 14,
      background: 'linear-gradient(90deg, rgba(255,107,0,0.95), rgba(255,165,0,0.95))',
      color: '#0B1120', borderRadius: 99, padding: '10px 24px',
      boxShadow: '0 4px 30px rgba(255,107,0,0.6)',
      animation: 'fadeInUp 0.35s ease', whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: '1.5rem' }}>🎉</span>
      <span style={{ fontWeight: 700 }}>
        {row.first_name} {row.last_name} วิ่งได้ {row.distance_m.toFixed(1)} เมตร!
      </span>
    </div>
  );
}

/* ============================================================
   HIDDEN STAFF MENU — subtle gear, PIN once per device
============================================================ */
function StaffGear() {
  const [unlocked, setUnlocked] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => { setUnlocked(!!getStaffKey(null)); }, []);

  async function onGearClick() {
    if (unlocked) { setOpen((o) => !o); return; }
    const pin = window.prompt('รหัสสตาฟ:');
    if (!pin) return;
    try {
      await staffSearch(pin.trim(), 'ping'); // validates against the server
      saveStaffKey(pin.trim());
      setUnlocked(true);
      setOpen(true);
    } catch {
      window.alert('รหัสไม่ถูกต้อง');
    }
  }

  const linkStyle: React.CSSProperties = {
    display: 'block', padding: '8px 14px', color: '#E5E7EB',
    textDecoration: 'none', fontSize: '0.85rem', whiteSpace: 'nowrap',
  };

  return (
    <span style={{ position: 'fixed', left: 10, bottom: 10, zIndex: 20 }}>
      <button
        onClick={onGearClick}
        aria-label="staff"
        style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.25, fontSize: '0.85rem', padding: 4 }}
      >
        ⚙
      </button>
      {open && unlocked && (
        <span style={{
          position: 'absolute', bottom: '130%', left: 0, zIndex: 40,
          background: 'var(--bg-card2)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 6, boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
        }}>
          <Link href="/staff/results/" style={linkStyle}>⏱️ บันทึกผลการวิ่ง</Link>
          <Link href="/staff/export/" style={linkStyle}>📥 Export ข้อมูล</Link>
          <button
            onClick={() => { clearStaffKey(); setUnlocked(false); setOpen(false); }}
            style={{ ...linkStyle, background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', width: '100%', textAlign: 'left' }}
          >
            ออกจากโหมดสตาฟ
          </button>
        </span>
      )}
    </span>
  );
}

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
   HEADER STAT BADGE — compact stat display in header
============================================================ */
function HeaderStat({ icon, label, value, decimals = 0, colorVar }: {
  icon: string;
  label: string;
  value: number;
  decimals?: number;
  colorVar: string;
}) {
  const display = useCountUp(value, decimals);
  return (
    <div className="header-stat">
      <span className="header-stat-icon">{icon}</span>
      <div>
        <div className="header-stat-value" style={{ color: `var(${colorVar})` }}>{display}</div>
        <div className="header-stat-label">{label}</div>
      </div>
    </div>
  );
}

/* ============================================================
   PROFILE AVATAR — shows photo or fallback
============================================================ */
function ProfileAvatar({ photoUrl, name, size }: {
  photoUrl: string | null;
  name: string;
  size: 'lg' | 'md' | 'sm';
}) {
  const sizeClass = size === 'lg' ? 'avatar-lg' : size === 'md' ? 'avatar-md' : 'avatar-sm';

  if (photoUrl) {
    return (
      <div className={`rc-avatar ${sizeClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl} alt={name} className="rc-avatar-img" />
      </div>
    );
  }

  // Fallback: first letter
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  return (
    <div className={`rc-avatar rc-avatar-fallback ${sizeClass}`}>
      {initial}
    </div>
  );
}

/* ============================================================
   RANK CARD — renders ranking items with photos + medals
============================================================ */
function RankCard({ row, rank, maxDist }: { row: LeaderboardRow; rank: number; maxDist: number }) {
  const barRef = useRef<HTMLDivElement>(null);
  const dist = row.distance_m;
  const pct = maxDist > 0 ? ((dist / maxDist) * 100).toFixed(1) : '0';
  const firstName = row.first_name;
  const fullName = `${firstName} ${row.last_name}`;
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
          <div className="rc-avatar-wrap">
            <ProfileAvatar photoUrl={row.photo_url} name={fullName} size="lg" />
            <span className="medal-overlay">{medals[0]}</span>
          </div>
          <div className="rc-info">
            <div className="rc-name">{fullName}</div>
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
          <div className="rc-avatar-wrap">
            <ProfileAvatar photoUrl={row.photo_url} name={fullName} size="md" />
            <span className="medal-overlay">{medals[1]}</span>
          </div>
          <div className="rc-info">
            <div className="rc-name">{fullName}</div>
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
          <div className="rc-avatar-wrap">
            <ProfileAvatar photoUrl={row.photo_url} name={fullName} size="sm" />
            <span className="medal-overlay">{medals[2]}</span>
          </div>
          <div className="rc-info">
            <div className="rc-name">{fullName}</div>
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
        <div className="rc-avatar-wrap">
          <ProfileAvatar photoUrl={row.photo_url} name={fullName} size="sm" />
          <span className="rank-num-overlay">{rank}</span>
        </div>
        <div className="rc-info">
          <div className="rc-name">{fullName}</div>
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
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <h3 className="section-title">{title}</h3>
        <div className="empty-state">
          <div className="empty-icon">🏟️</div>
          <p className="empty-text">ยังไม่มีข้อมูลการแข่งขัน</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
  const [latest, setLatest] = useState<LeaderboardRow | null>(null);
  const latestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leaderboard_public' }, (payload) => {
        load();
        const n = payload.new as LeaderboardRow | undefined;
        if (n && n.distance_m > 0) {
          setLatest(n);
          if (latestTimer.current) clearTimeout(latestTimer.current);
          latestTimer.current = setTimeout(() => setLatest(null), 10000);
        }
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

  // Active tab rows
  const activeRows = useMemo(() => {
    switch (activeTab) {
      case 'male':
        return men;
      case 'female':
        return women;
      default:
        return withDistance;
    }
  }, [activeTab, men, women, withDistance]);

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
      <RegisterQR />
      <StaffGear />
      {latest && <LatestBanner row={latest} />}

      {/* Header */}
      <header className="site-header">
        <div className="header-inner header-flex">
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

          {/* Stats in header & Tabs */}
          <div className="header-stats">
            {/* Navigation tabs as Pill buttons */}
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

            <div className="header-stat-divider hide-mobile" />

            <HeaderStat
              icon="👟"
              label="ผู้เข้าร่วม"
              value={totalParticipants}
              colorVar="--neon-orange"
            />
            <div className="header-stat-divider" />
            <HeaderStat
              icon="🚀"
              label="สถิติสูงสุด"
              value={maxDistance}
              decimals={1}
              colorVar="--neon-green"
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="main-wrap">
        {/* Rankings */}
        {loading ? (
          <SkeletonRows count={5} />
        ) : (
          <div className="tab-panel active">
            {activeTab === 'leaderboard' && (
              <div className="lb-scroll-wrapper">
                {/* Side-by-side Top 5 Male & Female */}
                <div className="lb-grid-2">
                  <RankingSection title="🏆 ชาย TOP 5" rows={men.slice(0, 5)} />
                  <RankingSection title="🏆 หญิง TOP 5" rows={women.slice(0, 5)} />
                </div>
                {/* Overall below */}
                <div className="lb-overall-section">
                  <RankingSection title="🏅 อันดับรวมทั้งหมด" rows={activeRows} />
                </div>
              </div>
            )}

            {activeTab === 'male' && (
              <div className="lb-scroll-wrapper">
                <RankingSection title="👨 อันดับชายทั้งหมด" rows={activeRows} />
              </div>
            )}

            {activeTab === 'female' && (
              <div className="lb-scroll-wrapper">
                <RankingSection title="👩 อันดับหญิงทั้งหมด" rows={activeRows} />
              </div>
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
