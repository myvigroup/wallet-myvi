import { createClient } from "@supabase/supabase-js";

// Client-seitiger Supabase Client (Anon Key)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Server-seitiger Supabase Client (Service Key – nur in API Routes!)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export type BeraterCard = {
  id: string;
  created_at: string;
  vorname: string;
  nachname: string;
  titel: string | null;
  abteilung: string | null;
  telefon: string | null;
  mobil: string | null;
  email: string;
  website: string;
  pass_serial: string;
  pass_version: number;
  aktiv: boolean;
};
