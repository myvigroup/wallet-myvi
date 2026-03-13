import { PKPass } from "passkit-generator";
import path from "path";
import fs from "fs";

export type PassData = {
  serial: string;
  vorname: string;
  nachname: string;
  titel: string;
  abteilung: string;
  telefon: string;
  mobil: string;
  email: string;
  website: string;
};

const BRAND_CONFIG: Record<string, {
  backgroundColor: string;
  foregroundColor: string;
  labelColor: string;
  logoText: string;
}> = {
  "mitNORM": {
    backgroundColor: "rgb(0, 26, 83)",
    foregroundColor: "rgb(255, 255, 255)",
    labelColor: "rgb(48, 188, 223)",
    logoText: "mitNORM",
  },
  "mitNORM Firmenberatung": {
    backgroundColor: "rgb(88, 148, 193)",
    foregroundColor: "rgb(255, 255, 255)",
    labelColor: "rgb(220, 240, 249)",
    logoText: "mitNORM Firmenberatung",
  },
  "EnergyFinance": {
    backgroundColor: "rgb(0, 80, 50)",
    foregroundColor: "rgb(255, 255, 255)",
    labelColor: "rgb(100, 200, 120)",
    logoText: "EnergyFinance",
  },
  "Das Karriere-Institut": {
    backgroundColor: "rgb(120, 30, 30)",
    foregroundColor: "rgb(255, 255, 255)",
    labelColor: "rgb(220, 160, 100)",
    logoText: "Das Karriere-Institut",
  },
  "Wir:Personalberater": {
    backgroundColor: "rgb(60, 40, 100)",
    foregroundColor: "rgb(255, 255, 255)",
    labelColor: "rgb(180, 150, 220)",
    logoText: "Wir:Personalberater",
  },
  "myNORM": {
    backgroundColor: "rgb(41, 37, 37)",
    foregroundColor: "rgb(255, 255, 255)",
    labelColor: "rgb(200, 184, 157)",
    logoText: "myNORM",
  },
  "MYVI Group (Holding)": {
    backgroundColor: "rgb(41, 37, 37)",
    foregroundColor: "rgb(255, 255, 255)",
    labelColor: "rgb(200, 184, 157)",
    logoText: "MYVI Group",
  },
};

const DEFAULT_BRAND = BRAND_CONFIG["myNORM"];

const BERATER_LABEL: Record<string, string> = {
  "MYVI Group (Holding)": "TEAM MYVI",
};

/**
 * Lädt Zertifikate:
 * - Lokal: direkt aus /certs/ (Dateien)
 * - Vercel/Prod: aus Umgebungsvariablen (Base64)
 */
function loadCertificates() {
  const isProduction =
    process.env.CERT_SIGNER_CERT &&
    process.env.CERT_SIGNER_KEY &&
    process.env.CERT_WWDR;

  if (isProduction) {
    return {
      wwdr: Buffer.from(process.env.CERT_WWDR!, "base64").toString("utf-8"),
      signerCert: Buffer.from(process.env.CERT_SIGNER_CERT!, "base64").toString("utf-8"),
      signerKey: Buffer.from(process.env.CERT_SIGNER_KEY!, "base64").toString("utf-8"),
      signerKeyPassphrase: process.env.PASS_PHRASE!,
    };
  }

  // Lokal: Zertifikate aus /certs/ lesen
  const certsDir = path.resolve(process.cwd(), "certs");
  return {
    wwdr: fs.readFileSync(path.join(certsDir, "wwdr.pem")),
    signerCert: fs.readFileSync(path.join(certsDir, "signerCert.pem")),
    signerKey: fs.readFileSync(path.join(certsDir, "signerKey.pem")),
    signerKeyPassphrase: process.env.PASS_PHRASE || "",
  };
}

/**
 * Erstellt einen Apple Wallet .pkpass Buffer
 */
export async function generatePass(data: PassData): Promise<Buffer> {
  const modelPath = path.resolve(process.cwd(), "passes", "visitenkarte.pass");
  const certificates = loadCertificates();
  const brand = BRAND_CONFIG[data.abteilung] || DEFAULT_BRAND;

  const pass = await PKPass.from(
    {
      model: modelPath,
      certificates,
    },
    {
      serialNumber: data.serial,
      passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID!,
      teamIdentifier: process.env.APPLE_TEAM_ID!,
      backgroundColor: brand.backgroundColor,
      foregroundColor: brand.foregroundColor,
      labelColor: brand.labelColor,
      logoText: brand.logoText,
    }
  );

  // Primärfeld: Name (groß, prominent)
  pass.primaryFields.push({
    key: "name",
    label: BERATER_LABEL[data.abteilung] || "BERATER",
    value: `${data.vorname} ${data.nachname}`,
  });

  // Sekundärfelder: Position (links) + Bereich (rechts)
  pass.secondaryFields.push({
    key: "titel",
    label: "POSITION",
    value: data.titel || "–",
    textAlignment: "PKTextAlignmentLeft" as const,
  });

  pass.secondaryFields.push({
    key: "abteilung",
    label: "BEREICH",
    value: data.abteilung || "–",
    textAlignment: "PKTextAlignmentRight" as const,
  });

  // Hilfsfelder: Telefon (links) + E-Mail (rechts)
  pass.auxiliaryFields.push({
    key: "telefon",
    label: "TELEFON",
    value: data.telefon || data.mobil || "–",
    textAlignment: "PKTextAlignmentLeft" as const,
  });

  pass.auxiliaryFields.push({
    key: "email",
    label: "E-MAIL",
    value: data.email || "–",
    textAlignment: "PKTextAlignmentRight" as const,
  });

  // Rückseite (detaillierte Infos)
  pass.backFields.push(
    {
      key: "back_name",
      label: "Name",
      value: `${data.vorname} ${data.nachname}`,
    },
    {
      key: "back_titel",
      label: "Position",
      value: data.titel || "",
    },
    {
      key: "back_abteilung",
      label: "Bereich",
      value: data.abteilung || "",
    },
    {
      key: "back_telefon",
      label: "Telefon",
      value: data.telefon || "",
      attributedValue: data.telefon
        ? `<a href='tel:${data.telefon.replace(/\s/g, "")}'>${data.telefon}</a>`
        : "",
    },
    {
      key: "back_mobil",
      label: "Mobil",
      value: data.mobil || "",
      attributedValue: data.mobil
        ? `<a href='tel:${data.mobil.replace(/\s/g, "")}'>${data.mobil}</a>`
        : "",
    },
    {
      key: "back_email",
      label: "E-Mail",
      value: data.email,
      attributedValue: `<a href='mailto:${data.email}'>${data.email}</a>`,
    },
    {
      key: "back_website",
      label: "Website",
      value: data.website || "www.myvi.de",
      attributedValue: `<a href='https://${data.website || "www.myvi.de"}'>${
        data.website || "www.myvi.de"
      }</a>`,
    }
  );

  // QR-Code: vCard Download → iPhone zeigt "Kontakt hinzufügen"
  pass.setBarcodes({
    message: `${process.env.NEXT_PUBLIC_BASE_URL || "https://wallet.myvi.de"}/api/vcard/${data.serial}`,
    format: "PKBarcodeFormatQR",
    messageEncoding: "iso-8859-1",
    altText: `${data.vorname} ${data.nachname}`,
  });

  return pass.getAsBuffer();
}
