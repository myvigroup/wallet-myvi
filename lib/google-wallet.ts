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

function getCredentials() {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID!;
  const serviceAccountEmail = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL!;
  const privateKey = Buffer.from(
    process.env.GOOGLE_WALLET_PRIVATE_KEY!,
    "base64"
  ).toString("utf-8");
  return { issuerId, serviceAccountEmail, privateKey };
}

async function getAccessToken(): Promise<string> {
  const { serviceAccountEmail, privateKey } = getCredentials();
  const now = Math.floor(Date.now() / 1000);
  const authJwt = jwt.sign(
    {
      iss: serviceAccountEmail,
      scope: "https://www.googleapis.com/auth/wallet_object.issuer",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    },
    privateKey,
    { algorithm: "RS256" }
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${authJwt}`,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Auth failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

function buildObjectPayload(data: GooglePassData) {
  const { issuerId } = getCredentials();
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

  return {
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
    ...(data.titel ? {
      subheader: {
        defaultValue: { language: "de", value: data.titel },
      },
    } : {}),
    header: {
      defaultValue: { language: "de", value: `${data.vorname} ${data.nachname}` },
    },
    barcode: {
      type: "QR_CODE",
      value: `${baseUrl}/api/vcard/${data.serial}`,
      alternateText: `${data.vorname} ${data.nachname}`,
    },
    textModulesData: textModules,
  };
}

export async function createGoogleWalletUrl(data: GooglePassData): Promise<string> {
  const accessToken = await getAccessToken();
  const objectPayload = buildObjectPayload(data);
  const objectId = objectPayload.id;

  // Try to create object; if it exists (409), update it
  const createRes = await fetch(
    "https://walletobjects.googleapis.com/walletobjects/v1/genericObject",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(objectPayload),
    }
  );

  if (createRes.status === 409) {
    // Object exists — update it
    const updateRes = await fetch(
      `https://walletobjects.googleapis.com/walletobjects/v1/genericObject/${objectId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(objectPayload),
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.json();
      throw new Error(`Object update failed: ${JSON.stringify(err)}`);
    }
  } else if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(`Object create failed: ${JSON.stringify(err)}`);
  }

  // Generate a thin save JWT that just references the object
  const { serviceAccountEmail, privateKey } = getCredentials();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://wallet.myvi.de";

  const token = jwt.sign(
    {
      iss: serviceAccountEmail,
      aud: "google",
      origins: [baseUrl],
      typ: "savetowallet",
      payload: {
        genericObjects: [{ id: objectId }],
      },
    },
    privateKey,
    { algorithm: "RS256" }
  );

  return `https://pay.google.com/gp/v/save/${token}`;
}
