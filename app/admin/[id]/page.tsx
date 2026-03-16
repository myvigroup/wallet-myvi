"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

type CardDetail = {
  id: string;
  vorname: string;
  nachname: string;
  titel: string | null;
  abteilung: string | null;
  email: string;
  mobil: string | null;
  telefon: string | null;
  strasse: string | null;
  plz: string | null;
  ort: string | null;
  website: string | null;
  buchungslink: string | null;
  pass_serial: string;
  pass_version: number;
  aktiv: boolean;
  created_at: string;
};

export default function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [card, setCard] = useState<CardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    // Try to get password from sessionStorage
    const stored = sessionStorage.getItem("admin_password");
    if (stored) {
      setPassword(stored);
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!authenticated || !password) return;

    async function fetchCard() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/cards/${id}`, {
          headers: { "x-admin-password": password },
        });
        if (res.status === 401) {
          setAuthenticated(false);
          setPasswordError(true);
          sessionStorage.removeItem("admin_password");
          return;
        }
        if (!res.ok) throw new Error("Karte nicht gefunden");
        const data = await res.json();
        setCard(data);
      } catch {
        setError("Fehler beim Laden der Karte.");
      } finally {
        setLoading(false);
      }
    }

    fetchCard();
  }, [authenticated, password, id]);

  const handleLogin = () => {
    sessionStorage.setItem("admin_password", password);
    setAuthenticated(true);
    setPasswordError(false);
  };

  const handleDelete = async () => {
    if (!card) return;
    if (!confirm(`Visitenkarte von "${card.vorname} ${card.nachname}" wirklich löschen?`)) return;

    try {
      const res = await fetch(`/api/admin/cards/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": password },
      });
      if (!res.ok) throw new Error("Fehler beim Löschen");
      router.push("/admin");
    } catch {
      setError("Fehler beim Löschen.");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "–";
    }
  };

  if (!authenticated) {
    return (
      <main className={styles.main}>
        <div className={styles.passwordOverlay}>
          <div className={styles.passwordCard}>
            <h3>Admin Zugang</h3>
            <p>Bitte Passwort eingeben:</p>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Passwort"
              autoFocus
            />
            {passwordError && (
              <span className={styles.passwordError}>Falsches Passwort</span>
            )}
            <button className={styles.btnPrimary} onClick={handleLogin}>
              Anmelden
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.loading}>Lade Karte…</div>
      </main>
    );
  }

  if (error || !card) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.error}>{error || "Karte nicht gefunden."}</div>
          <Link href="/admin" className={styles.backLink}>
            ← Zurück zur Übersicht
          </Link>
        </div>
      </main>
    );
  }

  const adresse = [card.strasse, [card.plz, card.ort].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  const fields: Array<{ label: string; value: string | null; type?: string }> = [
    { label: "Vorname", value: card.vorname },
    { label: "Nachname", value: card.nachname },
    { label: "Position", value: card.titel },
    { label: "Firma / Abteilung", value: card.abteilung },
    { label: "E-Mail", value: card.email, type: "email" },
    { label: "Mobil", value: card.mobil, type: "tel" },
    { label: "Telefon", value: card.telefon, type: "tel" },
    { label: "Adresse", value: adresse || null },
    { label: "Website", value: card.website, type: "url" },
    { label: "Buchungslink", value: card.buchungslink, type: "url" },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <Link href="/admin" className={styles.backLink}>
            ← Zurück
          </Link>
          <div className={styles.headerTitle}>
            <h1 className={styles.headline}>
              {card.vorname} {card.nachname}
            </h1>
            {card.titel && <p className={styles.subline}>{card.titel}</p>}
          </div>
        </header>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Version</div>
            <div className={styles.statValue}>{card.pass_version}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Status</div>
            <div className={styles.statValue}>
              <span className={card.aktiv ? styles.statusActive : styles.statusInactive}>
                {card.aktiv ? "Aktiv" : "Inaktiv"}
              </span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Erstellt</div>
            <div className={styles.statValueSmall}>{formatDate(card.created_at)}</div>
          </div>
        </div>

        {/* Contact details */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Kontaktdaten</h2>
          <div className={styles.fieldList}>
            {fields.map(
              (field) =>
                field.value && (
                  <div key={field.label} className={styles.fieldRow}>
                    <span className={styles.fieldLabel}>{field.label}</span>
                    <span className={styles.fieldValue}>
                      {field.type === "email" ? (
                        <a href={`mailto:${field.value}`} className={styles.link}>
                          {field.value}
                        </a>
                      ) : field.type === "tel" ? (
                        <a href={`tel:${field.value}`} className={styles.link}>
                          {field.value}
                        </a>
                      ) : field.type === "url" ? (
                        <a
                          href={field.value.startsWith("http") ? field.value : `https://${field.value}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.link}
                        >
                          {field.value}
                        </a>
                      ) : (
                        field.value
                      )}
                    </span>
                  </div>
                )
            )}
          </div>
        </div>

        {/* Meta */}
        <div className={styles.card}>
          <h2 className={styles.sectionTitle}>Technische Details</h2>
          <div className={styles.fieldList}>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Pass Serial</span>
              <span className={styles.fieldValueMono}>{card.pass_serial}</span>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Pass Version</span>
              <span className={styles.fieldValue}>{card.pass_version}</span>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>ID</span>
              <span className={styles.fieldValueMono}>{card.id}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <a
            href={`/api/vcard/${card.pass_serial}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnSecondary}
          >
            vCard herunterladen
          </a>
          <button onClick={handleDelete} className={styles.btnDelete}>
            Karte löschen
          </button>
        </div>
      </div>
    </main>
  );
}
