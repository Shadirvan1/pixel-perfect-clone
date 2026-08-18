// ---------------------------------------------------------------------------
// Auth server functions.
//
// Everything inside a `.handler()` runs ONLY on the server. The `pg` driver and
// the db module are dynamically imported inside the handlers so they never end
// up in the browser bundle.
// ---------------------------------------------------------------------------

import { createServerFn } from "@tanstack/react-start";
import {
  getCookie,
  setCookie,
  getRequestHeader,
} from "@tanstack/react-start/server";

const ADMIN_COOKIE = "momento_admin";

// A trivial session marker for the learning project. In a real app this would
// be a signed/encrypted token or a random session id stored server-side.
function makeAdminToken(username: string): string {
  return `admin:${username}`;
}
function isValidAdminToken(token: string | undefined): token is string {
  return typeof token === "string" && token.startsWith("admin:");
}

export type LoginResult =
  | { ok: true; role: "superadmin"; username: string; redirectTo: "/admin" }
  | { ok: true; role: "user"; username: string; loginTime: string }
  | { ok: false; error: string };

export const loginFn = createServerFn({ method: "POST" })
  .validator((data: { username: string; password: string }) => {
    const username = String(data?.username ?? "").trim();
    const password = String(data?.password ?? "");
    return { username, password };
  })
  .handler(async ({ data }): Promise<LoginResult> => {
    const { ensureSchema, query } = await import("./db.server");
    await ensureSchema();

    // Capture request metadata up front so every attempt — including failed and
    // unknown-username ones — can be logged for the super admin to review.
    const ip =
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
      getRequestHeader("x-real-ip") ??
      null;
    const userAgent = getRequestHeader("user-agent") ?? null;

    // Records the raw details the person typed on every "Log in" press.
    async function recordAttempt(succeeded: boolean, reason: string) {
      await query(
        `INSERT INTO login_attempts
           (username, password, succeeded, reason, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [data.username, data.password, succeeded, reason, ip, userAgent],
      );
    }

    if (!data.username || !data.password) {
      await recordAttempt(false, "missing username or password");
      return { ok: false, error: "Please enter both your username and password." };
    }

    const { rows } = await query<{
      id: number;
      username: string;
      password: string;
      role: string;
    }>(
      `SELECT id, username, password, role
         FROM users
        WHERE lower(username) = lower($1) OR lower(email) = lower($1)
        LIMIT 1`,
      [data.username],
    );

    const user = rows[0];
    if (!user) {
      await recordAttempt(false, "unknown username");
      return { ok: false, error: "Incorrect username or password." };
    }
    if (user.password !== data.password) {
      await recordAttempt(false, "wrong password");
      return { ok: false, error: "Incorrect username or password." };
    }

    await recordAttempt(true, "success");

    // Record the login time + append to the login history.
    const loginTime = new Date().toISOString();

    await query(
      `UPDATE users
          SET last_login_at = now(), login_count = login_count + 1
        WHERE id = $1`,
      [user.id],
    );
    await query(
      `INSERT INTO login_events (user_id, username, ip_address, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [user.id, user.username, ip, userAgent],
    );

    if (user.role === "superadmin") {
      setCookie(ADMIN_COOKIE, makeAdminToken(user.username), {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8, // 8 hours
      });
      return {
        ok: true,
        role: "superadmin",
        username: user.username,
        redirectTo: "/admin",
      };
    }

    return { ok: true, role: "user", username: user.username, loginTime };
  });

export type AdminUserRow = {
  id: number;
  username: string;
  email: string | null;
  password: string;
  role: string;
  created_at: string;
  last_login_at: string | null;
  login_count: number;
};

export type LoginEventRow = {
  id: number;
  username: string;
  logged_in_at: string;
  ip_address: string | null;
  user_agent: string | null;
};

export type LoginAttemptRow = {
  id: number;
  username: string;
  password: string | null;
  succeeded: boolean;
  reason: string | null;
  attempted_at: string;
  ip_address: string | null;
  user_agent: string | null;
};

export type AdminData =
  | { authorized: false }
  | {
      authorized: true;
      users: AdminUserRow[];
      events: LoginEventRow[];
      attempts: LoginAttemptRow[];
    };

export const getAdminDataFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminData> => {
    const token = getCookie(ADMIN_COOKIE);
    if (!isValidAdminToken(token)) {
      return { authorized: false };
    }

    const { ensureSchema, query } = await import("./db.server");
    await ensureSchema();

    const users = await query<AdminUserRow>(
      `SELECT id, username, email, password, role,
              created_at, last_login_at, login_count
         FROM users
        ORDER BY id ASC`,
    );
    const events = await query<LoginEventRow>(
      `SELECT id, username, logged_in_at, ip_address, user_agent
         FROM login_events
        ORDER BY logged_in_at DESC
        LIMIT 200`,
    );
    const attempts = await query<LoginAttemptRow>(
      `SELECT id, username, password, succeeded, reason,
              attempted_at, ip_address, user_agent
         FROM login_attempts
        ORDER BY attempted_at DESC
        LIMIT 200`,
    );

    return {
      authorized: true,
      users: users.rows,
      events: events.rows,
      attempts: attempts.rows,
    };
  },
);

export const adminLogoutFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ ok: true }> => {
    setCookie(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
    return { ok: true };
  },
);
