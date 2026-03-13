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

  const pass = await PKPass.from(
    {
      model: modelPath,
      certificates,
    },
    {
      // Pflichtfelder überschreiben
      serialNumber: data.serial,
      passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID!,
      teamIdentifier: process.env.APPLE_TEAM_ID!,
    }
  );

  // Primärfeld: Name (groß, prominent)
  pass.primaryFields.push({
    key: "name",
    label: "BERATER",
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

  // QR-Code: Link zur digitalen Profilseite
  pass.setBarcodes({
    message: `${process.env.NEXT_PUBLIC_BASE_URL || "https://wallet.myvi.de"}/berater/${data.serial}`,
    format: "PKBarcodeFormatQR",
    messageEncoding: "iso-8859-1",
    altText: `${data.vorname} ${data.nachname}`,
  });

  return pass.getAsBuffer();
}
