import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ClipboardList, FileText, LogOut, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "../../components/ui/button";
import { getExamSessionProfile, signOutExamUser } from "../../lib/exam-auth";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard | Online Exam Portal" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState("");
  const [loading, setLoading] = useState(true);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    let active = true;
    void getExamSessionProfile().then((session) => {
      if (!active) return;
      if (!session) {
        void navigate({ to: "/exams/admin-login", replace: true });
      } else if (session.profile.role !== "admin") {
        void navigate({ to: "/student/dashboard", replace: true });
      } else {
        setAdminName(session.profile.full_name);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [navigate]);

  const logout = async () => {
    setLogoutError("");
    try {
      await signOutExamUser();
      await navigate({ to: "/exams", replace: true });
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "Logout failed. Please try again.");
    }
  };

  if (loading) return <DashboardShell><p className="text-sm font-semibold text-muted-foreground">Loading your dashboard...</p></DashboardShell>;
  if (!adminName) return null;

  return (
    <DashboardShell>
      <header className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Admin Dashboard</p><h1 className="mt-2 font-display text-3xl font-extrabold text-navy">Welcome, {adminName}</h1><p className="mt-2 text-sm text-muted-foreground">Manage the Online Exam Portal from one place.</p></div><Button variant="secondary" onClick={logout}><LogOut /> Logout</Button></header>
      {logoutError && <p role="alert" className="mt-5 rounded-md bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">{logoutError}</p>}
      <section className="mt-8 grid gap-4 sm:grid-cols-2"><Link to="/admin/students" className="block"><Placeholder icon={<Users />} title="Students" /></Link><Link to="/admin/exams" className="block"><Placeholder icon={<FileText />} title="Exams" /></Link><Link to="/admin/assignments" className="block"><Placeholder icon={<ClipboardList />} title="Assignments" /></Link><Link to="/admin/results" className="block"><Placeholder icon={<ClipboardList />} title="Results" /></Link></section>
    </DashboardShell>
  );
}

function Placeholder({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <article className="rounded-xl border border-border bg-sky p-6"><span className="grid size-11 place-items-center rounded-md bg-secondary text-secondary-foreground">{icon}</span><h2 className="mt-5 font-display text-xl font-extrabold text-navy">{title}</h2><p className="mt-2 text-sm text-muted-foreground">This section will be available in a future stage.</p></article>;
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-sky px-4 py-8 sm:px-6 lg:py-12"><div className="mx-auto w-full max-w-4xl"><Link to="/exams" className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-bold text-navy transition hover:text-primary"><ClipboardList size={17} /> Online Exam Portal</Link><section className="mt-6 rounded-xl border border-border bg-background p-6 shadow-xl shadow-navy/10 sm:p-9">{children}</section></div></main>;
}
