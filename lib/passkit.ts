import { PKPass } from "passkit-generator";
import path from "path";
import fs from "fs";
import { DEFAULT_WEBSITE } from "./constants";

export type PassData = {
  serial: string;
  vorname: string;
  nachname: string;
  titel: string;
  abteilung: string;
  mobil: string;
  email: string;
  adresse: string;
  buchungslink: string;
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
    labelColor: "rgb(6, 186, 221)",
    logoText: "mitNORM",
  },
  "mitNORM Firmenberatung": {
    backgroundColor: "rgb(50, 55, 60)",
    foregroundColor: "rgb(255, 255, 255)",
    labelColor: "rgb(176, 223, 248)",
    logoText: "mitNORM Firmenberatung",
  },
  "EnergyFinance": {
    backgroundColor: "rgb(7, 7, 26)",
    foregroundColor: "rgb(255, 255, 255)",
    labelColor: "rgb(147, 196, 94)",
    logoText: "EnergyFinance",
  },
  "Das Karriere-Institut": {
    backgroundColor: "rgb(204, 20, 38)",
    foregroundColor: "rgb(255, 255, 255)",
    labelColor: "rgb(255, 210, 215)",
    logoText: "Das Karriere-Institut",
  },
  "Wir:Personalberater": {
    backgroundColor: "rgb(105, 159, 91)",
    foregroundColor: "rgb(255, 255, 255)",
    labelColor: "rgb(230, 255, 220)",
    logoText: "Wir:Personalberater",
  },
  "myNORM": {
    backgroundColor: "rgb(14, 19, 62)",
    foregroundColor: "rgb(255, 255, 255)",
    labelColor: "rgb(73, 172, 143)",
    logoText: "myNORM",
  },
  "MYVI Group": {
    backgroundColor: "rgb(41, 37, 37)",
    foregroundColor: "rgb(255, 255, 255)",
    labelColor: "rgb(200, 184, 157)",
    logoText: "MYVI Group",
  },
};

const DEFAULT_BRAND = BRAND_CONFIG["MYVI Group"];

const BERATER_LABEL: Record<string, string> = {
  "mitNORM":                "FINANCIAL GUIDE",
  "mitNORM Firmenberatung": "FIRMENBERATER",
  "EnergyFinance":          "ENERGIEBERATER",
  "Das Karriere-Institut":  "KARRIERE COACH",
  "Wir:Personalberater":    "KEY ACCOUNT",
  "myNORM":                 "MYNORM BERATER",
  "MYVI Group":             "TEAM MYVI",
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

const MODEL_PATH = path.resolve(process.cwd(), "passes", "visitenkarte.pass");

const TRANSPARENT_1PX_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB" +
  "Nl7BcQAAAABJRU5ErkJggg==",
  "base64"
);

let _cachedCerts: ReturnType<typeof loadCertificates> | null = null;
function getCertificates() {
  if (!_cachedCerts) _cachedCerts = loadCertificates();
  return _cachedCerts;
}

/**
 * Erstellt einen Apple Wallet .pkpass Buffer
 */
export async function generatePass(data: PassData): Promise<Buffer> {
  const brand = BRAND_CONFIG[data.abteilung] || DEFAULT_BRAND;

  const pass = await PKPass.from(
    {
      model: MODEL_PATH,
      certificates: getCertificates(),
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

  // Tochterfirmen: MYVI-Logo entfernen (durch transparentes 1x1 PNG ersetzen)
  if (data.abteilung !== "MYVI Group") {
    pass.addBuffer("logo.png", TRANSPARENT_1PX_PNG);
    pass.addBuffer("logo@2x.png", TRANSPARENT_1PX_PNG);
  }

  // Primärfeld: Name (groß, prominent)
  pass.primaryFields.push({
    key: "name",
    label: BERATER_LABEL[data.abteilung] || "BERATER",
    value: `${data.vorname} ${data.nachname}`,
  });

  // Sekundärfelder: Position (links) + Firma (rechts)
  pass.secondaryFields.push({
    key: "titel",
    label: "POSITION",
    value: data.titel || "–",
    textAlignment: "PKTextAlignmentLeft" as const,
  });

  pass.secondaryFields.push({
    key: "abteilung",
    label: "FIRMA",
    value: data.abteilung || "–",
    textAlignment: "PKTextAlignmentRight" as const,
  });

  // Hilfsfelder: Mobil (links) + E-Mail (rechts)
  pass.auxiliaryFields.push({
    key: "mobil",
    label: "MOBIL",
    value: data.mobil || "–",
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
      label: "Firma",
      value: data.abteilung || "",
    },
    {
      key: "back_mobil",
      label: "Mobilnummer",
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
      key: "back_adresse",
      label: "Adresse",
      value: data.adresse || "",
    },
    {
      key: "back_buchungslink",
      label: "Termin buchen",
      value: data.buchungslink || "",
      attributedValue: data.buchungslink
        ? `<a href='${data.buchungslink}'>Termin buchen</a>`
        : "",
    },
    {
      key: "back_website",
      label: "Website",
      value: data.website || DEFAULT_WEBSITE,
      attributedValue: `<a href='https://${data.website || DEFAULT_WEBSITE}'>${
        data.website || DEFAULT_WEBSITE
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
