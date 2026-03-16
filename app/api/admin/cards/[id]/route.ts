import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

function checkPassword(req: NextRequest): boolean {
  const pw = req.headers.get("x-admin-password");
  return pw === process.env.ADMIN_PASSWORD;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!checkPassword(req)) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const { error } = await supabaseAdmin
    .from("berater_cards")
    .delete()
    .eq("id", params.id);

  if (error) {
    console.error("Admin delete error:", error);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
