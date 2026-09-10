import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { attachExamAuth } from "../integrations/supabase/exam-auth-client-middleware";
import { requireExamAdmin } from "../integrations/supabase/exam-auth-server-middleware";

const adminMiddleware = [attachExamAuth, requireExamAdmin] as const;
const attemptIdInput = z.object({ attemptId: z.string().uuid() });

async function getExamClient() {
  const { examSupabaseAdmin } = await import("../integrations/supabase/exam-client.server");
  return examSupabaseAdmin;
}

const attemptSelect = "id, exam_id, student_id, started_at, submitted_at, status, score, correct_answers, total_questions";

type Attempt = {
  id: string;
  exam_id: string;
  student_id: string;
  started_at: string;
  submitted_at: string | null;
  status: "in_progress" | "submitted" | "auto_submitted";
  score: number;
  correct_answers: number;
  total_questions: number;
};

async function addDetails(attempts: Attempt[]) {
  const examSupabaseAdmin = await getExamClient();
  const examIds = [...new Set(attempts.map((attempt) => attempt.exam_id))];
  const studentIds = [...new Set(attempts.map((attempt) => attempt.student_id))];
  const [exams, profiles] = await Promise.all([
    examIds.length ? examSupabaseAdmin.from("exams").select("id, title, course, duration_minutes, total_marks, passing_marks").in("id", examIds) : Promise.resolve({ data: [], error: null }),
    studentIds.length ? examSupabaseAdmin.from("profiles").select("id, student_id, full_name").in("id", studentIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (exams.error || profiles.error) throw new Error("Result details could not be loaded.");
  const examById = new Map((exams.data ?? []).map((exam) => [exam.id, exam]));
  const profileById = new Map((profiles.data ?? []).map((profile) => [profile.id, profile]));
  return attempts.map((attempt) => ({
    ...attempt,
    exam: examById.get(attempt.exam_id) ?? null,
    student: profileById.get(attempt.student_id) ?? null,
  }));
}

export const listAdminResults = createServerFn({ method: "GET" })
  .middleware(adminMiddleware)
  .handler(async () => {
    const examSupabaseAdmin = await getExamClient();
    const attempts = await examSupabaseAdmin
      .from("exam_attempts")
      .select(attemptSelect)
      .in("status", ["submitted", "auto_submitted"])
      .order("submitted_at", { ascending: false });
    if (attempts.error) throw new Error(`Results could not be loaded: ${attempts.error.message}`);
    return addDetails((attempts.data ?? []) as Attempt[]);
  });

export const getAdminResult = createServerFn({ method: "GET" })
  .middleware(adminMiddleware)
  .validator((input: z.input<typeof attemptIdInput>) => attemptIdInput.parse(input))
  .handler(async ({ data }) => {
    const examSupabaseAdmin = await getExamClient();
    const attempt = await examSupabaseAdmin
      .from("exam_attempts")
      .select(attemptSelect)
      .eq("id", data.attemptId)
      .in("status", ["submitted", "auto_submitted"])
      .maybeSingle();
    if (attempt.error || !attempt.data) throw new Error("Submitted result could not be found.");
    const [result] = await addDetails([attempt.data as Attempt]);
    if (!result?.exam || !result.student) throw new Error("Result details could not be loaded.");
    return { attempt: result, exam: result.exam, student: result.student };
  });
