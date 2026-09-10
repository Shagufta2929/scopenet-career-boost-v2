import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "../../../../components/ui/button";
import { getExamSessionProfile } from "../../../../lib/exam-auth";
import { getExamResult } from "../../../../lib/exam-attempt.functions";

type Result = Awaited<ReturnType<ReturnType<typeof getExamResult>>>;

export const Route = createFileRoute("/student/exam/$examId/result")({
  head: () => ({ meta: [{ title: "Exam Result | Online Exam Portal" }] }),
  component: ExamResult,
});

function ExamResult() {
  const { examId } = Route.useParams();
  const navigate = useNavigate();
  const loadResult = useServerFn(getExamResult);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void getExamSessionProfile().then(async (session) => {
      if (!active) return;
      if (!session) {
        await navigate({ to: "/exams/student-login", replace: true });
        return;
      }
      if (session.profile.role !== "student") {
        await navigate({ to: "/admin/dashboard", replace: true });
        return;
      }
      try {
        setResult(await loadResult({ data: { examId } }));
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Exam result could not be loaded.");
      }
    });
    return () => { active = false; };
  }, [examId, navigate]);

  if (error) return <ResultShell><p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">{error}</p><Button className="mt-5" onClick={() => void navigate({ to: "/student/dashboard" })}>Back to Dashboard</Button></ResultShell>;
  if (!result) return <ResultShell><p className="text-sm font-semibold text-muted-foreground">Loading result...</p></ResultShell>;

  const incorrectAnswers = Math.max(0, result.attempt.total_questions - result.attempt.correct_answers);
  const passed = Number(result.attempt.score) >= result.exam.passing_marks;
  return <ResultShell><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Exam Result</p><h1 className="mt-2 font-display text-3xl font-extrabold text-navy">{result.exam.title}</h1><p className="mt-2 text-sm font-semibold text-primary">Student ID: {result.profile.student_id}</p><section className="mt-7 rounded-xl border border-border bg-sky p-6"><div className="flex items-center gap-3">{passed ? <CheckCircle2 className="text-success" /> : <XCircle className="text-destructive" />}<div><p className="text-sm font-bold text-muted-foreground">Result</p><p className={`font-display text-2xl font-extrabold ${passed ? "text-success" : "text-destructive"}`}>{passed ? "PASS" : "FAIL"}</p></div></div><div className="mt-7 grid gap-4 sm:grid-cols-2"><ResultStat label="Score" value={`${result.attempt.score} / ${result.exam.total_marks}`} /><ResultStat label="Correct" value={String(result.attempt.correct_answers)} /><ResultStat label="Incorrect" value={String(incorrectAnswers)} /><ResultStat label="Total Questions" value={String(result.attempt.total_questions)} /><ResultStat label="Passing Marks" value={String(result.exam.passing_marks)} /><ResultStat label="Submitted" value={result.attempt.submitted_at ? new Date(result.attempt.submitted_at).toLocaleString() : "-"} /></div></section><Button variant="outline" className="mt-7" onClick={() => void navigate({ to: "/student/dashboard" })}><ArrowLeft /> Back to Dashboard</Button></ResultShell>;
}

function ResultStat({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-border bg-background p-4"><p className="text-xs font-bold uppercase text-muted-foreground">{label}</p><p className="mt-2 font-display text-lg font-extrabold text-navy">{value}</p></div>; }
function ResultShell({ children }: { children: React.ReactNode }) { return <main className="min-h-screen bg-sky px-4 py-8 sm:px-6 lg:py-12"><div className="mx-auto w-full max-w-4xl"><section className="rounded-xl border border-border bg-background p-6 shadow-xl shadow-navy/10 sm:p-9">{children}</section></div></main>; }
