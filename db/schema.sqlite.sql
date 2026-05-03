-- La Mejor Taza — Esquema SQLite (alternativa para desarrollo local).
-- Uso: sqlite3 db/la-mejor-taza.sqlite < db/schema.sqlite.sql

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_admin      INTEGER NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stands (
  id            TEXT PRIMARY KEY,
  nombre        TEXT NOT NULL,
  municipio     TEXT NOT NULL,
  region        TEXT,
  direccion     TEXT,
  correo        TEXT,
  descripcion   TEXT,
  coords_x      REAL DEFAULT 0.5,
  coords_y      REAL DEFAULT 0.5,
  color         TEXT DEFAULT 'oklch(0.45 0.1 40)',
  votos_bueno   INTEGER NOT NULL DEFAULT 0,
  votos_regular INTEGER NOT NULL DEFAULT 0,
  votos_malo    INTEGER NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS votos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  stand_id   TEXT NOT NULL,
  emoji      TEXT NOT NULL CHECK (emoji IN ('bueno','regular','malo')),
  correo     TEXT NOT NULL,
  compra     INTEGER,
  texto      TEXT,
  ip_hash    TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stand_id) REFERENCES stands(id) ON DELETE CASCADE,
  UNIQUE (stand_id, correo)
);
CREATE INDEX IF NOT EXISTS idx_votos_created_at ON votos(created_at);
CREATE INDEX IF NOT EXISTS idx_votos_stand ON votos(stand_id);

CREATE TABLE IF NOT EXISTS pasaportes (
  correo    TEXT PRIMARY KEY,
  nombre    TEXT,
  inicio    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  visitados TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS rate_limits (
  id           TEXT PRIMARY KEY,
  bucket       TEXT NOT NULL,
  hits         INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL
);
