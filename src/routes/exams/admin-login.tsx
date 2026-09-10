import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { signInAdmin } from "../../lib/exam-auth";

export const Route = createFileRoute("/exams/admin-login")({
  head: () => ({ meta: [{ title: "Admin Login | Online Exam Portal" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    setLoading(true);
    try {
      await signInAdmin(String(data.get("adminIdentity") ?? ""), String(data.get("password") ?? ""));
      await navigate({ to: "/admin/dashboard" });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Email or password is incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-sky px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        <Link to="/exams" className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-bold text-navy transition hover:text-primary"><ArrowLeft size={17} /> Back to Exam Portal</Link>
        <section className="mt-6 rounded-xl border border-border bg-background p-6 shadow-xl shadow-navy/10 sm:p-9">
          <span className="grid size-14 place-items-center rounded-xl bg-secondary text-secondary-foreground"><ShieldCheck /></span>
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-secondary">Administrator access</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-navy">Admin Login</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Manage students, exams and results</p>
          <form onSubmit={submit} className="mt-8 grid gap-5">
            <div className="grid gap-2"><Label htmlFor="adminIdentity">Email / Admin ID</Label><Input id="adminIdentity" name="adminIdentity" placeholder="Enter your email or admin ID" autoComplete="username" /></div>
            <div className="grid gap-2"><Label htmlFor="adminPassword">Password</Label><Input id="adminPassword" name="password" type="password" placeholder="Enter your password" autoComplete="current-password" /></div>
            {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">{error}</p>}
            <Button type="submit" size="lg" variant="secondary" disabled={loading} className="mt-2 w-full">{loading ? "Signing in..." : "Admin Login"}</Button>
          </form>
        </section>
      </div>
    </main>
  );
}
