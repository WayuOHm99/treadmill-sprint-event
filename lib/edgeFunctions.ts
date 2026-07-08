const FUNCTIONS_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;

async function callFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${FUNCTIONS_BASE}/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || `เกิดข้อผิดพลาด (${res.status})`);
  }
  return json as T;
}

export interface StaffSearchResult {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  gender: 'male' | 'female';
  distance_m: number | null;
  photo_url: string | null;
}

export function staffSearch(secret: string, query: string) {
  return callFunction<{ results: StaffSearchResult[] }>('staff-search', { secret, query });
}

export function staffSubmitResult(
  secret: string,
  id: string,
  distance_m: number,
  source: 'manual' | 'device'
) {
  return callFunction<{ ok: true; participant: StaffSearchResult }>('staff-submit-result', {
    secret,
    id,
    distance_m,
    source,
  });
}

export interface StaffExportRow {
  student_id: string;
  first_name: string;
  last_name: string;
  year_level: number;
  faculty: string;
  department: string;
  phone: string;
  gender: 'male' | 'female';
  distance_m: number | null;
  result_source: string | null;
  created_at: string;
}

export function staffExport(secret: string) {
  return callFunction<{ rows: StaffExportRow[] }>('staff-export', { secret });
}
