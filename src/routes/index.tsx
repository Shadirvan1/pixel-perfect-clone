import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import collage from "@/assets/collage.png";
import { loginFn } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Log in to Momento — See everyday moments" },
      {
        name: "description",
        content:
          "Log in to Momento to see everyday moments from your close friends, share stories and stay connected.",
      },
      { property: "og:title", content: "Log in to Momento" },
      {
        property: "og:description",
        content: "See everyday moments from your close friends.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<
    { type: "error" | "success"; text: string } | null
  >(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setPending(true);
    try {
      const result = await loginFn({ data: { username, password } });
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      if (result.role === "superadmin") {
        // Super admin uses the same login page, then redirects to the panel.
        await router.navigate({ to: "/admin" });
        return;
      }
      const when = new Date(result.loginTime).toLocaleString();
      setMessage({
        type: "success",
        text: `Logged in as ${result.username}. Login time recorded: ${when}`,
      });
      setPassword("");
      setShowPassword(false);
    } catch {
      setMessage({
        type: "error",
        text: "Could not reach the server. Check the database connection and try again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground flex flex-col font-display">
      <main className="flex-1 grid lg:grid-cols-2">
        {/* Left: brand + hero */}
        <section className="flex flex-col justify-center gap-8 px-8 py-14 lg:px-16 border-b lg:border-b-0 lg:border-r border-border">
          <div className="brand-mark" aria-hidden="true">
            <span className="brand-inner" />
          </div>

          <h1 className="max-w-xl text-4xl sm:text-5xl font-light leading-tight tracking-tight">
            See everyday moments from your{" "}
            <span className="text-gradient-brand font-normal">close friends</span>.
          </h1>

          <img
            src={collage}
            alt="Stack of colorful story cards with heart and emoji reactions"
            width={900}
            height={900}
            className="w-full max-w-md self-center lg:self-start"
          />
        </section>

        {/* Right: login */}
        <section className="flex items-center justify-center px-8 py-14">
          <div className="w-full max-w-md space-y-5">
            <h2 className="text-xl font-semibold">Log in to Momento.</h2>

            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="field">
                <input
                  id="user"
                  className="field-input"
                  placeholder=" "
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <label htmlFor="user" className="field-label">
                  Mobile number, username or email address
                </label>
              </div>

              <div className="field">
                <input
                  id="pass"
                  type={showPassword ? "text" : "password"}
                  className="field-input pr-12"
                  placeholder=" "
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <label htmlFor="pass" className="field-label">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="size-5" aria-hidden="true" />
                  ) : (
                    <Eye className="size-5" aria-hidden="true" />
                  )}
                </button>
              </div>

              <button type="submit" className="btn-primary" disabled={pending}>
                {pending ? "Logging in…" : "Log in"}
              </button>
            </form>

            {message && (
              <p
                role="status"
                className={
                  message.type === "error"
                    ? "text-sm text-red-400"
                    : "text-sm text-emerald-400"
                }
              >
                {message.text}
              </p>
            )}

            <p className="pt-6 text-center text-sm font-semibold text-muted-foreground">
              ∞ Momento.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-5">
        <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          {[
            "About",
            "Blog",
            "Jobs",
            "Help",
            "API",
            "Privacy",
            "Terms",
            "Locations",
            "Popular",
            "Momento Lite",
            "Threads",
            "Contact uploading and non-users",
            "Verified",
          ].map((item) => (
            <li key={item}>
              <a href="#" className="hover:text-foreground transition-colors">
                {item}
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
