import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { attachExamAuth } from "../integrations/supabase/exam-auth-client-middleware";
import { requireExamAdmin } from "../integrations/supabase/exam-auth-server-middleware";
import { requireExamStudent } from "../integrations/supabase/exam-auth-student-middleware";

const adminMiddleware = [attachExamAuth, requireExamAdmin] as const;
const studentMiddleware = [attachExamAuth, requireExamStudent] as const;

const assignmentInput = z.object({
  examId: z.string().uuid(),
  studentId: z.string().uuid(),
});
const reassignInput = z.object({ id: z.string().uuid() });

export const getAssignmentOptions = createServerFn({ method: "GET" })
  .middleware(adminMiddleware)
  .handler(async () => {
    const { examSupabaseAdmin } = await import("../integrations/supabase/exam-client.server");
    const [exams, profiles] = await Promise.all([
      examSupabaseAdmin.from("exams").select("id, title, course").order("title"),
      examSupabaseAdmin
        .from("profiles")
        .select("id, student_id, full_name")
        .eq("role", "student")
        .order("student_id"),
    ]);
    if (exams.error || profiles.error) throw new Error("Assignment options could not be loaded.");
    return { exams: exams.data ?? [], students: profiles.data ?? [] };
  });

export const listAssignments = createServerFn({ method: "GET" })
  .middleware(adminMiddleware)
  .handler(async () => {
    const { examSupabaseAdmin } = await import("../integrations/supabase/exam-client.server");
    const assignments = await examSupabaseAdmin
      .from("exam_assignments")
      .select("id, exam_id, student_id, assigned_at, status")
      .order("assigned_at", { ascending: false });
    if (assignments.error) {
      console.error("Failed to load exam assignments", assignments.error);
      throw new Error(`Assignments could not be loaded: ${assignments.error.message}`);
    }

    const examIds = [...new Set((assignments.data ?? []).map((assignment) => assignment.exam_id))];
    const studentIds = [
      ...new Set((assignments.data ?? []).map((assignment) => assignment.student_id)),
    ];
    const [exams, profiles] = await Promise.all([
      examIds.length
        ? examSupabaseAdmin
            .from("exams")
            .select("id, title, course, total_marks, passing_marks")
            .in("id", examIds)
        : Promise.resolve({ data: [], error: null }),
      studentIds.length
        ? examSupabaseAdmin
            .from("profiles")
            .select("id, student_id, full_name")
            .in("id", studentIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (exams.error || profiles.error) {
      const error = exams.error ?? profiles.error;
      console.error("Failed to load exam assignment details", error);
      throw new Error(
        `Assignments could not be loaded: ${error?.message ?? "assignment details could not be loaded"}`,
      );
    }
    const users = await examSupabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (users.error) {
      console.error("Failed to load exam assignment student metadata", users.error);
      throw new Error(`Assignments could not be loaded: ${users.error.message}`);
    }
    const examById = new Map((exams.data ?? []).map((exam) => [exam.id, exam]));
    const metadataById = new Map(users.data.users.map((user) => [user.id, user.user_metadata]));
    const studentById = new Map(
      (profiles.data ?? []).map((profile) => [
        profile.id,
        {
          ...profile,
          course: String(metadataById.get(profile.id)?.course ?? ""),
        },
      ]),
    );
    const attempts = studentIds.length
      ? await examSupabaseAdmin
          .from("exam_attempts")
          .select("exam_id, student_id, status, score, submitted_at, started_at")
          .in("exam_id", examIds)
          .in("student_id", studentIds)
          .order("started_at", { ascending: false })
      : { data: [], error: null };
    if (attempts.error)
      throw new Error(`Assignments could not be loaded: ${attempts.error.message}`);
    const activeAttemptByAssignment = new Set<string>();
    const submittedAttemptByAssignment = new Map<
      string,
      {
        status: "submitted" | "auto_submitted";
        score: number;
        submitted_at: string | null;
        started_at: string;
      }
    >();
    for (const attempt of attempts.data ?? []) {
      const key = `${attempt.exam_id}:${attempt.student_id}`;
      if (attempt.status === "in_progress") {
        activeAttemptByAssignment.add(key);
      } else {
        const current = submittedAttemptByAssignment.get(key);
        if (!current || (attempt.submitted_at ?? "") > (current.submitted_at ?? "")) {
          submittedAttemptByAssignment.set(key, attempt);
        }
      }
    }
    return (assignments.data ?? []).map((assignment) => ({
      ...assignment,
      exam: examById.get(assignment.exam_id) ?? null,
      student: studentById.get(assignment.student_id) ?? null,
      activeAttempt: activeAttemptByAssignment.has(
        `${assignment.exam_id}:${assignment.student_id}`,
      ),
      latestAttempt:
        submittedAttemptByAssignment.get(`${assignment.exam_id}:${assignment.student_id}`) ?? null,
    }));
  });

export const createAssignment = createServerFn({ method: "POST" })
  .middleware(adminMiddleware)
  .validator((input: z.input<typeof assignmentInput>) => assignmentInput.parse(input))
  .handler(async ({ data }) => {
    const { examSupabaseAdmin } = await import("../integrations/supabase/exam-client.server");
    const { error } = await examSupabaseAdmin
      .from("exam_assignments")
      .insert({ exam_id: data.examId, student_id: data.studentId });
    if (error)
      throw new Error(
        error.code === "23505"
          ? "This exam is already assigned to that student."
          : "Exam could not be assigned.",
      );
    return { ok: true };
  });

export const deleteAssignment = createServerFn({ method: "POST" })
  .middleware(adminMiddleware)
  .validator((input: { id: string }) => ({ id: z.string().uuid().parse(input.id) }))
  .handler(async ({ data }) => {
    const { examSupabaseAdmin } = await import("../integrations/supabase/exam-client.server");
    const { error } = await examSupabaseAdmin.from("exam_assignments").delete().eq("id", data.id);
    if (error) throw new Error("Assignment could not be removed.");
    return { ok: true };
  });

export const reassignExam = createServerFn({ method: "POST" })
  .middleware(adminMiddleware)
  .validator((input: z.input<typeof reassignInput>) => reassignInput.parse(input))
  .handler(async ({ data }) => {
    const { examSupabaseAdmin } = await import("../integrations/supabase/exam-client.server");
    const assignment = await examSupabaseAdmin
      .from("exam_assignments")
      .select("id, exam_id, student_id, assigned_at, status")
      .eq("id", data.id)
      .maybeSingle();
    if (assignment.error || !assignment.data) throw new Error("Assignment could not be found.");

    const [exam, activeAttempt, latestAttempt] = await Promise.all([
      examSupabaseAdmin
        .from("exams")
        .select("total_marks, passing_marks")
        .eq("id", assignment.data.exam_id)
        .maybeSingle(),
      examSupabaseAdmin
        .from("exam_attempts")
        .select("id")
        .eq("exam_id", assignment.data.exam_id)
        .eq("student_id", assignment.data.student_id)
        .eq("status", "in_progress")
        .maybeSingle(),
      examSupabaseAdmin
        .from("exam_attempts")
        .select("status, score, submitted_at")
        .eq("exam_id", assignment.data.exam_id)
        .eq("student_id", assignment.data.student_id)
        .in("status", ["submitted", "auto_submitted"])
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (exam.error || !exam.data) throw new Error("Exam could not be loaded.");
    if (activeAttempt.error) throw new Error("Active exam attempt could not be checked.");
    if (activeAttempt.data)
      throw new Error("This exam cannot be reassigned while an attempt is in progress.");
    if (latestAttempt.error || !latestAttempt.data)
      throw new Error("A submitted result is required before reassignment.");

    const failed = Number(latestAttempt.data.score) < Number(exam.data.passing_marks);
    if (!failed) throw new Error("Only a failed latest result can be reassigned.");
    const alreadyAvailable =
      assignment.data.status === "assigned" &&
      assignment.data.assigned_at > (latestAttempt.data.submitted_at ?? "");
    if (alreadyAvailable) throw new Error("This exam is already available to the student.");

    let updateQuery = examSupabaseAdmin
      .from("exam_assignments")
      .update({ status: "assigned", assigned_at: new Date().toISOString() })
      .eq("id", data.id);
    updateQuery =
      assignment.data.status === "completed"
        ? updateQuery.eq("status", "completed")
        : updateQuery.eq("status", "assigned").eq("assigned_at", assignment.data.assigned_at);
    const updated = await updateQuery.select("id").maybeSingle();
    if (updated.error) throw new Error("Exam could not be reassigned.");
    if (!updated.data) throw new Error("This exam is already available to the student.");
    return { ok: true };
  });

export const listStudentAssignments = createServerFn({ method: "GET" })
  .middleware(studentMiddleware)
  .handler(async ({ context }) => {
    const { examSupabaseAdmin } = await import("../integrations/supabase/exam-client.server");
    const assignments = await examSupabaseAdmin
      .from("exam_assignments")
      .select("id, exam_id, assigned_at, status")
      .eq("student_id", context.examStudentUserId)
      .order("assigned_at", { ascending: false });
    if (assignments.error) throw new Error("Assigned exams could not be loaded.");
    const examIds = (assignments.data ?? []).map((assignment) => assignment.exam_id);
    const exams = examIds.length
      ? await examSupabaseAdmin
          .from("exams")
          .select("id, title, course, duration_minutes, total_marks, passing_marks")
          .in("id", examIds)
      : { data: [], error: null };
    if (exams.error) throw new Error("Assigned exams could not be loaded.");
    const examById = new Map((exams.data ?? []).map((exam) => [exam.id, exam]));
    const attempts = examIds.length
      ? await examSupabaseAdmin
          .from("exam_attempts")
          .select("exam_id, status, started_at")
          .eq("student_id", context.examStudentUserId)
          .in("exam_id", examIds)
          .order("started_at", { ascending: false })
      : { data: [], error: null };
    if (attempts.error) throw new Error("Assigned exams could not be loaded.");
    const attemptStatusByExam = new Map<string, "in_progress" | "submitted" | "auto_submitted">();
    for (const attempt of attempts.data ?? []) {
      if (!attemptStatusByExam.has(attempt.exam_id))
        attemptStatusByExam.set(attempt.exam_id, attempt.status);
    }
    return (assignments.data ?? []).map((assignment) => ({
      ...assignment,
      exam: examById.get(assignment.exam_id) ?? null,
      attemptStatus: attemptStatusByExam.get(assignment.exam_id) ?? null,
    }));
  });
