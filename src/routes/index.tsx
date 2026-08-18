import { createFileRoute } from "@tanstack/react-router";
import collage from "@/assets/collage.png";

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
            <h2 className="text-xl font-semibold">Log in to Momento</h2>

            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <div className="field">
                <input id="user" className="field-input" placeholder=" " autoComplete="username" />
                <label htmlFor="user" className="field-label">
                  Mobile number, username or email address
                </label>
              </div>

              <div className="field">
                <input
                  id="pass"
                  type="password"
                  className="field-input"
                  placeholder=" "
                  autoComplete="current-password"
                />
                <label htmlFor="pass" className="field-label">
                  Password
                </label>
              </div>

              <button type="submit" className="btn-primary">
                Log in
              </button>
            </form>

            <p className="text-center text-sm font-semibold">
              <a href="#" className="hover:opacity-80">
                Forgotten password?
              </a>
            </p>

            <div className="pt-8 space-y-3">
              <button type="button" className="btn-soft">
                <svg viewBox="0 0 24 24" className="size-5 fill-[#0866ff]" aria-hidden="true">
                  <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
                </svg>
                Log in with Facebook
              </button>

              <button type="button" className="btn-outline">
                Create new account
              </button>
            </div>

            <p className="pt-6 text-center text-sm font-semibold text-muted-foreground">
              ∞ Momento
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
