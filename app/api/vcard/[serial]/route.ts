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

  if (!data) return new Response("Not found", { status: 404 });

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
