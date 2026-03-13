import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: { serial: string } }
) {
  const { data } = await supabaseAdmin
    .from("berater_cards")
    .select("*")
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
    `URL:https://${data.website || "www.myvi.de"}`,
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
