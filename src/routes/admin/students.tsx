import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus, Users } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { createExamStudent, listExamStudents } from "../../lib/student-management.functions";
import { getExamSessionProfile } from "../../lib/exam-auth";

export const Route = createFileRoute("/admin/students")({
  head: () => ({ meta: [{ title: "Students | Admin Dashboard" }] }),
  component: AdminStudents,
});

type Student = { id: string; studentId: string | null; fullName: string; course: string; createdAt: string };

function AdminStudents() {
  const navigate = useNavigate();
  const loadStudents = useServerFn(listExamStudents);
  const createStudent = useServerFn(createExamStudent);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setStudents(await loadStudents());
    } catch {
      setError("Students could not be loaded. Please sign in as an administrator.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void getExamSessionProfile().then((session) => {
      if (!active) return;
      if (!session) void navigate({ to: "/exams/admin-login", replace: true });
      else if (session.profile.role !== "admin") void navigate({ to: "/student/dashboard", replace: true });
      else void load();
    });
    return () => { active = false; };
  }, [navigate]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    const form = event.currentTarget;
    const values = new FormData(form);
    try {
      await createStudent({ data: { studentId: String(values.get("studentId") ?? ""), fullName: String(values.get("fullName") ?? ""), password: String(values.get("password") ?? ""), course: String(values.get("course") ?? "") } });
      form.reset();
      setSuccess("Student created successfully.");
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Student could not be created.");
    } finally {
      setSaving(false);
    }
  };

  return <main className="min-h-screen bg-sky px-4 py-8 sm:px-6 lg:py-12"><div className="mx-auto w-full max-w-5xl"><Link to="/admin/dashboard" className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-bold text-navy transition hover:text-primary"><ArrowLeft size={17} /> Admin Dashboard</Link><section className="mt-6 rounded-xl border border-border bg-background p-6 shadow-xl shadow-navy/10 sm:p-9"><header className="flex items-start gap-4 border-b border-border pb-7"><span className="grid size-12 place-items-center rounded-xl bg-secondary text-secondary-foreground"><Users /></span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Student Management</p><h1 className="mt-2 font-display text-3xl font-extrabold text-navy">Students</h1><p className="mt-2 text-sm text-muted-foreground">Create and review exam portal student accounts.</p></div></header><form onSubmit={submit} className="mt-8 rounded-xl border border-border bg-sky p-5 sm:p-6"><div className="flex items-center gap-2"><Plus size={18} className="text-primary" /><h2 className="font-display text-xl font-extrabold text-navy">Create Student</h2></div><div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="Student ID" name="studentId" placeholder="e.g. SCN1001" /><Field label="Full Name" name="fullName" placeholder="Enter full name" /><Field label="Password" name="password" type="password" placeholder="Set a secure password" autoComplete="new-password" /><Field label="Course" name="course" placeholder="Enter course name" /></div>{error && <p role="alert" className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">{error}</p>}{success && <p role="status" className="mt-4 rounded-md bg-success/10 px-3 py-2 text-sm font-semibold text-success">{success}</p>}<Button type="submit" disabled={saving} className="mt-5">{saving ? "Creating student..." : "Create Student"}</Button></form><section className="mt-8"><h2 className="font-display text-xl font-extrabold text-navy">Student Accounts</h2>{loading ? <p className="mt-4 text-sm font-semibold text-muted-foreground">Loading students...</p> : students.length === 0 ? <p className="mt-4 rounded-md border border-dashed border-primary/30 p-5 text-sm text-muted-foreground">No students have been created yet.</p> : <div className="mt-4 overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[42rem] text-left text-sm"><thead className="bg-sky text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Student ID</th><th className="px-4 py-3">Full Name</th><th className="px-4 py-3">Course</th><th className="px-4 py-3">Created Date</th><th className="px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-border">{students.map((student) => <tr key={student.id}><td className="px-4 py-4 font-bold text-navy">{student.studentId}</td><td className="px-4 py-4">{student.fullName}</td><td className="px-4 py-4">{student.course || "-"}</td><td className="px-4 py-4">{new Date(student.createdAt).toLocaleDateString()}</td><td className="px-4 py-4 text-muted-foreground">No actions yet</td></tr>)}</tbody></table></div>}</section></section></div></main>;
}

function Field({ label, name, ...props }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className="grid gap-2 text-sm font-bold text-navy">{label}<Input name={name} required {...props} /></label>;
}