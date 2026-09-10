import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "../../../components/ui/button";
import { getExamSessionProfile } from "../../../lib/exam-auth";
import { getAdminResult } from "../../../lib/admin-results.functions";

type Result = Awaited<ReturnType<ReturnType<typeof getAdminResult>>>;

export const Route = createFileRoute("/admin/results/$attemptId")({
  head: () => ({ meta: [{ title: "Result Details | Admin Dashboard" }] }),
  component: AdminResultDetails,
});

function AdminResultDetails() {
  const { attemptId } = Route.useParams();
  const navigate = useNavigate();
  const loadResult = useServerFn(getAdminResult);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void getExamSessionProfile().then(async (session) => {
      if (!active) return;
      if (!session) {
        await navigate({ to: "/exams/admin-login", replace: true });
      } else if (session.profile.role !== "admin") {
        await navigate({ to: "/student/dashboard", replace: true });
      } else {
        try {
          const loadedResult = await loadResult({ data: { attemptId } });
          if (!loadedResult || !loadedResult.exam || !loadedResult.student) {
            setError("Result not found.");
            return;
          }
          setResult(loadedResult);
        } catch (loadError) {
          if (active) setError(loadError instanceof Error ? loadError.message : "Result could not be loaded.");
        }
      }
    });
    return () => { active = false; };
  }, [attemptId, navigate]);

  if (error) return <ResultShell><p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">{error}</p><Button className="mt-5" onClick={() => void navigate({ to: "/admin/results" })}>Back to Results</Button></ResultShell>;
  if (!result) return <ResultShell><p className="text-sm font-semibold text-muted-foreground">Loading result...</p></ResultShell>;
  const score = Number(result.attempt.score);
  const totalMarks = Number(result.exam.total_marks);
  const correctAnswers = Number(result.attempt.correct_answers);
  const totalQuestions = Number(result.attempt.total_questions);
  const percentage = Number.isFinite(score) && Number.isFinite(totalMarks) && totalMarks > 0 ? score / totalMarks * 100 : null;
  const incorrect = Number.isFinite(totalQuestions) && Number.isFinite(correctAnswers) ? Math.max(0, totalQuestions - correctAnswers) : null;
  const passed = percentage !== null && score >= Number(result.exam.passing_marks);
  return <ResultShell><div className="flex flex-wrap items-center justify-between gap-3"><Link to="/admin/results" className="focus-ring inline-flex items-center gap-2 text-sm font-bold text-navy hover:text-primary"><ArrowLeft size={17} /> Back to Results</Link><Link to="/admin/dashboard" className="focus-ring text-sm font-bold text-navy hover:text-primary">Admin Dashboard</Link></div><header className="mt-7 border-b border-border pb-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-destructive">Result Management</p><h1 className="mt-2 font-display text-3xl font-extrabold text-navy">{result.exam.title}</h1><p className="mt-2 text-sm text-muted-foreground">{result.student.full_name} · {result.student.student_id}</p></header><section className="mt-7 flex items-center gap-3 rounded-xl border border-border bg-sky p-5">{passed ? <CheckCircle2 className="text-success" /> : <XCircle className="text-destructive" />}<div><p className="text-xs font-bold uppercase text-muted-foreground">Final Result</p><p className={`font-display text-2xl font-extrabold ${passed ? "text-success" : "text-destructive"}`}>{passed ? "PASSED" : "FAILED"}</p></div></section><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Stat label="Student Name" value={result.student.full_name} /><Stat label="Student ID" value={result.student.student_id ?? "-"} /><Stat label="Course" value={result.exam.course} /><Stat label="Duration" value={`${result.exam.duration_minutes} minutes`} /><Stat label="Total Marks" value={String(result.exam.total_marks)} /><Stat label="Passing Marks" value={String(result.exam.passing_marks)} /><Stat label="Score" value={`${result.attempt.score} / ${result.exam.total_marks}`} /><Stat label="Percentage" value={percentage === null ? "-" : `${percentage.toFixed(1)}%`} /><Stat label="Correct Answers" value={Number.isFinite(correctAnswers) ? String(correctAnswers) : "-"} /><Stat label="Incorrect Answers" value={incorrect === null ? "-" : String(incorrect)} /><Stat label="Total Questions" value={Number.isFinite(totalQuestions) ? String(totalQuestions) : "-"} /><Stat label="Status" value={result.attempt.status === "auto_submitted" ? "Auto Submitted" : "Submitted"} /><Stat label="Started At" value={new Date(result.attempt.started_at).toLocaleString()} /><Stat label="Submitted At" value={result.attempt.submitted_at ? new Date(result.attempt.submitted_at).toLocaleString() : "-"} /></div></ResultShell>;
}

function Stat({ label, value }: { label: string; value: string }) { return <article className="rounded-lg border border-border bg-sky p-4"><p className="text-xs font-bold uppercase text-muted-foreground">{label}</p><p className="mt-2 font-display font-extrabold text-navy">{value}</p></article>; }
function ResultShell({ children }: { children: React.ReactNode }) { return <main className="min-h-screen bg-sky px-4 py-8 sm:px-6 lg:py-12"><div className="mx-auto w-full max-w-7xl"><section className="rounded-xl border border-border bg-background p-6 shadow-xl shadow-navy/10 sm:p-9">{children}</section></div></main>; }
