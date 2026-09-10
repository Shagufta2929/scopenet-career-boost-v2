import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "../../components/ui/button";
import { getExamSessionProfile, signOutExamUser, type ExamProfile } from "../../lib/exam-auth";
import { listStudentAssignments } from "../../lib/assignment-management.functions";

export const Route = createFileRoute("/student/dashboard")({
  head: () => ({ meta: [{ title: "Student Dashboard | Online Exam Portal" }] }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ExamProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutError, setLogoutError] = useState("");
  const [assignments, setAssignments] = useState<
    Awaited<ReturnType<ReturnType<typeof listStudentAssignments>>>
  >([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [assignmentsError, setAssignmentsError] = useState("");
  const loadAssignments = useServerFn(listStudentAssignments);

  useEffect(() => {
    let active = true;
    void getExamSessionProfile().then((session) => {
      if (!active) return;
      if (!session) {
        void navigate({ to: "/exams/student-login", replace: true });
      } else if (session.profile.role !== "student") {
        void navigate({ to: "/admin/dashboard", replace: true });
      } else {
        setProfile(session.profile);
        const loadStudentAssignments = async () => {
          try {
            setAssignments(await loadAssignments());
          } catch {
            setAssignmentsError("Assigned exams could not be loaded right now.");
          } finally {
            setAssignmentsLoading(false);
          }
        };
        void loadStudentAssignments();
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
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

  if (loading)
    return (
      <DashboardShell>
        <p className="text-sm font-semibold text-muted-foreground">Loading your dashboard...</p>
      </DashboardShell>
    );
  if (!profile) return null;

  return (
    <DashboardShell>
      <header className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Student Dashboard
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-navy">
            Welcome, {profile.full_name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Student ID: <strong className="text-navy">{profile.student_id}</strong>
          </p>
        </div>
        <Button variant="outline" onClick={logout}>
          <LogOut /> Logout
        </Button>
      </header>
      {logoutError && (
        <p
          role="alert"
          className="mt-5 rounded-md bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive"
        >
          {logoutError}
        </p>
      )}
      <section className="mt-8 rounded-xl border border-border bg-background p-6 shadow-sm">
        <h2 className="font-display text-xl font-extrabold text-navy">Assigned Exams</h2>
        {assignmentsLoading ? (
          <p className="mt-2 text-sm text-muted-foreground">Loading assigned exams...</p>
        ) : assignmentsError ? (
          <p role="alert" className="mt-2 text-sm font-semibold text-destructive">
            {assignmentsError}
          </p>
        ) : assignments.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No exams have been assigned to you yet.
          </p>
        ) : (
          <div className="mt-5 grid gap-4">
            {assignments.map((assignment) => (
              <article key={assignment.id} className="rounded-lg border border-border bg-sky p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-display text-lg font-extrabold text-navy">
                      {assignment.exam?.title ?? "Assigned Exam"}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-primary">
                      {assignment.exam?.course ?? "-"}
                    </p>
                    <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-muted-foreground">
                      <div>
                        <dt>Duration</dt>
                        <dd className="font-bold text-navy">
                          {assignment.exam?.duration_minutes ?? "-"} minutes
                        </dd>
                      </div>
                      <div>
                        <dt>Total Marks</dt>
                        <dd className="font-bold text-navy">
                          {assignment.exam?.total_marks ?? "-"}
                        </dd>
                      </div>
                      <div>
                        <dt>Passing Marks</dt>
                        <dd className="font-bold text-navy">
                          {assignment.exam?.passing_marks ?? "-"}
                        </dd>
                      </div>
                      <div>
                        <dt>Status</dt>
                        <dd className="font-bold capitalize text-success">{assignment.status}</dd>
                      </div>
                    </dl>
                  </div>
                  {assignment.status === "completed" ? (
                    <Button asChild>
                      <Link
                        to="/student/exam/$examId/result"
                        params={{ examId: assignment.exam_id }}
                      >
                        View Result
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link to="/student/exam/$examId" params={{ examId: assignment.exam_id }}>
                        {assignment.attemptStatus === "in_progress" ? "Resume Exam" : "Start Exam"}
                      </Link>
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-sky px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          to="/exams"
          className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-bold text-navy transition hover:text-primary"
        >
          <UserRound size={17} /> Online Exam Portal
        </Link>
        <section className="mt-6 rounded-xl border border-border bg-background p-6 shadow-xl shadow-navy/10 sm:p-9">
          {children}
        </section>
      </div>
    </main>
  );
}
