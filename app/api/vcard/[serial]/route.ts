import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { DEFAULT_WEBSITE } from "@/lib/constants";

export async function GET(
  req: NextRequest,
  { params }: { params: { serial: string } }
) {
  const { data } = await supabaseAdmin
    .from("berater_cards")
    .select("vorname, nachname, abteilung, titel, mobil, telefon, email, strasse, ort, plz, website")
    .eq("pass_serial", params.serial)
    .single();

  if (!data) {
    const html = `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Visitenkarte nicht verfügbar</title>
<style>body{font-family:-apple-system,sans-serif;background:#111;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{text-align:center;padding:40px;max-width:400px}.card h1{font-size:20px;margin-bottom:12px;color:#c8b89d}
.card p{color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6}</style>
</head><body><div class="card"><h1>Visitenkarte nicht mehr verfügbar</h1>
<p>Diese digitale Visitenkarte wurde deaktiviert und ist nicht mehr abrufbar.</p></div></body></html>`;
    return new Response(html, {
      status: 410,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${data.vorname} ${data.nachname}`,
    `N:${data.nachname};${data.vorname};;;`,
    `ORG:MYVI Group;${data.abteilung || ""}`,
    `TITLE:${data.titel || ""}`,
    data.mobil ? `TEL;TYPE=CELL:${data.mobil}` : "",
    data.telefon ? `TEL;TYPE=WORK:${data.telefon}` : "",
    `EMAIL;TYPE=WORK:${data.email}`,
    data.strasse || data.ort ? `ADR;TYPE=WORK:;;${data.strasse || ""};${data.ort || ""};;${data.plz || ""};` : "",
    `URL:https://${data.website || DEFAULT_WEBSITE}`,
    "NOTE:MYVI Financial Guidance Group",
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new Response(vcard, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${data.vorname}-${data.nachname}.vcf"`,
      "Cache-Control": "no-cache",
    },
  });
}
