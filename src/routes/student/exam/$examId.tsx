import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock3, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "../../../components/ui/button";
import { getExamSessionProfile } from "../../../lib/exam-auth";
import { getExamInstructions, loadExamAttempt, saveExamAnswer, startExamAttempt, submitExamAttempt } from "../../../lib/exam-attempt.functions";

type Instructions = Awaited<ReturnType<ReturnType<typeof getExamInstructions>>>;
type ExamSession = Awaited<ReturnType<ReturnType<typeof startExamAttempt>>>;
type ExamQuestion = ExamSession["questions"][number];

export const Route = createFileRoute("/student/exam/$examId")({
  head: () => ({ meta: [{ title: "Take Exam | Online Exam Portal" }] }),
  component: StudentExam,
});

function StudentExam() {
  const { examId } = Route.useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const loadInstructions = useServerFn(getExamInstructions);
  const start = useServerFn(startExamAttempt);
  const loadAttempt = useServerFn(loadExamAttempt);
  const saveAnswer = useServerFn(saveExamAnswer);
  const submit = useServerFn(submitExamAttempt);
  const [instructions, setInstructions] = useState<Instructions | null>(null);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | null>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const autoSubmitted = useRef(false);

  if (pathname !== `/student/exam/${examId}`) return <Outlet />;

  const applySession = (nextSession: ExamSession) => {
    setSession(nextSession);
    setSelectedAnswers(Object.fromEntries(nextSession.answers.map((answer) => [answer.question_id, answer.selected_option_id])));
    setRemainingSeconds(Math.max(0, nextSession.exam.duration_minutes * 60 - Math.floor((Date.now() - new Date(nextSession.attempt.started_at).getTime()) / 1000)));
  };

  useEffect(() => {
    let active = true;
    void getExamSessionProfile().then(async (profile) => {
      if (!active) return;
      if (!profile) {
        await navigate({ to: "/exams/student-login", replace: true });
        return;
      }
      if (profile.profile.role !== "student") {
        await navigate({ to: "/admin/dashboard", replace: true });
        return;
      }
      try {
        const nextInstructions = await loadInstructions({ data: { examId } });
        if (!active) return;
        setInstructions(nextInstructions);
        if (nextInstructions.activeAttempt) {
          applySession(await loadAttempt({ data: { attemptId: nextInstructions.activeAttempt.id } }));
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Exam could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; };
  }, [examId, navigate]);

  useEffect(() => {
    if (!session) return;
    const timer = window.setInterval(() => {
      const seconds = Math.max(0, session.exam.duration_minutes * 60 - Math.floor((Date.now() - new Date(session.attempt.started_at).getTime()) / 1000));
      setRemainingSeconds(seconds);
      if (seconds === 0 && !autoSubmitted.current) {
        autoSubmitted.current = true;
        void finishExam(true);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session]);

  const beginExam = async () => {
    setError("");
    setLoading(true);
    try {
      applySession(await start({ data: { examId } }));
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Exam could not be started.");
    } finally {
      setLoading(false);
    }
  };

  const chooseAnswer = async (question: ExamQuestion, optionId: string) => {
    if (!session || saving) return;
    setSaving(true);
    setSelectedAnswers((current) => ({ ...current, [question.id]: optionId }));
    try {
      await saveAnswer({ data: { attemptId: session.attempt.id, questionId: question.id, selectedOptionId: optionId } });
    } catch (answerError) {
      setError(answerError instanceof Error ? answerError.message : "Answer could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  async function finishExam(isAutoSubmit = false) {
    if (!session || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      console.info("CLIENT_SUBMIT_START", { attemptId: session.attempt.id, examId });
      const submission = submit({ data: { attemptId: session.attempt.id, autoSubmitted: isAutoSubmit } });
      const response = await Promise.race([
        submission,
        new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error("Exam submission timed out. Please try again.")), 30000)),
      ]);
      console.info("CLIENT_RESPONSE_RECEIVED", response);
      if (!response?.ok || !response.attemptId || !response.examId) throw new Error("Exam submission did not return a valid result.");
      console.info("CLIENT_NAVIGATION_START", { examId: response.examId, attemptId: response.attemptId });
      await navigate({ to: "/student/exam/$examId/result", params: { examId: response.examId } });
      console.info("CLIENT_NAVIGATION_SUCCESS", { examId: response.examId, attemptId: response.attemptId });
    } catch (submitError) {
      console.error("CLIENT_SUBMIT_ERROR", submitError);
      setError(submitError instanceof Error ? submitError.message : "Exam could not be submitted.");
      autoSubmitted.current = false;
    } finally {
      console.info("CLIENT_SUBMIT_FINALLY");
      setSubmitting(false);
    }
  }

  const confirmSubmit = () => {
    if (window.confirm("Are you sure you want to submit your exam? You will not be able to change your answers after submission.")) void finishExam();
  };

  if (loading) return <ExamShell><p className="text-sm font-semibold text-muted-foreground">Loading exam...</p></ExamShell>;
  if (error && !instructions && !session) return <ExamShell><ErrorMessage message={error} /></ExamShell>;
  if (!instructions && !session) return null;
  if (!session) return <InstructionsView instructions={instructions!} error={error} onBack={() => void navigate({ to: "/student/dashboard" })} onStart={() => void beginExam()} />;

  const question = session.questions[questionIndex];
  const progress = session.questions.length ? ((questionIndex + 1) / session.questions.length) * 100 : 0;
  return (
    <ExamShell>
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Online Examination</p><h1 className="mt-2 font-display text-2xl font-extrabold text-navy">{session.exam.title}</h1><p className="mt-1 text-sm font-semibold text-muted-foreground">Student ID: {session.attempt.student_id}</p></div>
        <div className="flex items-center gap-2 rounded-md bg-secondary/15 px-4 py-2 font-display text-lg font-extrabold text-secondary"><Clock3 size={19} /> {formatTime(remainingSeconds)}</div>
      </header>
      {error && <ErrorMessage message={error} />}
      <div className="mt-7 h-2 overflow-hidden rounded-full bg-secondary/15"><div className="h-full bg-secondary transition-all" style={{ width: `${progress}%` }} /></div>
      <div className="mt-3 flex items-center justify-between text-sm font-bold text-muted-foreground"><span>Question {questionIndex + 1} of {session.questions.length}</span><span>{Math.round(progress)}% complete</span></div>
      {question ? <section className="mt-7 rounded-xl border border-border bg-sky p-5 sm:p-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Question {questionIndex + 1}</p><h2 className="mt-3 font-display text-xl font-extrabold leading-relaxed text-navy">{question.question_text}</h2><div className="mt-6 grid gap-3">{question.options.map((option) => <button key={option.id} type="button" disabled={saving} onClick={() => void chooseAnswer(question, option.id)} className={`focus-ring rounded-lg border p-4 text-left text-sm font-semibold transition ${selectedAnswers[question.id] === option.id ? "border-primary bg-primary/10 text-navy" : "border-border bg-background text-foreground hover:border-primary/50"}`}>{option.option_text}</button>)}</div></section> : <p className="mt-7 rounded-md border border-dashed border-primary/30 p-5 text-sm text-muted-foreground">This exam has no questions yet.</p>}
      <footer className="mt-7 flex flex-wrap items-center justify-between gap-3"><Button variant="outline" disabled={questionIndex === 0 || submitting} onClick={() => setQuestionIndex((index) => index - 1)}><ChevronLeft /> Previous</Button><div className="flex gap-3"><Button variant="destructive" disabled={submitting} onClick={confirmSubmit}><Send /> {submitting ? "Submitting..." : "Submit Exam"}</Button><Button disabled={questionIndex >= session.questions.length - 1 || submitting} onClick={() => setQuestionIndex((index) => index + 1)}>Next <ChevronRight /></Button></div></footer>
    </ExamShell>
  );
}

function InstructionsView({ instructions, error, onBack, onStart }: { instructions: Instructions; error: string; onBack: () => void; onStart: () => void }) {
  const hasActiveAttempt = Boolean(instructions.activeAttempt);
  return <ExamShell><button type="button" onClick={onBack} className="focus-ring inline-flex items-center gap-2 text-sm font-bold text-navy hover:text-primary"><ArrowLeft size={17} /> Back to Dashboard</button><div className="mt-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Exam Instructions</p><h1 className="mt-2 font-display text-3xl font-extrabold text-navy">{instructions.exam.title}</h1><p className="mt-2 text-sm font-semibold text-primary">{instructions.exam.course}</p><dl className="mt-7 grid gap-4 sm:grid-cols-4"><Info label="Duration" value={`${instructions.exam.duration_minutes} minutes`} /><Info label="Total Marks" value={String(instructions.exam.total_marks)} /><Info label="Passing Marks" value={String(instructions.exam.passing_marks)} /><Info label="Questions" value={String(instructions.questionCount)} /></dl><div className="mt-7 rounded-lg border border-secondary/30 bg-secondary/10 p-4 text-sm font-semibold text-navy">{hasActiveAttempt ? "You have an exam in progress. Starting will resume your existing attempt and timer." : "The timer starts after you click Start Exam. Refreshing the page will not reset the timer."}</div>{error && <ErrorMessage message={error} />}<div className="mt-7 flex flex-wrap gap-3"><Button variant="outline" onClick={onBack}>Back</Button><Button onClick={onStart}>{hasActiveAttempt ? "Resume Exam" : "Start Exam"}</Button></div></div></ExamShell>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-border bg-sky p-4"><dt className="text-xs font-bold uppercase text-muted-foreground">{label}</dt><dd className="mt-2 font-display text-lg font-extrabold text-navy">{value}</dd></div>; }
function ErrorMessage({ message }: { message: string }) { return <p role="alert" className="mt-5 rounded-md bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">{message}</p>; }
function formatTime(seconds: number) { const minutes = Math.floor(seconds / 60); return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }
function ExamShell({ children }: { children: React.ReactNode }) { return <main className="min-h-screen bg-sky px-4 py-8 sm:px-6 lg:py-12"><div className="mx-auto w-full max-w-4xl"><section className="rounded-xl border border-border bg-background p-6 shadow-xl shadow-navy/10 sm:p-9">{children}</section></div></main>; }
