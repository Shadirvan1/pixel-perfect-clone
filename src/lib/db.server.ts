// ---------------------------------------------------------------------------
// Database access (server-only).
//
// This module talks to PostgreSQL with the `pg` driver. It is imported lazily
// (via dynamic import) from inside server-function handlers so the driver is
// never bundled into the browser build.
//
// ⚠️ LEARNING PROJECT NOTE: passwords are stored and read as PLAINTEXT here on
// purpose, so you can see the full flow in the admin panel. NEVER do this in a
// real app — hash passwords with bcrypt/argon2 and never display them.
// ---------------------------------------------------------------------------

import { Pool } from "pg";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

let poolPromise: Promise<Pool> | undefined;
let schemaReady = false;
let envLoaded = false;

// Minimal .env loader so DATABASE_URL is available whether or not the dev
// server injects it into process.env. Only fills in keys that aren't already set.
function loadDotEnv(): void {
  if (envLoaded) return;
  envLoaded = true;
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // No .env file — rely on real environment variables instead.
  }
}

function resolveConnectionString(): string {
  loadDotEnv();
  const url = process.env["DATABASE_URL"];
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to a .env file at the project root. " +
        "Use the EXTERNAL connection string from Render for local development.",
    );
  }
  return url;
}

// Render's managed Postgres requires TLS on the *external* host. The internal
// host (…-a with no domain) is only reachable from inside Render and does not.
function resolveSsl(connectionString: string) {
  const forced = process.env["PGSSL"]; // "true" / "false" to override
  if (forced === "true") return { rejectUnauthorized: false } as const;
  if (forced === "false") return undefined;
  if (/render\.com/i.test(connectionString)) {
    return { rejectUnauthorized: false } as const;
  }
  return undefined;
}

async function getPool(): Promise<Pool> {
  if (!poolPromise) {
    const connectionString = resolveConnectionString();
    const pool = new Pool({
      connectionString,
      ssl: resolveSsl(connectionString),
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    poolPromise = Promise.resolve(pool);
  }
  return poolPromise;
}

/**
 * Create tables (if missing) and seed the initial accounts. Idempotent — safe
 * to call on every request; it only does real work the first time per process.
 */
export async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  const pool = await getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      username      TEXT NOT NULL UNIQUE,
      email         TEXT,
      password      TEXT NOT NULL,           -- plaintext (learning project only)
      role          TEXT NOT NULL DEFAULT 'user',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_login_at TIMESTAMPTZ,
      login_count   INTEGER NOT NULL DEFAULT 0
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS login_events (
      id           SERIAL PRIMARY KEY,
      user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
      username     TEXT NOT NULL,
      logged_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      ip_address   TEXT,
      user_agent   TEXT
    );
  `);

  // Every "Log in" press is recorded here — successful OR failed, and even for
  // usernames that don't exist. This is what the super admin uses to see who is
  // trying to log in (the details they typed) for security monitoring.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS login_attempts (
      id             SERIAL PRIMARY KEY,
      username       TEXT NOT NULL,
      password       TEXT,
      succeeded      BOOLEAN NOT NULL DEFAULT false,
      reason         TEXT,
      attempted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      ip_address     TEXT,
      user_agent     TEXT
    );
  `);

  // Seed accounts. ON CONFLICT keeps existing rows untouched so real data
  // (login times, counts) persists across restarts.
  await pool.query(
    `
    INSERT INTO users (username, email, password, role)
    VALUES
      ($1, $2, $3, 'superadmin'),
      ($4, $5, $6, 'user'),
      ($7, $8, $9, 'user')
    ON CONFLICT (username) DO NOTHING;
  `,
    [
      "superadmin",
      "admin@momento.local",
      "SuperAdmin@2026",
      "johndoe",
      "john@example.com",
      "John@2026",
      "testuser",
      "test@example.com",
      "Test@1234",
    ],
  );

  schemaReady = true;
}

export async function query<T = unknown>(
  text: string,
  params?: unknown[],
): Promise<{ rows: T[]; rowCount: number | null }> {
  const pool = await getPool();
  const result = await pool.query(text, params as never);
  return { rows: result.rows as T[], rowCount: result.rowCount };
}
