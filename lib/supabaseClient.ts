import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This client only ever uses the public anon/publishable key.
// It can INSERT new registrations (restricted columns, enforced by DB grants)
// and SELECT from `leaderboard_view` (safe columns only).
// It can never read phone numbers / student IDs, and can never write a result -
// those go through the staff Edge Functions with the shared staff secret.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export type Gender = 'male' | 'female';

export interface LeaderboardRow {
  id: string;
  first_name: string;
  last_name: string;
  faculty: string;
  department: string;
  gender: Gender;
  photo_url: string | null;
  distance_m: number;
}

export interface RegistrationInput {
  student_id: string;
  first_name: string;
  last_name: string;
  year_level: number;
  faculty: string;
  department: string;
  phone: string;
  gender: Gender;
  photo_url: string | null;
}
