import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, ShieldAlert, Lock, ArrowLeft, ExternalLink } from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";

import { getStaffLoginUrl } from "@/lib/staff-login";

export const Route = createFileRoute("/staff-login")({
  head: () => ({
    meta: [
      { title: "Staff Login — Mwingi Royal Junior Academy" },
      { name: "description", content: "Secure staff access portal for Mwingi Royal Junior Academy." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: StaffLogin,
});

type Step = "gate" | "form" | "denied";

function StaffLogin() {
  const [step, setStep] = useState<Step>("gate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleProceed() {
    setSubmitting(true);
    setError(null);
    // Light client validation only — actual auth happens on the finance app.
    if (!email.trim() || !password.trim()) {
      setError("Please enter your staff email and password to continue.");
      setSubmitting(false);
      return;
    }
    window.location.href = getStaffLoginUrl();
  }

  return (
    <SiteLayout>
      <section className="bg-gradient-ocean py-12 text-primary-foreground sm:py-16">
        <div className="mx-auto max-w-2xl px-5">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-white">
            <ArrowLeft size={16} /> Back to website
          </Link>
          <h1 className="mt-4 font-serif text-3xl font-bold sm:text-4xl">Staff Portal</h1>
          <p className="mt-2 text-sm text-primary-foreground/80 sm:text-base">
            Authorised personnel only. You will be redirected to the finance system to sign in.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
        {step === "gate" && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-ocean">
              <ShieldCheck size={22} />
            </div>
            <h2 className="font-serif text-xl font-bold sm:text-2xl">Are you an authorised staff member?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This area is restricted. By proceeding, you confirm you have valid access credentials
              issued by the school administration. Unauthorised access attempts are logged.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setStep("form")}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                <ShieldCheck size={16} /> Yes, I'm authorised
              </button>
              <button
                onClick={() => setStep("denied")}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-5 py-3 text-sm font-medium text-foreground hover:bg-secondary"
              >
                No, take me back
              </button>
            </div>
          </div>
        )}

        {step === "denied" && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center sm:p-8">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert size={22} />
            </div>
            <h2 className="font-serif text-xl font-bold sm:text-2xl">Access not permitted</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This portal is exclusively for school staff. Please return to the public website.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <ArrowLeft size={16} /> Back to home
            </Link>
          </div>
        )}

        {step === "form" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleProceed();
            }}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
          >
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-ocean">
              <Lock size={22} />
            </div>
            <h2 className="font-serif text-xl font-bold sm:text-2xl">Enter your credentials</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You will be securely redirected to the finance system to complete sign-in.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="text-sm font-medium text-foreground">Staff email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="you@mwingiroyal.ac.ke"
                />
              </div>
              <div>
                <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter password"
                />
              </div>

              {error && (
                <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Redirecting…" : (<>Proceed to finance login <ExternalLink size={15} /></>)}
              </button>
              <p className="text-center text-xs text-muted-foreground">
                Credentials are submitted on the destination system only.
              </p>
            </div>
          </form>
        )}
      </section>
    </SiteLayout>
  );
}
