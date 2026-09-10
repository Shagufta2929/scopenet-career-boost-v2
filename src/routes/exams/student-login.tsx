import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, BookOpenCheck } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { signInStudent } from "../../lib/exam-auth";

export const Route = createFileRoute("/exams/student-login")({
  head: () => ({ meta: [{ title: "Student Login | Online Exam Portal" }] }),
  component: StudentLogin,
});

function StudentLogin() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError("");
    setLoading(true);
    try {
      await signInStudent(String(data.get("studentId") ?? ""), String(data.get("password") ?? ""));
      await navigate({ to: "/student/dashboard" });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Student ID or password is incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return <LoginPage title="Student Login" subtitle="Login with your Student ID and Password" icon={<BookOpenCheck />} idLabel="Student ID" idName="studentId" idPlaceholder="Enter your Student ID" buttonLabel="Student Login" error={error} loading={loading} onSubmit={submit} />;
}

function LoginPage({ title, subtitle, icon, idLabel, idName, idPlaceholder, buttonLabel, error, loading, onSubmit }: { title: string; subtitle: string; icon: React.ReactNode; idLabel: string; idName: string; idPlaceholder: string; buttonLabel: string; error: string; loading: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-sky px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        <Link to="/exams" className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-bold text-navy transition hover:text-primary"><ArrowLeft size={17} /> Back to Exam Portal</Link>
        <section className="mt-6 rounded-xl border border-border bg-background p-6 shadow-xl shadow-navy/10 sm:p-9">
          <span className="grid size-14 place-items-center rounded-xl bg-primary text-primary-foreground">{icon}</span>
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-primary">Student access</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-navy">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{subtitle}</p>
          <form onSubmit={onSubmit} className="mt-8 grid gap-5">
            <div className="grid gap-2"><Label htmlFor={idName}>{idLabel}</Label><Input id={idName} name={idName} placeholder={idPlaceholder} autoComplete="username" /></div>
            <div className="grid gap-2"><Label htmlFor="studentPassword">Password</Label><Input id="studentPassword" name="password" type="password" placeholder="Enter your password" autoComplete="current-password" /></div>
            {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">{error}</p>}
            <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">{loading ? "Signing in..." : buttonLabel}</Button>
          </form>
        </section>
      </div>
    </main>
  );
}
