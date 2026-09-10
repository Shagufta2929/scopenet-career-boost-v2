import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";

import { Button, buttonVariants } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { getExamSessionProfile } from "../../lib/exam-auth";
import { createExam, deleteExam, listExams, updateExam } from "../../lib/exam-management.functions";
import type { Tables } from "../../integrations/supabase/types";

export const Route = createFileRoute("/admin/exams")({
  head: () => ({ meta: [{ title: "Exams | Admin Dashboard" }] }),
  component: AdminExams,
});

type Exam = Tables<"exams">;

type FormValues = { title: string; description: string; course: string; durationMinutes: string; totalMarks: string; passingMarks: string; isActive: boolean };
const emptyForm: FormValues = { title: "", description: "", course: "", durationMinutes: "", totalMarks: "", passingMarks: "", isActive: true };

function AdminExams() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const loadExams = useServerFn(listExams);
  const addExam = useServerFn(createExam);
  const editExam = useServerFn(updateExam);
  const removeExam = useServerFn(deleteExam);
  const [exams, setExams] = useState<Exam[]>([]);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    try { setExams(await loadExams()); } catch { setError("Exams could not be loaded."); } finally { setLoading(false); }
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

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setError(""); setSuccess(""); setShowForm(true); };
  const openEdit = (exam: Exam) => { setEditingId(exam.id); setForm({ title: exam.title, description: exam.description ?? "", course: exam.course, durationMinutes: String(exam.duration_minutes), totalMarks: String(exam.total_marks), passingMarks: String(exam.passing_marks), isActive: exam.is_active }); setError(""); setSuccess(""); setShowForm(true); };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setSuccess("");
    const duration = Number(form.durationMinutes); const total = Number(form.totalMarks); const passing = Number(form.passingMarks);
    if (!form.title.trim() || !form.course.trim()) return setError("Title and course are required.");
    if (!Number.isInteger(duration) || duration <= 0) return setError("Duration must be greater than 0.");
    if (!Number.isInteger(total) || total <= 0) return setError("Total marks must be greater than 0.");
    if (!Number.isInteger(passing) || passing < 0 || passing > total) return setError("Passing marks must be between 0 and total marks.");
    setSaving(true);
    try {
      const data = { ...form, durationMinutes: String(duration), totalMarks: String(total), passingMarks: String(passing) };
      if (editingId) await editExam({ data: { id: editingId, ...data, durationMinutes: duration, totalMarks: total, passingMarks: passing } });
      else await addExam({ data: { ...data, durationMinutes: duration, totalMarks: total, passingMarks: passing } });
      setSuccess(editingId ? "Exam updated successfully." : "Exam created successfully."); setShowForm(false); await load();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Exam could not be saved."); } finally { setSaving(false); }
  };

  const remove = async (exam: Exam) => {
    if (!window.confirm(`Delete "${exam.title}" and all its questions?`)) return;
    setError("");
    try { await removeExam({ data: { id: exam.id } }); setSuccess("Exam deleted successfully."); await load(); } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Exam could not be deleted."); }
  };

  if (pathname !== "/admin/exams") return <Outlet />;

  return <main className="min-h-screen bg-sky px-4 py-8 sm:px-6 lg:py-12"><div className="mx-auto w-full max-w-6xl"><Link to="/admin/dashboard" className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-bold text-navy transition hover:text-primary"><ArrowLeft size={17} /> Admin Dashboard</Link><section className="mt-6 rounded-xl border border-border bg-background p-6 shadow-xl shadow-navy/10 sm:p-9"><header className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><span className="grid size-12 place-items-center rounded-xl bg-secondary text-secondary-foreground"><FileText /></span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">Exam Management</p><h1 className="mt-2 font-display text-3xl font-extrabold text-navy">Exams</h1><p className="mt-2 text-sm text-muted-foreground">Create and manage examinations and their questions.</p></div></div><Button onClick={openCreate}><Plus /> Create Exam</Button></header>{error && <p role="alert" className="mt-5 rounded-md bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">{error}</p>}{success && <p role="status" className="mt-5 rounded-md bg-success/10 px-3 py-2 text-sm font-semibold text-success">{success}</p>}{showForm && <ExamForm form={form} setForm={setForm} editing={Boolean(editingId)} saving={saving} onSubmit={submit} onCancel={() => setShowForm(false)} />}{loading ? <p className="mt-8 text-sm font-semibold text-muted-foreground">Loading exams...</p> : exams.length === 0 ? <p className="mt-8 rounded-md border border-dashed border-primary/30 p-5 text-sm text-muted-foreground">No exams have been created yet.</p> : <div className="mt-8 overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[60rem] text-left text-sm"><thead className="bg-sky text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Exam Title</th><th className="px-4 py-3">Course</th><th className="px-4 py-3">Duration</th><th className="px-4 py-3">Marks</th><th className="px-4 py-3">Passing</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created Date</th><th className="px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-border">{exams.map((exam) => <tr key={exam.id}><td className="px-4 py-4 font-bold text-navy">{exam.title}</td><td className="px-4 py-4">{exam.course}</td><td className="px-4 py-4">{exam.duration_minutes} min</td><td className="px-4 py-4">{exam.total_marks}</td><td className="px-4 py-4">{exam.passing_marks}</td><td className="px-4 py-4"><span className={exam.is_active ? "font-bold text-success" : "font-bold text-muted-foreground"}>{exam.is_active ? "Active" : "Inactive"}</span></td><td className="px-4 py-4">{new Date(exam.created_at).toLocaleDateString()}</td><td className="px-4 py-4"><div className="flex flex-wrap gap-2"><Link to="/admin/exams/$examId/questions" params={{ examId: exam.id }} className={buttonVariants({ size: "sm" })}>Manage Questions</Link><Button size="sm" variant="outline" onClick={() => openEdit(exam)}><Pencil /></Button><Button size="sm" variant="destructive" onClick={() => void remove(exam)}><Trash2 /></Button></div></td></tr>)}</tbody></table></div>}</section></div></main>;
}

function ExamForm({ form, setForm, editing, saving, onSubmit, onCancel }: { form: FormValues; setForm: (form: FormValues) => void; editing: boolean; saving: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  const update = (key: keyof FormValues, value: string | boolean) => setForm({ ...form, [key]: value });
  return <form onSubmit={onSubmit} className="mt-8 rounded-xl border border-border bg-sky p-5 sm:p-6"><div className="grid gap-5 sm:grid-cols-2"><Field label="Exam Title" value={form.title} onChange={(event) => update("title", event.target.value)} /><Field label="Course" value={form.course} onChange={(event) => update("course", event.target.value)} /><Field label="Duration in minutes" type="number" min="1" value={form.durationMinutes} onChange={(event) => update("durationMinutes", event.target.value)} /><Field label="Total Marks" type="number" min="1" value={form.totalMarks} onChange={(event) => update("totalMarks", event.target.value)} /><Field label="Passing Marks" type="number" min="0" value={form.passingMarks} onChange={(event) => update("passingMarks", event.target.value)} /><label className="flex items-center gap-3 pt-7 text-sm font-bold text-navy"><input type="checkbox" checked={form.isActive} onChange={(event) => update("isActive", event.target.checked)} /> Active exam</label><label className="grid gap-2 text-sm font-bold text-navy sm:col-span-2">Description<textarea value={form.description} onChange={(event) => update("description", event.target.value)} rows={3} className="focus-ring resize-none rounded-md border border-input bg-background p-3 font-normal text-foreground" /></label></div><div className="mt-5 flex flex-wrap gap-3"><Button type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Update Exam" : "Create Exam"}</Button><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button></div></form>;
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) { return <label className="grid gap-2 text-sm font-bold text-navy">{label}<Input required {...props} /></label>; }