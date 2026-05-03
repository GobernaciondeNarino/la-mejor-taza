-- La Mejor Taza — Esquema MySQL/MariaDB
-- Crea la base, el usuario y las tablas.
-- Uso: mysql -u root -p < db/schema.mysql.sql
-- (revisa contraseñas y nombres antes de ejecutar)

CREATE DATABASE IF NOT EXISTS la_mejor_taza
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE la_mejor_taza;

-- Usuario de aplicación (cambiar la contraseña en producción)
-- CREATE USER IF NOT EXISTS 'lmt_app'@'localhost'
--   IDENTIFIED BY 'CAMBIAR_EN_PRODUCCION';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON la_mejor_taza.* TO 'lmt_app'@'localhost';
-- FLUSH PRIVILEGES;

-- Administradores -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin      TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stands --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stands (
  id            VARCHAR(32) PRIMARY KEY,
  nombre        VARCHAR(80) NOT NULL,
  municipio     VARCHAR(80) NOT NULL,
  region        VARCHAR(80) DEFAULT NULL,
  direccion     VARCHAR(255) DEFAULT NULL,
  correo        VARCHAR(254) DEFAULT NULL,
  descripcion   TEXT DEFAULT NULL,
  coords_x      DECIMAL(6,5) DEFAULT 0.5,
  coords_y      DECIMAL(6,5) DEFAULT 0.5,
  color         VARCHAR(80) DEFAULT 'oklch(0.45 0.1 40)',
  votos_bueno   INT UNSIGNED NOT NULL DEFAULT 0,
  votos_regular INT UNSIGNED NOT NULL DEFAULT 0,
  votos_malo    INT UNSIGNED NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Votos ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS votos (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  stand_id   VARCHAR(32) NOT NULL,
  emoji      ENUM('bueno','regular','malo') NOT NULL,
  correo     VARCHAR(254) NOT NULL,
  compra     TINYINT(1) DEFAULT NULL,
  texto      VARCHAR(500) DEFAULT NULL,
  ip_hash    CHAR(64) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_voto_stand FOREIGN KEY (stand_id) REFERENCES stands(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_vote_per_stand_email (stand_id, correo),
  KEY idx_votos_created_at (created_at),
  KEY idx_votos_stand (stand_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pasaportes ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pasaportes (
  correo    VARCHAR(254) PRIMARY KEY,
  nombre    VARCHAR(120) DEFAULT NULL,
  inicio    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  visitados JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rate limits ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limits (
  id           CHAR(64) PRIMARY KEY,
  bucket       VARCHAR(64) NOT NULL,
  hits         INT UNSIGNED NOT NULL DEFAULT 0,
  window_start INT UNSIGNED NOT NULL,
  KEY idx_rate_window (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
