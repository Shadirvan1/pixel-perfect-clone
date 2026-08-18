import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { getAdminDataFn, adminLogoutFn, type AdminData } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Super Admin — Momento" }],
  }),
  loader: async (): Promise<AdminData> => getAdminDataFn(),
  component: AdminPanel,
});

function fmt(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function AdminPanel() {
  const data = Route.useLoaderData();
  const router = useRouter();

  if (!data.authorized) {
    return (
      <div className="dark min-h-screen bg-background text-foreground flex items-center justify-center px-4 font-display">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-semibold">Super admin access only</h1>
          <p className="text-sm text-muted-foreground">
            You need to sign in with the super admin account to view this page.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  async function handleLogout() {
    await adminLogoutFn();
    await router.navigate({ to: "/" });
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground font-display">
      <header className="border-b border-border px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Super Admin Panel</h1>
          <p className="text-sm text-muted-foreground">
            All registered users and their login activity.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          Log out
        </button>
      </header>

      <main className="px-6 py-8 space-y-10 max-w-6xl mx-auto">
        <section className="space-y-3">
          <div className="flex items-baseline gap-3">
            <h2 className="text-lg font-semibold">Users</h2>
            <span className="text-sm text-muted-foreground">
              {data.users.length} total
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Username</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Password</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Last login</th>
                  <th className="px-4 py-3 font-medium text-right">Logins</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-4 py-3 tabular-nums">{u.id}</td>
                    <td className="px-4 py-3 font-medium">{u.username}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-amber-300">
                      {u.password}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          u.role === "superadmin"
                            ? "rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-xs text-fuchsia-300"
                            : "rounded-full bg-sky-500/15 px-2 py-0.5 text-xs text-sky-300"
                        }
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {fmt(u.created_at)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {fmt(u.last_login_at)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {u.login_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            ⚠️ Passwords are shown in plaintext for this learning project. A real
            app must hash passwords and never display them.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-baseline gap-3">
            <h2 className="text-lg font-semibold">Login attempts</h2>
            <span className="text-sm text-muted-foreground">
              everyone who pressed “Log in” · latest {data.attempts.length}
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Username entered</th>
                  <th className="px-4 py-3 font-medium">Password entered</th>
                  <th className="px-4 py-3 font-medium">Result</th>
                  <th className="px-4 py-3 font-medium">IP address</th>
                  <th className="px-4 py-3 font-medium">User agent</th>
                </tr>
              </thead>
              <tbody>
                {data.attempts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-muted-foreground"
                    >
                      No login attempts recorded yet.
                    </td>
                  </tr>
                ) : (
                  data.attempts.map((a) => (
                    <tr key={a.id} className="border-t border-border">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {fmt(a.attempted_at)}
                      </td>
                      <td className="px-4 py-3 font-medium">{a.username}</td>
                      <td className="px-4 py-3 font-mono text-amber-300">
                        {a.password ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {a.succeeded ? (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                            success
                          </span>
                        ) : (
                          <span
                            className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-300"
                            title={a.reason ?? undefined}
                          >
                            failed{a.reason ? ` · ${a.reason}` : ""}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {a.ip_address ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                        {a.user_agent ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            ⚠️ Every login attempt (including failed ones and unknown usernames)
            is stored with the exact details typed. Shown in plaintext for this
            learning project only.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-baseline gap-3">
            <h2 className="text-lg font-semibold">Login history</h2>
            <span className="text-sm text-muted-foreground">
              latest {data.events.length}
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Username</th>
                  <th className="px-4 py-3 font-medium">IP address</th>
                  <th className="px-4 py-3 font-medium">User agent</th>
                </tr>
              </thead>
              <tbody>
                {data.events.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-muted-foreground"
                    >
                      No logins recorded yet.
                    </td>
                  </tr>
                ) : (
                  data.events.map((ev) => (
                    <tr key={ev.id} className="border-t border-border">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {fmt(ev.logged_in_at)}
                      </td>
                      <td className="px-4 py-3 font-medium">{ev.username}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {ev.ip_address ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                        {ev.user_agent ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
