import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function checkPassword(req: NextRequest): boolean {
  const pw = req.headers.get("x-admin-password");
  return pw === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkPassword(req)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("berater_cards")
    .select("id, vorname, nachname, abteilung, titel, email, mobil, pass_version, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin cards fetch error:", error);
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }

  return NextResponse.json(data);
}
