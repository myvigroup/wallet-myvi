"use client";

import { useState } from "react";
import styles from "./page.module.css";

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
    website: "www.myvi.de",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/pass/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          adresse: [form.strasse, [form.plz, form.ort].filter(Boolean).join(" ")].filter(Boolean).join(", "),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Unbekannter Fehler");
      }

      // .pkpass als Blob herunterladen
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // iOS: Link öffnen → Wallet-Dialog erscheint automatisch
      // Desktop: Datei herunterladen
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

          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className={styles.spinner} />
                Visitenkarte wird erstellt…
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
                Zu Apple Wallet hinzufügen
              </>
            )}
          </button>

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
