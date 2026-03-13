import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { generatePass } from "@/lib/passkit";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vorname, nachname, titel, abteilung, telefon, mobil, email, adresse, website } = body;

    // Pflichtfelder prüfen
    if (!vorname || !nachname || !email) {
      return NextResponse.json(
        { error: "Vorname, Nachname und E-Mail sind Pflichtfelder." },
        { status: 400 }
      );
    }

    // E-Mail-Format prüfen
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Ungültige E-Mail-Adresse." },
        { status: 400 }
      );
    }

    // Prüfen ob E-Mail bereits existiert → Pass aktualisieren
    const { data: existingCard } = await supabaseAdmin
      .from("berater_cards")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    let serial: string;

    if (existingCard) {
      // Existierenden Pass aktualisieren
      serial = existingCard.pass_serial;
      await supabaseAdmin
        .from("berater_cards")
        .update({
          vorname,
          nachname,
          titel: titel || null,
          abteilung: abteilung || null,
          telefon: telefon || null,
          mobil: mobil || null,
          adresse: adresse || null,
          website: website || "www.myvi.de",
          pass_version: existingCard.pass_version + 1,
        })
        .eq("email", email.toLowerCase());
    } else {
      // Neuen Pass erstellen
      serial = uuidv4();
      const { error } = await supabaseAdmin.from("berater_cards").insert({
        vorname,
        nachname,
        titel: titel || null,
        abteilung: abteilung || null,
        telefon: telefon || null,
        mobil: mobil || null,
        adresse: adresse || null,
        email: email.toLowerCase(),
        website: website || "www.myvi.de",
        pass_serial: serial,
      });

      if (error) {
        console.error("Supabase Insert Error:", error);
        return NextResponse.json(
          { error: "Datenbankfehler beim Speichern." },
          { status: 500 }
        );
      }
    }

    // .pkpass generieren
    const passBuffer = await generatePass({
      serial,
      vorname,
      nachname,
      titel: titel || "",
      abteilung: abteilung || "",
      telefon: telefon || "",
      mobil: mobil || "",
      adresse: adresse || "",
      email: email.toLowerCase(),
      website: website || "www.myvi.de",
    });

    const filename = `${vorname}-${nachname}-Visitenkarte.pkpass`
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue");

    // .pkpass zurückgeben
    const arrayBuffer = new ArrayBuffer(passBuffer.length);
    new Uint8Array(arrayBuffer).set(passBuffer);
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : "";
    console.error("Pass Generation Error:", message, stack);
    return NextResponse.json(
      { error: `Pass-Fehler: ${message}` },
      { status: 500 }
    );
  }
}
