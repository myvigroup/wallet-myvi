import jwt from "jsonwebtoken";
import { DEFAULT_WEBSITE } from "./constants";

export type GooglePassData = {
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

const BRAND_CONFIG: Record<string, { hex: string; logo: string }> = {
  "mitNORM":                { hex: "#001A53", logo: "/logo-mitnorm.png" },
  "mitNORM Firmenberatung": { hex: "#32373C", logo: "/logo-firmenberatung.png" },
  "EnergyFinance":          { hex: "#07071A", logo: "/logo-energyfinance.png" },
  "Das Karriere-Institut":  { hex: "#CC1426", logo: "/logo-karriereinstitut.png" },
  "Wir:Personalberater":    { hex: "#699F5B", logo: "/logo-wirpersonalberater.png" },
  "myNORM":                 { hex: "#0E133E", logo: "/logo-mitnorm.png" },
  "MYVI Group":             { hex: "#292525", logo: "/logo-myvi.png" },
};

const DEFAULT_BRAND = { hex: "#292525", logo: "/logo-myvi.png" };

export function generateGoogleWalletUrl(data: GooglePassData): string {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID!;
  const serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL!;
  const privateKey = Buffer.from(
    process.env.GOOGLE_WALLET_PRIVATE_KEY!,
    "base64"
  ).toString("utf-8");

  const classId = `${issuerId}.myvi-visitenkarte`;
  const objectId = `${issuerId}.${data.serial.replace(/-/g, "_")}`;
  const brand = BRAND_CONFIG[data.abteilung] || DEFAULT_BRAND;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://wallet.myvi.de";

  const textModules = [
    { id: "position", header: "Position", body: data.titel || "–" },
    { id: "firma", header: "Firma", body: data.abteilung || "–" },
    { id: "mobil", header: "Mobil", body: data.mobil || "–" },
    { id: "email", header: "E-Mail", body: data.email },
    data.adresse ? { id: "adresse", header: "Adresse", body: data.adresse } : null,
    data.buchungslink ? { id: "buchung", header: "Termin buchen", body: data.buchungslink } : null,
    { id: "website", header: "Website", body: data.website || DEFAULT_WEBSITE },
  ].filter(Boolean);

  const payload = {
    iss: serviceAccountEmail,
    aud: "google",
    origins: [baseUrl],
    typ: "savetowallet",
    payload: {
      genericClasses: [
        {
          id: classId,
          issuerName: "MYVI Group",
          multipleDevicesAndHoldersAllowedStatus: "MULTIPLE_HOLDERS",
        },
      ],
      genericObjects: [
        {
          id: objectId,
          classId,
          state: "ACTIVE",
          hexBackgroundColor: brand.hex,
          logo: {
            sourceUri: {
              uri: `${baseUrl}${brand.logo}`,
            },
          },
          cardTitle: {
            defaultValue: { language: "de", value: data.abteilung || "MYVI Group" },
          },
          subheader: {
            defaultValue: { language: "de", value: data.titel || "" },
          },
          header: {
            defaultValue: { language: "de", value: `${data.vorname} ${data.nachname}` },
          },
          barcode: {
            type: "QR_CODE",
            value: `${baseUrl}/api/vcard/${data.serial}`,
            alternateText: `${data.vorname} ${data.nachname}`,
          },
          textModulesData: textModules,
        },
      ],
    },
  };

  const token = jwt.sign(payload, privateKey, { algorithm: "RS256" });
  return `https://pay.google.com/gp/v/save/${token}`;
}
