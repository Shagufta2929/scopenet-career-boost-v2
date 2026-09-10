import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ClipboardList, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "../../components/ui/button";
import { getExamSessionProfile } from "../../lib/exam-auth";
import {
  createAssignment,
  deleteAssignment,
  getAssignmentOptions,
  listAssignments,
  reassignExam,
} from "../../lib/assignment-management.functions";

type Assignment = Awaited<ReturnType<ReturnType<typeof listAssignments>>>[number];
type Options = Awaited<ReturnType<ReturnType<typeof getAssignmentOptions>>>;

export const Route = createFileRoute("/admin/assignments")({
  head: () => ({ meta: [{ title: "Exam Assignments | Admin Dashboard" }] }),
  component: AdminAssignments,
});

function AdminAssignments() {
  const navigate = useNavigate();
  const loadOptions = useServerFn(getAssignmentOptions);
  const loadAssignments = useServerFn(listAssignments);
  const assign = useServerFn(createAssignment);
  const remove = useServerFn(deleteAssignment);
  const reassign = useServerFn(reassignExam);
  const [options, setOptions] = useState<Options>({ exams: [], students: [] });
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [examId, setExamId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reassigningId, setReassigningId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setOptions(await loadOptions());
    } catch (optionsError) {
      setError(
        optionsError instanceof Error
          ? optionsError.message
          : "Assignment options could not be loaded.",
      );
    }
    try {
      setAssignments(await loadAssignments());
    } catch (assignmentsError) {
      setError(
        assignmentsError instanceof Error
          ? assignmentsError.message
          : "Assignments could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void getExamSessionProfile().then((session) => {
      if (!active) return;
      if (!session) void navigate({ to: "/exams/admin-login", replace: true });
      else if (session.profile.role !== "admin")
        void navigate({ to: "/student/dashboard", replace: true });
      else void load();
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  const submit = async () => {
    setError("");
    setSuccess("");
    if (!examId || !studentId) {
      setError("Select an exam and a student.");
      return;
    }
    setSaving(true);
    try {
      await assign({ data: { examId, studentId } });
      setExamId("");
      setStudentId("");
      setSuccess("Exam assigned successfully.");
      await load();
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : "Exam could not be assigned.");
    } finally {
      setSaving(false);
    }
  };

  const removeAssignment = async (assignment: Assignment) => {
    if (!window.confirm("Remove this exam assignment?")) return;
    setError("");
    try {
      await remove({ data: { id: assignment.id } });
      setSuccess("Assignment removed successfully.");
      await load();
    } catch (removeError) {
      setError(
        removeError instanceof Error ? removeError.message : "Assignment could not be removed.",
      );
    }
  };

  const reassignAssignment = async (assignment: Assignment) => {
    const examTitle = assignment.exam?.title ?? "this exam";
    const studentId = assignment.student?.student_id ?? "this student";
    if (
      !window.confirm(
        `Reassign ${examTitle} to ${studentId}?\n\nThe previous result will be kept in history and the student will receive a new attempt.`,
      )
    )
      return;
    setError("");
    setSuccess("");
    setReassigningId(assignment.id);
    try {
      await reassign({ data: { id: assignment.id } });
      setSuccess("Exam reassigned successfully. The student can start a new attempt.");
      await load();
    } catch (reassignError) {
      setError(
        reassignError instanceof Error ? reassignError.message : "Exam could not be reassigned.",
      );
    } finally {
      setReassigningId(null);
    }
  };

  const canReassign = (assignment: Assignment) => {
    const latest = assignment.latestAttempt;
    return (
      Boolean(latest?.submitted_at) &&
      !assignment.activeAttempt &&
      Number(latest.score) < Number(assignment.exam?.passing_marks ?? 0) &&
      (assignment.status === "completed" || assignment.assigned_at <= latest.submitted_at)
    );
  };

  return (
    <main className="min-h-screen bg-sky px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <Link
          to="/admin/dashboard"
          className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-bold text-navy transition hover:text-primary"
        >
          <ArrowLeft size={17} /> Admin Dashboard
        </Link>
        <section className="mt-6 rounded-xl border border-border bg-background p-6 shadow-xl shadow-navy/10 sm:p-9">
          <header className="flex items-start gap-4 border-b border-border pb-7">
            <span className="grid size-12 place-items-center rounded-xl bg-secondary text-secondary-foreground">
              <ClipboardList />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                Assignment Management
              </p>
              <h1 className="mt-2 font-display text-3xl font-extrabold text-navy">
                Exam Assignments
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Assign existing examinations to registered students.
              </p>
            </div>
          </header>
          <section className="mt-8 rounded-xl border border-border bg-sky p-5 sm:p-6">
            <h2 className="font-display text-xl font-extrabold text-navy">Create Assignment</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="grid gap-2 text-sm font-bold text-navy">
                Exam
                <select
                  value={examId}
                  onChange={(event) => setExamId(event.target.value)}
                  className="focus-ring h-10 rounded-md border border-input bg-background px-3 font-normal text-foreground"
                >
                  <option value="">Select an exam</option>
                  {options.exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title} - {exam.course}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold text-navy">
                Student
                <select
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                  className="focus-ring h-10 rounded-md border border-input bg-background px-3 font-normal text-foreground"
                >
                  <option value="">Select a student</option>
                  {options.students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.student_id} - {student.full_name}
                    </option>
                  ))}
                </select>
              </label>
              <Button onClick={() => void submit()} disabled={saving}>
                {saving ? "Assigning..." : "Assign Exam"}
              </Button>
            </div>
          </section>
          {error && (
            <p
              role="alert"
              className="mt-5 rounded-md bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive"
            >
              {error}
            </p>
          )}
          {success && (
            <p
              role="status"
              className="mt-5 rounded-md bg-success/10 px-3 py-2 text-sm font-semibold text-success"
            >
              {success}
            </p>
          )}
          <section className="mt-8">
            <h2 className="font-display text-xl font-extrabold text-navy">Existing Assignments</h2>
            {loading ? (
              <p className="mt-4 text-sm font-semibold text-muted-foreground">
                Loading assignments...
              </p>
            ) : assignments.length === 0 ? (
              <p className="mt-4 rounded-md border border-dashed border-primary/30 p-5 text-sm text-muted-foreground">
                No exams have been assigned yet.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[60rem] text-left text-sm">
                  <thead className="bg-sky text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Exam Title</th>
                      <th className="px-4 py-3">Student ID</th>
                      <th className="px-4 py-3">Student Name</th>
                      <th className="px-4 py-3">Course</th>
                      <th className="px-4 py-3">Assigned Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {assignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="px-4 py-4 font-bold text-navy">
                          {assignment.exam?.title ?? "-"}
                        </td>
                        <td className="px-4 py-4">{assignment.student?.student_id ?? "-"}</td>
                        <td className="px-4 py-4">{assignment.student?.full_name ?? "-"}</td>
                        <td className="px-4 py-4">{assignment.exam?.course ?? "-"}</td>
                        <td className="px-4 py-4">
                          {new Date(assignment.assigned_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 font-bold text-success">{assignment.status}</td>
                        <td className="px-4 py-4">
                          {assignment.activeAttempt && (
                            <span className="mr-3 text-xs font-semibold text-muted-foreground">
                              Active attempt in progress
                            </span>
                          )}
                          {canReassign(assignment) && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={reassigningId === assignment.id}
                              onClick={() => void reassignAssignment(assignment)}
                            >
                              <RotateCcw />{" "}
                              {reassigningId === assignment.id ? "Reassigning..." : "Reassign Exam"}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => void removeAssignment(assignment)}
                          >
                            <Trash2 /> Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
