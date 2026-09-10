import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { attachExamAuth } from "../integrations/supabase/exam-auth-client-middleware";
import { requireExamStudent } from "../integrations/supabase/exam-auth-student-middleware";

const studentMiddleware = [attachExamAuth, requireExamStudent] as const;
const examIdInput = z.object({ examId: z.string().uuid() });
const attemptIdInput = z.object({ attemptId: z.string().uuid() });
const answerInput = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
  selectedOptionId: z.string().uuid().nullable(),
});

async function getExamClient() {
  const { examSupabaseAdmin } = await import("../integrations/supabase/exam-client.server");
  return examSupabaseAdmin;
}

async function getAssignedExam(examId: string, studentId: string) {
  const examSupabaseAdmin = await getExamClient();
  const assignment = await examSupabaseAdmin
    .from("exam_assignments")
    .select("exam_id")
    .eq("exam_id", examId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (assignment.error) throw new Error("Exam assignment could not be verified.");
  if (!assignment.data) throw new Error("This exam is not assigned to you.");

  const exam = await examSupabaseAdmin
    .from("exams")
    .select("id, title, course, duration_minutes, total_marks, passing_marks, is_active")
    .eq("id", examId)
    .maybeSingle();
  if (exam.error || !exam.data) throw new Error("Exam could not be loaded.");
  if (!exam.data.is_active) throw new Error("This exam is not active.");
  return { examSupabaseAdmin, exam: exam.data };
}

async function getExamQuestions(examId: string) {
  const examSupabaseAdmin = await getExamClient();
  const questions = await examSupabaseAdmin
    .from("questions")
    .select("id, question_text, marks, question_order")
    .eq("exam_id", examId)
    .order("question_order");
  if (questions.error) throw new Error("Exam questions could not be loaded.");

  const questionIds = (questions.data ?? []).map((question) => question.id);
  const options = questionIds.length
    ? await examSupabaseAdmin
        .from("question_options")
        .select("id, question_id, option_text, option_order")
        .in("question_id", questionIds)
        .order("option_order")
    : { data: [], error: null };
  if (options.error) throw new Error("Exam options could not be loaded.");

  return (questions.data ?? []).map((question) => ({
    ...question,
    options: (options.data ?? [])
      .filter((option) => option.question_id === question.id)
      .map(({ id, option_text, option_order }) => ({ id, option_text, option_order })),
  }));
}

async function getAttemptForStudent(attemptId: string, studentId: string) {
  const examSupabaseAdmin = await getExamClient();
  const attempt = await examSupabaseAdmin
    .from("exam_attempts")
    .select(
      "id, exam_id, student_id, started_at, submitted_at, status, score, correct_answers, total_questions",
    )
    .eq("id", attemptId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (attempt.error || !attempt.data) throw new Error("Exam attempt could not be found.");
  return { examSupabaseAdmin, attempt: attempt.data };
}

async function withSubmissionTimeout<T>(operation: PromiseLike<T>, stage: string) {
  return Promise.race([
    Promise.resolve(operation),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Exam submission timed out while ${stage}.`)), 15000),
    ),
  ]);
}

export const getExamInstructions = createServerFn({ method: "GET" })
  .middleware(studentMiddleware)
  .validator((input: z.input<typeof examIdInput>) => examIdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { examSupabaseAdmin, exam } = await getAssignedExam(
      data.examId,
      context.examStudentUserId,
    );
    const questions = await getExamQuestions(data.examId);
    const activeAttempt = await examSupabaseAdmin
      .from("exam_attempts")
      .select("id, started_at, status")
      .eq("exam_id", data.examId)
      .eq("student_id", context.examStudentUserId)
      .eq("status", "in_progress")
      .maybeSingle();
    if (activeAttempt.error) throw new Error("Exam attempt could not be loaded.");
    return { exam, questionCount: questions.length, activeAttempt: activeAttempt.data };
  });

export const startExamAttempt = createServerFn({ method: "POST" })
  .middleware(studentMiddleware)
  .validator((input: z.input<typeof examIdInput>) => examIdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { examSupabaseAdmin, exam } = await getAssignedExam(
      data.examId,
      context.examStudentUserId,
    );
    const questions = await getExamQuestions(data.examId);
    const existing = await examSupabaseAdmin
      .from("exam_attempts")
      .select(
        "id, exam_id, student_id, started_at, submitted_at, status, score, correct_answers, total_questions",
      )
      .eq("exam_id", data.examId)
      .eq("student_id", context.examStudentUserId)
      .eq("status", "in_progress")
      .maybeSingle();
    if (existing.error) throw new Error("Exam attempt could not be loaded.");

    let attempt = existing.data;
    if (!attempt) {
      const created = await examSupabaseAdmin
        .from("exam_attempts")
        .insert({
          exam_id: data.examId,
          student_id: context.examStudentUserId,
          total_questions: questions.length,
        })
        .select(
          "id, exam_id, student_id, started_at, submitted_at, status, score, correct_answers, total_questions",
        )
        .single();
      if (created.error || !created.data) {
        if (created.error?.code === "23505") {
          const resumed = await examSupabaseAdmin
            .from("exam_attempts")
            .select(
              "id, exam_id, student_id, started_at, submitted_at, status, score, correct_answers, total_questions",
            )
            .eq("exam_id", data.examId)
            .eq("student_id", context.examStudentUserId)
            .eq("status", "in_progress")
            .single();
          if (resumed.error || !resumed.data) throw new Error("Exam attempt could not be started.");
          attempt = resumed.data;
        } else {
          throw new Error("Exam attempt could not be started.");
        }
      } else {
        attempt = created.data;
      }
    }

    const answers = await examSupabaseAdmin
      .from("exam_attempt_answers")
      .select("question_id, selected_option_id")
      .eq("attempt_id", attempt.id);
    if (answers.error) throw new Error("Exam answers could not be loaded.");
    return { exam, questions, attempt, answers: answers.data ?? [] };
  });

export const loadExamAttempt = createServerFn({ method: "GET" })
  .middleware(studentMiddleware)
  .validator((input: z.input<typeof attemptIdInput>) => attemptIdInput.parse(input))
  .handler(async ({ data, context }) => {
    const { examSupabaseAdmin, attempt } = await getAttemptForStudent(
      data.attemptId,
      context.examStudentUserId,
    );
    if (attempt.status !== "in_progress")
      throw new Error("This exam attempt has already been submitted.");
    const assigned = await getAssignedExam(attempt.exam_id, context.examStudentUserId);
    const questions = await getExamQuestions(attempt.exam_id);
    const answers = await examSupabaseAdmin
      .from("exam_attempt_answers")
      .select("question_id, selected_option_id")
      .eq("attempt_id", attempt.id);
    if (answers.error) throw new Error("Exam answers could not be loaded.");
    return { exam: assigned.exam, questions, attempt, answers: answers.data ?? [] };
  });

export const saveExamAnswer = createServerFn({ method: "POST" })
  .middleware(studentMiddleware)
  .validator((input: z.input<typeof answerInput>) => answerInput.parse(input))
  .handler(async ({ data, context }) => {
    const { examSupabaseAdmin, attempt } = await getAttemptForStudent(
      data.attemptId,
      context.examStudentUserId,
    );
    if (attempt.status !== "in_progress") throw new Error("This exam has already been submitted.");

    const question = await examSupabaseAdmin
      .from("questions")
      .select("id")
      .eq("id", data.questionId)
      .eq("exam_id", attempt.exam_id)
      .maybeSingle();
    if (question.error || !question.data) throw new Error("Question does not belong to this exam.");

    if (data.selectedOptionId) {
      const option = await examSupabaseAdmin
        .from("question_options")
        .select("id")
        .eq("id", data.selectedOptionId)
        .eq("question_id", data.questionId)
        .maybeSingle();
      if (option.error || !option.data) throw new Error("Selected option is invalid.");
    }

    const { error } = await examSupabaseAdmin.from("exam_attempt_answers").upsert(
      {
        attempt_id: data.attemptId,
        question_id: data.questionId,
        selected_option_id: data.selectedOptionId,
        answered_at: new Date().toISOString(),
      },
      { onConflict: "attempt_id,question_id" },
    );
    if (error) throw new Error("Answer could not be saved.");
    return { ok: true };
  });

export const submitExamAttempt = createServerFn({ method: "POST" })
  .middleware(studentMiddleware)
  .validator((input: z.input<typeof attemptIdInput> & { autoSubmitted?: boolean }) => ({
    attemptId: z.string().uuid().parse(input.attemptId),
    autoSubmitted: Boolean(input.autoSubmitted),
  }))
  .handler(async ({ data, context }) => {
    console.info("SERVER_SUBMIT_START", {
      attemptId: data.attemptId,
      studentId: context.examStudentUserId,
      autoSubmitted: data.autoSubmitted,
    });
    try {
      const { examSupabaseAdmin, attempt } = await withSubmissionTimeout(
        getAttemptForStudent(data.attemptId, context.examStudentUserId),
        "verifying the attempt",
      );
      console.info("SERVER_ATTEMPT_VERIFIED", {
        attemptId: attempt.id,
        examId: attempt.exam_id,
        status: attempt.status,
      });
      if (attempt.status !== "in_progress") {
        console.info("SERVER_RETURNING_SUCCESS", {
          attemptId: attempt.id,
          examId: attempt.exam_id,
          status: attempt.status,
        });
        return { ok: true, attemptId: attempt.id, examId: attempt.exam_id, status: attempt.status };
      }

      const questions = await withSubmissionTimeout(
        examSupabaseAdmin.from("questions").select("id, marks").eq("exam_id", attempt.exam_id),
        "loading questions",
      );
      if (questions.error) throw new Error("Exam questions could not be loaded.");
      const questionIds = (questions.data ?? []).map((question) => question.id);
      const answers = await withSubmissionTimeout(
        examSupabaseAdmin
          .from("exam_attempt_answers")
          .select("question_id, selected_option_id")
          .eq("attempt_id", attempt.id),
        "loading answers",
      );
      if (answers.error) throw new Error("Exam answers could not be loaded.");
      console.info("SERVER_ANSWERS_LOADED", {
        attemptId: attempt.id,
        count: answers.data?.length ?? 0,
      });
      const selectedOptionIds = (answers.data ?? [])
        .map((answer) => answer.selected_option_id)
        .filter((id): id is string => Boolean(id));
      const correctOptions = selectedOptionIds.length
        ? await withSubmissionTimeout(
            examSupabaseAdmin
              .from("question_options")
              .select("id, question_id, is_correct")
              .in("id", selectedOptionIds),
            "loading scoring data",
          )
        : { data: [], error: null };
      if (correctOptions.error) throw new Error("Exam scoring could not be completed.");

      const correctByQuestion = new Map(
        (correctOptions.data ?? []).map((option) => [option.question_id, option.is_correct]),
      );
      const marksByQuestion = new Map(
        (questions.data ?? []).map((question) => [question.id, question.marks]),
      );
      const correctAnswers = (answers.data ?? []).filter(
        (answer) => answer.selected_option_id && correctByQuestion.get(answer.question_id) === true,
      ).length;
      const score = (answers.data ?? []).reduce(
        (total, answer) =>
          total +
          (answer.selected_option_id && correctByQuestion.get(answer.question_id) === true
            ? (marksByQuestion.get(answer.question_id) ?? 0)
            : 0),
        0,
      );
      const status = data.autoSubmitted ? "auto_submitted" : "submitted";
      console.info("SERVER_SCORE_CALCULATED", {
        attemptId: attempt.id,
        status,
        score,
        correctAnswers,
        totalQuestions: questionIds.length,
      });
      const updateResult = await withSubmissionTimeout(
        examSupabaseAdmin
          .from("exam_attempts")
          .update({
            submitted_at: new Date().toISOString(),
            status,
            score,
            correct_answers: correctAnswers,
            total_questions: questionIds.length,
          })
          .eq("id", attempt.id)
          .eq("student_id", context.examStudentUserId)
          .eq("status", "in_progress"),
        "updating the attempt",
      );
      if (updateResult.error) {
        console.error("Failed to update submitted exam attempt", updateResult.error);
        throw new Error(`Exam could not be submitted: ${updateResult.error.message}`);
      }
      const assignmentResult = await withSubmissionTimeout(
        examSupabaseAdmin
          .from("exam_assignments")
          .update({ status: "completed" })
          .eq("exam_id", attempt.exam_id)
          .eq("student_id", context.examStudentUserId)
          .eq("status", "assigned"),
        "updating the assignment",
      );
      if (assignmentResult.error) throw new Error("Exam assignment could not be updated.");
      console.info("SERVER_ATTEMPT_UPDATED", { attemptId: attempt.id, status });

      const updated = await withSubmissionTimeout(
        getAttemptForStudent(data.attemptId, context.examStudentUserId),
        "verifying the updated attempt",
      );
      if (updated.attempt.status === "in_progress")
        throw new Error("Exam could not be submitted: the attempt is still in progress.");
      console.info("SERVER_ATTEMPT_VERIFIED", {
        attemptId: updated.attempt.id,
        status: updated.attempt.status,
      });
      const result = {
        ok: true,
        attemptId: updated.attempt.id,
        examId: updated.attempt.exam_id,
        status: updated.attempt.status,
      } as const;
      console.info("SERVER_RETURNING_SUCCESS", result);
      return result;
    } catch (error) {
      console.error("Exam submission failed", error);
      throw new Error(error instanceof Error ? error.message : "Exam could not be submitted.");
    }
  });

async function getAttemptResult(attemptId: string, studentId: string) {
  const { attempt } = await getAttemptForStudent(attemptId, studentId);
  return getAttemptResultFromAttempt(attempt);
}

async function getAttemptResultFromAttempt(attempt: {
  id: string;
  exam_id: string;
  student_id: string;
  started_at: string;
  submitted_at: string | null;
  status: "in_progress" | "submitted" | "auto_submitted";
  score: number;
  correct_answers: number;
  total_questions: number;
}) {
  const examSupabaseAdmin = await getExamClient();
  const exam = await examSupabaseAdmin
    .from("exams")
    .select("id, title, course, total_marks, passing_marks")
    .eq("id", attempt.exam_id)
    .single();
  if (exam.error || !exam.data) throw new Error("Exam result could not be loaded.");
  const profile = await examSupabaseAdmin
    .from("profiles")
    .select("student_id, full_name")
    .eq("id", attempt.student_id)
    .single();
  if (profile.error || !profile.data) throw new Error("Student result could not be loaded.");
  return { attempt, exam: exam.data, profile: profile.data };
}

export const getExamResult = createServerFn({ method: "GET" })
  .middleware(studentMiddleware)
  .validator((input: z.input<typeof examIdInput>) => examIdInput.parse(input))
  .handler(async ({ data, context }) => {
    const examSupabaseAdmin = await getExamClient();
    const attempt = await examSupabaseAdmin
      .from("exam_attempts")
      .select(
        "id, exam_id, student_id, started_at, submitted_at, status, score, correct_answers, total_questions",
      )
      .eq("exam_id", data.examId)
      .eq("student_id", context.examStudentUserId)
      .in("status", ["submitted", "auto_submitted"])
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (attempt.error || !attempt.data) throw new Error("Exam result could not be found.");
    return getAttemptResultFromAttempt(attempt.data);
  });
