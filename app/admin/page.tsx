"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "./page.module.css";

type Card = {
  id: string;
  vorname: string;
  nachname: string;
  abteilung: string | null;
  titel: string | null;
  email: string;
  mobil: string | null;
  pass_version: number;
  created_at: string;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [storedPassword, setStoredPassword] = useState("");

  const fetchCards = useCallback(async (pw: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/cards", {
        headers: { "x-admin-password": pw },
      });
      if (res.status === 401) {
        setAuthenticated(false);
        setPasswordError(true);
        return;
      }
      if (!res.ok) throw new Error("Fehler beim Laden");
      const data = await res.json();
      setCards(data);
    } catch {
      setError("Fehler beim Laden der Daten.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = async () => {
    setStoredPassword(password);
    setAuthenticated(true);
    setPasswordError(false);
  };

  useEffect(() => {
    if (authenticated && storedPassword) {
      fetchCards(storedPassword);
    }
  }, [authenticated, storedPassword, fetchCards]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Visitenkarte von "${name}" wirklich löschen?`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/cards/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": storedPassword },
      });
      if (!res.ok) throw new Error("Fehler beim Löschen");
      setCards((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("Fehler beim Löschen.");
    } finally {
      setDeletingId(null);
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
            <h3>Admin Dashboard</h3>
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

  const firmen = [...new Set(cards.map((c) => c.abteilung).filter(Boolean))];

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <img src="/logo-white.png" alt="MYVI" className={styles.logoImg} />
          <div>
            <h1 className={styles.headline}>Admin Dashboard</h1>
            <p className={styles.subline}>Visitenkarten verwalten</p>
          </div>
          <Link href="/" className={styles.backLink}>
            ← Zurück
          </Link>
        </header>

        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Visitenkarten</div>
            <div className={styles.statValue}>{cards.length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Firmen</div>
            <div className={styles.statValue}>{firmen.length}</div>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {loading ? (
          <div className={styles.loading}>Lade Daten…</div>
        ) : cards.length === 0 ? (
          <div className={styles.emptyState}>
            Noch keine Visitenkarten erstellt.
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Name</th>
                  <th className={styles.th}>Firma</th>
                  <th className={styles.th}>E-Mail</th>
                  <th className={styles.th}>Mobil</th>
                  <th className={styles.th}>Erstellt</th>
                  <th className={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => (
                  <tr key={card.id} className={styles.tr}>
                    <td className={styles.td} data-label="Name">
                      {card.vorname} {card.nachname}
                      {card.titel && (
                        <span style={{ color: "var(--myvi-gray)", fontSize: 12, marginLeft: 6 }}>
                          {card.titel}
                        </span>
                      )}
                    </td>
                    <td className={styles.td} data-label="Firma">
                      {card.abteilung ? (
                        <span className={styles.firmaTag}>{card.abteilung}</span>
                      ) : (
                        "–"
                      )}
                    </td>
                    <td className={`${styles.td} ${styles.emailCell}`} data-label="E-Mail">
                      {card.email}
                    </td>
                    <td className={styles.td} data-label="Mobil">
                      {card.mobil || "–"}
                    </td>
                    <td className={`${styles.td} ${styles.dateCell}`} data-label="Erstellt">
                      {formatDate(card.created_at)}
                    </td>
                    <td className={styles.td}>
                      <button
                        className={styles.btnDelete}
                        disabled={deletingId === card.id}
                        onClick={() =>
                          handleDelete(card.id, `${card.vorname} ${card.nachname}`)
                        }
                      >
                        {deletingId === card.id ? "…" : "Löschen"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
