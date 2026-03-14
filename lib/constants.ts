export const ALLOWED_DOMAINS = [
  "mitnorm.com",
  "myvi.de",
  "wirpersonalberater.de",
  "daskarriereinstitut.de",
  "mynorm.de",
];

export const DEFAULT_WEBSITE = "www.myvi.de";

export function composeAddress(strasse?: string, plz?: string, ort?: string): string {
  return [strasse, [plz, ort].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}
