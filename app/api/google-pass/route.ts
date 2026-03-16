import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createGoogleWalletUrl } from "@/lib/google-wallet";
import { supabaseAdmin } from "@/lib/supabase";
import { ALLOWED_DOMAINS, DEFAULT_WEBSITE, composeAddress } from "@/lib/constants";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vorname, nachname, titel, abteilung, mobil, email, strasse, plz, ort, buchungslink, website } = body;

    if (!vorname || !nachname || !email) {
      return NextResponse.json(
        { error: "Vorname, Nachname und E-Mail sind Pflichtfelder." },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Ungültige E-Mail-Adresse." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const domain = normalizedEmail.split("@")[1];

    if (!ALLOWED_DOMAINS.includes(domain)) {
      return NextResponse.json(
        { error: "Bitte verwende deine Firmen-E-Mail-Adresse (@mitnorm.com, @myvi.de, etc.)." },
        { status: 400 }
      );
    }

    const cardData = {
      vorname,
      nachname,
      titel: titel || null,
      abteilung: abteilung || null,
      mobil: mobil || null,
      strasse: strasse || null,
      plz: plz || null,
      ort: ort || null,
      buchungslink: buchungslink || null,
      website: website || DEFAULT_WEBSITE,
    };

    const fullAdresse = composeAddress(strasse, plz, ort);

    const { data: existingCard } = await supabaseAdmin
      .from("berater_cards")
      .select("pass_serial, pass_version")
      .eq("email", normalizedEmail)
      .single();

    let serial: string;

    if (existingCard) {
      serial = existingCard.pass_serial;
      const { error } = await supabaseAdmin
        .from("berater_cards")
        .update({ ...cardData, pass_version: existingCard.pass_version + 1 })
        .eq("email", normalizedEmail);

      if (error) {
        console.error("Supabase Update Error:", error);
        return NextResponse.json(
          { error: "Datenbankfehler beim Aktualisieren." },
          { status: 500 }
        );
      }
    } else {
      serial = uuidv4();
      const { error } = await supabaseAdmin.from("berater_cards").insert({
        ...cardData,
        email: normalizedEmail,
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

    const saveUrl = await createGoogleWalletUrl({
      serial,
      vorname,
      nachname,
      titel: titel || "",
      abteilung: abteilung || "",
      mobil: mobil || "",
      adresse: fullAdresse,
      buchungslink: buchungslink || "",
      email: normalizedEmail,
      website: website || DEFAULT_WEBSITE,
    });

    return NextResponse.json({ url: saveUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Google Wallet Error:", message);
    return NextResponse.json(
      { error: `Google Wallet Fehler: ${message}` },
      { status: 500 }
    );
  }
}
