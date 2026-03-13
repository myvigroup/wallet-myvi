"use client";

import { useState } from "react";
import styles from "./page.module.css";

const ABTEILUNGEN = [
  "mitNORM",
  "mitNORM Firmenberatung",
  "EnergyFinance",
  "Das Karriere-Institut",
  "Wir:Personalberater",
  "myNORM",
];

const TITEL = [
  "Finanzberater",
  "Senior Finanzberater",
  "Geschäftsführer",
  "Teamleiter",
  "Consultant",
  "Regionalleiter",
  "Vertriebsleiter",
];

export default function Home() {
  const [form, setForm] = useState({
    vorname: "",
    nachname: "",
    titel: "",
    abteilung: "",
    telefon: "",
    mobil: "",
    email: "",
    website: "www.myvi.de",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

        {/* Wallet Preview Card */}
        <div className={styles.walletPreview}>
          <div className={styles.walletCard}>
            <div className={styles.walletHeader}>
              <span className={styles.walletLogo}>MYVI Group</span>
            </div>
            <div className={styles.walletName}>
              {form.vorname || "Vorname"} {form.nachname || "Nachname"}
            </div>
            <div className={styles.walletMeta}>
              <div>
                <span className={styles.walletLabel}>POSITION</span>
                <span className={styles.walletValue}>{form.titel || "–"}</span>
              </div>
              <div>
                <span className={styles.walletLabel}>BEREICH</span>
                <span className={styles.walletValue}>{form.abteilung || "–"}</span>
              </div>
            </div>
            <div className={styles.walletContact}>
              <span>{form.email || "deine@email.de"}</span>
            </div>
          </div>
          <p className={styles.previewNote}>Live-Vorschau deiner Wallet-Karte</p>
        </div>

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

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="titel">Position</label>
                <select
                  id="titel"
                  name="titel"
                  value={form.titel}
                  onChange={handleChange}
                >
                  <option value="">Bitte wählen…</option>
                  {TITEL.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="abteilung">Bereich / Marke</label>
                <select
                  id="abteilung"
                  name="abteilung"
                  value={form.abteilung}
                  onChange={handleChange}
                >
                  <option value="">Bitte wählen…</option>
                  {ABTEILUNGEN.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Kontaktdaten</h3>
            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="telefon">Telefon (Büro)</label>
                <input
                  id="telefon"
                  name="telefon"
                  type="tel"
                  placeholder="+49 89 123456"
                  value={form.telefon}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="mobil">Mobil</label>
                <input
                  id="mobil"
                  name="mobil"
                  type="tel"
                  placeholder="+49 151 12345678"
                  value={form.mobil}
                  onChange={handleChange}
                />
              </div>
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
      </div>
    </main>
  );
}
