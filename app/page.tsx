"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { ALLOWED_DOMAINS, DEFAULT_WEBSITE } from "@/lib/constants";

const ALLE_MARKEN = [
  "mitNORM",
  "mitNORM Firmenberatung",
  "EnergyFinance",
  "Das Karriere-Institut",
  "Wir:Personalberater",
  "myNORM",
  "MYVI Group",
] as const;

const INTERN_ONLY = new Set(["myNORM", "MYVI Group"]);
const BERATER_MARKEN = ALLE_MARKEN.filter((m) => !INTERN_ONLY.has(m));

const PREVIEW_COLORS: Record<string, { bg: string; accent: string }> = {
  "mitNORM":                { bg: "#001A53", accent: "#06BADD" },
  "mitNORM Firmenberatung": { bg: "#32373C", accent: "#B0DFF8" },
  "EnergyFinance":          { bg: "#07071A", accent: "#93C45E" },
  "Das Karriere-Institut":  { bg: "#CC1426", accent: "#ffffff" },
  "Wir:Personalberater":    { bg: "#699F5B", accent: "#ffffff" },
  "myNORM":                 { bg: "#0E133E", accent: "#49AC8F" },
  "MYVI Group":             { bg: "#292525", accent: "#c8b89d" },
};

const DEFAULT_PREVIEW = { bg: "#292525", accent: "#c8b89d" };

export default function Home() {
  const [form, setForm] = useState({
    vorname: "",
    nachname: "",
    titel: "",
    abteilung: "",
    mobil: "",
    email: "",
    strasse: "",
    plz: "",
    ort: "",
    buchungslink: "",
    website: DEFAULT_WEBSITE,
  });
  const [modus, setModus] = useState<"berater" | "intern">("berater");
  const [internUnlocked, setInternUnlocked] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const abteilungen = modus === "berater" ? BERATER_MARKEN : ALLE_MARKEN;

  const handleModusChange = (newModus: "berater" | "intern") => {
    if (newModus === "intern" && !internUnlocked) {
      setShowPasswordPrompt(true);
      setPasswordInput("");
      setPasswordError(false);
      return;
    }
    setModus(newModus);
    setForm((prev) => ({ ...prev, abteilung: "", titel: "" }));
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === process.env.NEXT_PUBLIC_INTERN_PASSWORD) {
      setInternUnlocked(true);
      setShowPasswordPrompt(false);
      setModus("intern");
      setForm((prev) => ({ ...prev, abteilung: "", titel: "" }));
    } else {
      setPasswordError(true);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "abteilung") {
      setForm((prev) => ({ ...prev, abteilung: value, titel: "" }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    setError("");
  };

  const showTitel = !!form.abteilung;

  const validateForm = (): boolean => {
    const domain = form.email.toLowerCase().split("@")[1];
    if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
      setError("Bitte verwende deine Firmen-E-Mail-Adresse (@mitnorm.com, @myvi.de, etc.).");
      return false;
    }
    return true;
  };

  const handleAppleWallet = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/pass/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Unbekannter Fehler");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${form.vorname}-${form.nachname}-Visitenkarte.pkpass`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleWallet = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/google-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unbekannter Fehler");

      window.open(data.url, "_blank");
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const colors = PREVIEW_COLORS[form.abteilung] || DEFAULT_PREVIEW;

  if (success) {
    return (
      <main className={styles.main}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✓</div>
          <h2>Visitenkarte erstellt!</h2>
          <p>
            Deine digitale Visitenkarte wurde heruntergeladen.
            <br />
            <strong>Auf dem iPhone:</strong> Die .pkpass-Datei öffnen → Wallet fügt sie automatisch hinzu.
          </p>
          <div className={styles.successSteps}>
            <div className={styles.step}>
              <span>1</span>
              <p>Datei in Downloads öffnen</p>
            </div>
            <div className={styles.step}>
              <span>2</span>
              <p>„Zu Wallet hinzufügen" tippen</p>
            </div>
            <div className={styles.step}>
              <span>3</span>
              <p>Fertig – Karte ist im Wallet!</p>
            </div>
          </div>
          <button
            className={styles.btnSecondary}
            onClick={() => setSuccess(false)}
          >
            Neue Visitenkarte erstellen
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <img src="/logo-white.png" alt="MYVI Group" className={styles.logoImg} />
          <div>
            <p className={styles.logoSub}>MYVI Group</p>
            <h1 className={styles.headline}>Digitale Visitenkarte</h1>
          </div>
        </header>

        <p className={styles.subline}>
          Trage deine Daten ein und erhalte sofort deine persönliche
          Apple Wallet Visitenkarte.
        </p>

        {/* Modus Toggle */}
        <div className={styles.modusToggle}>
          <button
            type="button"
            className={`${styles.modusBtn} ${modus === "berater" ? styles.modusBtnActive : ""}`}
            onClick={() => handleModusChange("berater")}
          >
            Berater
          </button>
          <button
            type="button"
            className={`${styles.modusBtn} ${modus === "intern" ? styles.modusBtnActive : ""}`}
            onClick={() => handleModusChange("intern")}
          >
            Internes Team
          </button>
        </div>

        {/* Password Prompt */}
        {showPasswordPrompt && (
          <div className={styles.passwordOverlay}>
            <div className={styles.passwordCard}>
              <h3>Interner Bereich</h3>
              <p>Bitte Passwort eingeben:</p>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                placeholder="Passwort"
                autoFocus
              />
              {passwordError && (
                <span className={styles.passwordError}>Falsches Passwort</span>
              )}
              <div className={styles.passwordActions}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowPasswordPrompt(false)}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handlePasswordSubmit}
                >
                  Entsperren
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formSection}>
            <h3>Persönliche Daten</h3>
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="vorname">Vorname *</label>
                <input
                  id="vorname"
                  name="vorname"
                  type="text"
                  required
                  placeholder="Max"
                  value={form.vorname}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="nachname">Nachname *</label>
                <input
                  id="nachname"
                  name="nachname"
                  type="text"
                  required
                  placeholder="Mustermann"
                  value={form.nachname}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="abteilung">Firma</label>
              <select
                id="abteilung"
                name="abteilung"
                value={form.abteilung}
                onChange={handleChange}
              >
                <option value="">Bitte wählen…</option>
                {abteilungen.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {showTitel && (
              <div className={styles.field}>
                <label htmlFor="titel">Position</label>
                <input
                  id="titel"
                  name="titel"
                  type="text"
                  placeholder="Position eingeben…"
                  value={form.titel}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>

          <div className={styles.formSection}>
            <h3>Kontaktdaten</h3>
            <div className={styles.field}>
              <label htmlFor="mobil">Mobilnummer</label>
              <input
                id="mobil"
                name="mobil"
                type="tel"
                placeholder="+49 151 12345678"
                value={form.mobil}
                onChange={handleChange}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="email">E-Mail *</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="max.mustermann@myvi.de"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="strasse">Straße + Hausnr.</label>
              <input
                id="strasse"
                name="strasse"
                type="text"
                placeholder="Musterstraße 1"
                value={form.strasse}
                onChange={handleChange}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="plz">PLZ</label>
                <input
                  id="plz"
                  name="plz"
                  type="text"
                  placeholder="80331"
                  value={form.plz}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="ort">Ort</label>
                <input
                  id="ort"
                  name="ort"
                  type="text"
                  placeholder="München"
                  value={form.ort}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="buchungslink">Buchungslink (optional)</label>
              <input
                id="buchungslink"
                name="buchungslink"
                type="url"
                placeholder="https://calendly.com/dein-name"
                value={form.buchungslink}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.walletButtons}>
            <button
              type="button"
              className={styles.btnApple}
              disabled={loading}
              onClick={handleAppleWallet}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  Wird erstellt…
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Apple Wallet
                </>
              )}
            </button>

            <button
              type="button"
              className={styles.btnGoogle}
              disabled={loading}
              onClick={handleGoogleWallet}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  Wird erstellt…
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.01 6.06C3.01 5.47 3.49 5 4.09 5h15.84c.59 0 1.07.47 1.07 1.06v11.88c0 .59-.48 1.06-1.07 1.06H4.09c-.6 0-1.08-.47-1.08-1.06V6.06zM12 15.25c1.79 0 3.25-1.46 3.25-3.25S13.79 8.75 12 8.75 8.75 10.21 8.75 12s1.46 3.25 3.25 3.25z"/>
                  </svg>
                  Google Wallet
                </>
              )}
            </button>
          </div>

          <p className={styles.hint}>
            * Pflichtfelder · Deine Daten werden sicher gespeichert.
            Du kannst deine Visitenkarte jederzeit mit derselben E-Mail-Adresse aktualisieren.
          </p>
        </form>

        {/* Wallet Preview Card */}
        <div className={styles.walletPreview}>
          <p className={styles.previewNote}>Live-Vorschau deiner Wallet-Karte</p>
          <div
            className={styles.walletCard}
            style={{
              background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.bg}dd 50%, ${colors.bg}99 100%)`,
              borderColor: `${colors.accent}40`,
            }}
          >
            <div className={styles.walletHeader}>
              <span className={styles.walletLogo} style={{ color: colors.accent }}>
                {form.abteilung || "MYVI Group"}
              </span>
            </div>
            <div className={styles.walletName}>
              {form.vorname || "Vorname"} {form.nachname || "Nachname"}
            </div>
            <div className={styles.walletMeta}>
              <div>
                <span className={styles.walletLabel} style={{ color: colors.accent }}>POSITION</span>
                <span className={styles.walletValue}>{form.titel || "–"}</span>
              </div>
              <div>
                <span className={styles.walletLabel} style={{ color: colors.accent }}>FIRMA</span>
                <span className={styles.walletValue}>{form.abteilung || "–"}</span>
              </div>
            </div>
            <div className={styles.walletContact} style={{ borderColor: `${colors.accent}26` }}>
              <span>{form.email || "deine@email.de"}</span>
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          <a href="https://myvi.de/datenschutz1" target="_blank" rel="noopener noreferrer">Datenschutz</a>
          <span>·</span>
          <a href="https://myvi.de/impressum1" target="_blank" rel="noopener noreferrer">Impressum</a>
        </footer>
      </div>
    </main>
  );
}
