import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { deactivateGoogleWalletObject } from "@/lib/google-wallet";

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

  // Fetch pass_serial before deleting (needed to deactivate Google Wallet)
  const { data: card } = await supabaseAdmin
    .from("berater_cards")
    .select("pass_serial")
    .eq("id", params.id)
    .single();

  const { error } = await supabaseAdmin
    .from("berater_cards")
    .delete()
    .eq("id", params.id);

  if (error) {
    console.error("Admin delete error:", error);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }

  // Deactivate Google Wallet card (best-effort, don't fail if this errors)
  if (card?.pass_serial) {
    try {
      await deactivateGoogleWalletObject(card.pass_serial);
    } catch (e) {
      console.error("Google Wallet deactivation failed:", e);
    }
  }

  return NextResponse.json({ success: true });
}
