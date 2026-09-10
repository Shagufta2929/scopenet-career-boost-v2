import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ClipboardCheck, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "../../components/ui/button";
import { getExamSessionProfile } from "../../lib/exam-auth";
import { listAdminResults } from "../../lib/admin-results.functions";

type Result = Awaited<ReturnType<ReturnType<typeof listAdminResults>>>[number];
type StatusFilter = "all" | "submitted" | "auto_submitted";
type ResultFilter = "all" | "passed" | "failed";

export const Route = createFileRoute("/admin/results")({
  head: () => ({ meta: [{ title: "Exam Results | Admin Dashboard" }] }),
  component: AdminResults,
});

function AdminResults() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const loadResults = useServerFn(listAdminResults);
  const [results, setResults] = useState<Result[]>([]);
  const [search, setSearch] = useState("");
  const [examFilter, setExamFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [loading, setLoading] = useState(true);
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
          setResults(await loadResults());
        } catch (loadError) {
          if (active) setError(loadError instanceof Error ? loadError.message : "Results could not be loaded.");
        } finally {
          if (active) setLoading(false);
        }
      }
    });
    return () => { active = false; };
  }, [navigate]);

  const exams = useMemo(() => [...new Map(results.filter((result) => result.exam).map((result) => [result.exam!.id, result.exam!])).values()].sort((left, right) => left.title.localeCompare(right.title)), [results]);
  const filteredResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    return results.filter((result) => {
      const percentage = getPercentage(result);
      const matchesSearch = !query || [result.student?.full_name, result.student?.student_id, result.exam?.title].some((value) => value?.toLowerCase().includes(query));
      const matchesExam = examFilter === "all" || result.exam_id === examFilter;
      const matchesStatus = statusFilter === "all" || result.status === statusFilter;
      const matchesResult = resultFilter === "all" || (result.exam ? (percentage >= result.exam.passing_marks / result.exam.total_marks * 100 ? "passed" : "failed") : "failed") === resultFilter;
      return matchesSearch && matchesExam && matchesStatus && matchesResult;
    });
  }, [examFilter, resultFilter, results, search, statusFilter]);
  const passedCount = results.filter((result) => result.exam && getPercentage(result) >= result.exam.passing_marks / result.exam.total_marks * 100).length;
  const averageScore = results.length ? results.reduce((total, result) => total + getPercentage(result), 0) / results.length : 0;

  if (pathname !== "/admin/results") return <Outlet />;
  return <main className="min-h-screen bg-sky px-4 py-8 sm:px-6 lg:py-12"><div className="mx-auto w-full max-w-7xl"><Link to="/admin/dashboard" className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-bold text-navy transition hover:text-primary"><ArrowLeft size={17} /> Admin Dashboard</Link><section className="mt-6 rounded-xl border border-border bg-background p-6 shadow-xl shadow-navy/10 sm:p-9"><header className="flex items-start gap-4 border-b border-border pb-7"><span className="grid size-12 place-items-center rounded-xl bg-secondary text-secondary-foreground"><ClipboardCheck /></span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-destructive">Result Management</p><h1 className="mt-2 font-display text-3xl font-extrabold text-navy">Exam Results</h1><p className="mt-2 text-sm text-muted-foreground">View and manage student examination results.</p></div></header>{error && <p role="alert" className="mt-5 rounded-md bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">{error}</p>}{loading ? <p className="mt-8 text-sm font-semibold text-muted-foreground">Loading results...</p> : <><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Summary label="Total Results" value={String(results.length)} /><Summary label="Passed" value={String(passedCount)} /><Summary label="Failed" value={String(results.length - passedCount)} /><Summary label="Average Score" value={`${averageScore.toFixed(1)}%`} /></div><div className="mt-8 grid gap-3 rounded-xl border border-border bg-sky p-5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]"><label className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student or exam" className="focus-ring h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm" /></label><select value={examFilter} onChange={(event) => setExamFilter(event.target.value)} className="focus-ring h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="all">All Exams</option>{exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.title}</option>)}</select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="focus-ring h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="all">All Statuses</option><option value="submitted">Submitted</option><option value="auto_submitted">Auto Submitted</option></select><select value={resultFilter} onChange={(event) => setResultFilter(event.target.value as ResultFilter)} className="focus-ring h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="all">All Results</option><option value="passed">Passed</option><option value="failed">Failed</option></select><Button variant="outline" onClick={() => { setSearch(""); setExamFilter("all"); setStatusFilter("all"); setResultFilter("all"); }}><X /> Clear</Button></div>{filteredResults.length === 0 ? <div className="mt-8 rounded-md border border-dashed border-primary/30 p-8 text-center"><p className="font-display font-extrabold text-navy">No exam results yet.</p><p className="mt-2 text-sm text-muted-foreground">Submitted examination results will appear here.</p></div> : <div className="mt-8 overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[62rem] text-left text-sm"><thead className="bg-sky text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Student ID</th><th className="px-4 py-3">Exam</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Percentage</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y divide-border">{filteredResults.map((result) => <tr key={result.id}><td className="px-4 py-4 font-bold text-navy">{result.student?.full_name ?? "-"}</td><td className="px-4 py-4">{result.student?.student_id ?? "-"}</td><td className="px-4 py-4">{result.exam?.title ?? "-"}</td><td className="px-4 py-4">{result.score} / {result.exam?.total_marks ?? "-"}</td><td className="px-4 py-4">{getPercentage(result).toFixed(1)}%</td><td className="px-4 py-4"><span className="font-bold capitalize text-success">{formatStatus(result.status)}</span></td><td className="px-4 py-4">{formatDate(result.submitted_at)}</td><td className="px-4 py-4"><Button asChild size="sm"><Link to="/admin/results/$attemptId" params={{ attemptId: result.id }}>View Result</Link></Button></td></tr>)}</tbody></table></div>}</>}</section></div></main>;
}

function getPercentage(result: Result) { return result.exam?.total_marks ? Number(result.score) / result.exam.total_marks * 100 : 0; }
function formatStatus(status: Result["status"]) { return status === "auto_submitted" ? "Auto Submitted" : "Submitted"; }
function formatDate(value: string | null) { return value ? new Date(value).toLocaleString() : "-"; }
function Summary({ label, value }: { label: string; value: string }) { return <article className="rounded-xl border border-border bg-sky p-5"><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 font-display text-2xl font-extrabold text-navy">{value}</p></article>; }
