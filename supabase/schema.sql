-- Berater-Profile für digitale Visitenkarten
CREATE TABLE IF NOT EXISTS berater_cards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),

  -- Persönliche Daten
  vorname      TEXT NOT NULL,
  nachname     TEXT NOT NULL,
  titel        TEXT,                          -- z.B. "Finanzberater", "Senior Berater"
  abteilung    TEXT,                          -- z.B. "mitNORM", "EnergyFinance"
  telefon      TEXT,
  mobil        TEXT,
  email        TEXT NOT NULL,
  website      TEXT DEFAULT 'www.myvi.de',

  -- Pass-Metadaten
  pass_serial  TEXT UNIQUE NOT NULL,          -- Apple Pass Serial Number
  pass_version INT DEFAULT 1,                 -- Für Updates (Push Notifications)

  -- Status
  aktiv        BOOLEAN DEFAULT TRUE
);

-- Index für schnelle Suche
CREATE INDEX IF NOT EXISTS idx_berater_email ON berater_cards(email);
CREATE INDEX IF NOT EXISTS idx_berater_serial ON berater_cards(pass_serial);

-- Updated_at automatisch aktualisieren
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_berater_updated_at
  BEFORE UPDATE ON berater_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS aktivieren
ALTER TABLE berater_cards ENABLE ROW LEVEL SECURITY;

-- Policy: Jeder kann seinen eigenen Pass erstellen (anonym)
-- Für Produktion: Auth hinzufügen und Policies anpassen
CREATE POLICY "Public insert" ON berater_cards
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Public select own" ON berater_cards
  FOR SELECT USING (TRUE);
