import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { ArrowRight, BookOpenCheck, ShieldCheck } from "lucide-react";

import { buttonVariants } from "../components/ui/button";

export const Route = createFileRoute("/exams")({
  head: () => ({
    meta: [
      { title: "Online Exam Portal | Scopenet Computer Institute" },
      { name: "description", content: "Access the Scopenet Computer Institute online examination portal." },
    ],
  }),
  component: ExamsPortal,
});

function ExamsPortal() {
  const { pathname } = useLocation();

  if (pathname !== "/exams") return <Outlet />;

  return (
    <main className="min-h-screen bg-sky px-4 py-8 text-foreground sm:px-6 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <Link to="/" className="focus-ring inline-flex items-center rounded-md bg-background px-3 py-2 text-sm font-bold text-navy shadow-sm transition hover:text-primary">
          <img src="/scopenet-logo.jpeg" alt="Scopenet Computer Institute" className="h-10 w-auto max-w-[15rem] object-contain" />
        </Link>

        <section className="mt-10 text-center sm:mt-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary">Scopenet Computer Institute</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold text-navy sm:text-5xl">Online Exam Portal</h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">Take your assigned examinations online</p>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2 sm:mt-14">
          <LoginChoice
            accent="primary"
            icon={<BookOpenCheck size={28} />}
            label="STUDENT"
            title="Student Login"
            description="Login with your Student ID and Password"
            to="/exams/student-login"
          />
          <LoginChoice
            accent="secondary"
            icon={<ShieldCheck size={28} />}
            label="ADMIN"
            title="Admin Login"
            description="Manage students, exams and results"
            to="/exams/admin-login"
          />
        </section>

        <p className="mt-10 text-center text-xs font-semibold text-muted-foreground">Secure access for Scopenet learners and administrators.</p>
      </div>
    </main>
  );
}

function LoginChoice({ accent, icon, label, title, description, to }: { accent: "primary" | "secondary"; icon: React.ReactNode; label: string; title: string; description: string; to: "/exams/student-login" | "/exams/admin-login" }) {
  const accentClasses = accent === "primary" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground";

  return (
    <article className="flex min-h-80 flex-col rounded-xl border border-border bg-background p-7 shadow-lg shadow-navy/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-9">
      <div className="flex items-center justify-between gap-4">
        <span className={`grid size-14 place-items-center rounded-xl ${accentClasses}`}>{icon}</span>
        <span className="rounded-full bg-accent/20 px-3 py-1 text-[11px] font-extrabold tracking-[0.18em] text-navy">{label}</span>
      </div>
      <h2 className="mt-8 font-display text-2xl font-extrabold text-navy">{title}</h2>
      <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      <Link to={to} className={buttonVariants({ size: "lg", className: "mt-auto w-full sm:w-auto" })}>
        {title} <ArrowRight />
      </Link>
    </article>
  );
}
