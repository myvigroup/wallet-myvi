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

const BRAND_HEX: Record<string, string> = {
  "mitNORM":                "#001A53",
  "mitNORM Firmenberatung": "#32373C",
  "EnergyFinance":          "#07071A",
  "Das Karriere-Institut":  "#CC1426",
  "Wir:Personalberater":    "#699F5B",
  "myNORM":                 "#0E133E",
  "MYVI Group":             "#292525",
};

const DEFAULT_HEX = "#292525";

export function generateGoogleWalletUrl(data: GooglePassData): string {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID!;
  const serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL!;
  const privateKey = Buffer.from(
    process.env.GOOGLE_WALLET_PRIVATE_KEY!,
    "base64"
  ).toString("utf-8");

  const classId = `${issuerId}.myvi-visitenkarte`;
  const objectId = `${issuerId}.${data.serial.replace(/-/g, "_")}`;
  const bgColor = BRAND_HEX[data.abteilung] || DEFAULT_HEX;
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
        },
      ],
      genericObjects: [
        {
          id: objectId,
          classId,
          genericType: "GENERIC_TYPE_UNSPECIFIED",
          hexBackgroundColor: bgColor,
          logo: {
            sourceUri: {
              uri: `${baseUrl}/logo-white.png`,
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
