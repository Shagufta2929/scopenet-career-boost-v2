import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { attachExamAuth } from "../integrations/supabase/exam-auth-client-middleware";
import { requireExamAdmin } from "../integrations/supabase/exam-auth-server-middleware";

const examInput = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000),
  course: z.string().trim().min(1).max(160),
  durationMinutes: z.coerce.number().int().positive(),
  totalMarks: z.coerce.number().int().positive(),
  passingMarks: z.coerce.number().int().min(0),
  isActive: z.boolean(),
}).refine((value) => value.passingMarks <= value.totalMarks, { message: "Passing marks cannot exceed total marks." });

const questionInput = z.object({
  examId: z.string().uuid(),
  questionId: z.string().uuid().optional(),
  questionText: z.string().trim().min(1).max(5000),
  marks: z.coerce.number().int().positive(),
  questionOrder: z.coerce.number().int().positive(),
  options: z.array(z.object({
    optionText: z.string().trim().min(1).max(1000),
    optionOrder: z.number().int().min(1).max(4),
    isCorrect: z.boolean(),
  })).length(4).refine((options) => options.filter((option) => option.isCorrect).length === 1, { message: "Exactly one correct option is required." }),
});

const bulkQuestionInput = z.object({
  examId: z.string().uuid(),
  questions: z.array(z.object({
    questionText: z.string().trim().min(1).max(5000),
    marks: z.coerce.number().int().positive(),
    options: z.array(z.object({
      optionText: z.string().trim().min(1).max(1000),
      isCorrect: z.boolean(),
    })).length(4).refine((options) => options.filter((option) => option.isCorrect).length === 1, { message: "Exactly one correct option is required." }),
  })).min(1).max(500),
});

const adminMiddleware = [attachExamAuth, requireExamAdmin] as const;

export const listExams = createServerFn({ method: "GET" })
  .middleware(adminMiddleware)
  .handler(async () => {
    const { examSupabaseAdmin } = await import("../integrations/supabase/exam-client.server");
    const { data, error } = await examSupabaseAdmin.from("exams").select("*").order("created_at", { ascending: false });
    if (error) throw new Error("Exams could not be loaded.");
    return data ?? [];
  });

export const createExam = createServerFn({ method: "POST" })
  .middleware(adminMiddleware)
  .validator((input: z.input<typeof examInput>) => examInput.parse(input))
  .handler(async ({ data }) => {
    const { examSupabaseAdmin } = await import("../integrations/supabase/exam-client.server");
    const { error } = await examSupabaseAdmin.from("exams").insert({
      title: data.title,
      description: data.description || null,
      course: data.course,
      duration_minutes: data.durationMinutes,
      total_marks: data.totalMarks,
      passing_marks: data.passingMarks,
      is_active: data.isActive,
    });
    if (error) throw new Error("Exam could not be created.");
    return { ok: true };
  });

export const updateExam = createServerFn({ method: "POST" })
  .middleware(adminMiddleware)
  .validator((input: z.input<typeof examInput> & { id: string }) => ({ ...examInput.parse(input), id: z.string().uuid().parse(input.id) }))
  .handler(async ({ data }) => {
    const { examSupabaseAdmin } = await import("../integrations/supabase/exam-client.server");
    const { error } = await examSupabaseAdmin.from("exams").update({
      title: data.title,
      description: data.description || null,
      course: data.course,
      duration_minutes: data.durationMinutes,
      total_marks: data.totalMarks,
      passing_marks: data.passingMarks,
      is_active: data.isActive,
    }).eq("id", data.id);
    if (error) throw new Error("Exam could not be updated.");
    return { ok: true };
  });

export const deleteExam = createServerFn({ method: "POST" })
  .middleware(adminMiddleware)
  .validator((input: { id: string }) => ({ id: z.string().uuid().parse(input.id) }))
  .handler(async ({ data }) => {
    const { examSupabaseAdmin } = await import("../integrations/supabase/exam-client.server");
    const { error } = await examSupabaseAdmin.from("exams").delete().eq("id", data.id);
    if (error) throw new Error("Exam could not be deleted.");
    return { ok: true };
  });

export const getExamWithQuestions = createServerFn({ method: "GET" })
  .middleware(adminMiddleware)
  .validator((input: { examId: string }) => ({ examId: z.string().uuid().parse(input.examId) }))
  .handler(async ({ data }) => {
    const { examSupabaseAdmin } = await import("../integrations/supabase/exam-client.server");
    const examResult = await examSupabaseAdmin.from("exams").select("*").eq("id", data.examId).single();
    if (examResult.error || !examResult.data) throw new Error("Exam could not be loaded.");
    const questionResult = await examSupabaseAdmin.from("questions").select("*").eq("exam_id", data.examId).order("question_order");
    if (questionResult.error) throw new Error("Questions could not be loaded.");
    const questionIds = (questionResult.data ?? []).map((question) => question.id);
    const optionResult = questionIds.length
      ? await examSupabaseAdmin.from("question_options").select("*").in("question_id", questionIds).order("option_order")
      : { data: [], error: null };
    if (optionResult.error) throw new Error("Question options could not be loaded.");
    return {
      exam: examResult.data,
      questions: (questionResult.data ?? []).map((question) => ({
        ...question,
        options: (optionResult.data ?? []).filter((option) => option.question_id === question.id),
      })),
    };
  });

export const saveQuestion = createServerFn({ method: "POST" })
  .middleware(adminMiddleware)
  .validator((input: z.input<typeof questionInput>) => questionInput.parse(input))
  .handler(async ({ data }) => {
    const { examSupabaseAdmin } = await import("../integrations/supabase/exam-client.server");
    let questionId = data.questionId;
    if (questionId) {
      const { error } = await examSupabaseAdmin.from("questions").update({ question_text: data.questionText, marks: data.marks, question_order: data.questionOrder }).eq("id", questionId).eq("exam_id", data.examId);
      if (error) throw new Error("Question could not be updated.");
      const { error: deleteError } = await examSupabaseAdmin.from("question_options").delete().eq("question_id", questionId);
      if (deleteError) throw new Error("Question options could not be updated.");
    } else {
      const { data: created, error } = await examSupabaseAdmin.from("questions").insert({ exam_id: data.examId, question_text: data.questionText, marks: data.marks, question_order: data.questionOrder }).select("id").single();
      if (error || !created) throw new Error("Question could not be created.");
      questionId = created.id;
    }
    const { error: optionsError } = await examSupabaseAdmin.from("question_options").insert(data.options.map((option) => ({ question_id: questionId!, option_text: option.optionText, option_order: option.optionOrder, is_correct: option.isCorrect })));
    if (optionsError) throw new Error("Question options could not be saved.");
    return { ok: true };
  });

export const bulkCreateQuestions = createServerFn({ method: "POST" })
  .middleware(adminMiddleware)
  .validator((input: z.input<typeof bulkQuestionInput>) => bulkQuestionInput.parse(input))
  .handler(async ({ data }) => {
    const { examSupabaseAdmin } = await import("../integrations/supabase/exam-client.server");
    const existing = await examSupabaseAdmin.from("questions").select("question_order").eq("exam_id", data.examId).order("question_order", { ascending: false }).limit(1).maybeSingle();
    if (existing.error) throw new Error("Existing questions could not be checked.");

    const createdQuestionIds: string[] = [];
    const firstOrder = (existing.data?.question_order ?? 0) + 1;
    try {
      for (const [index, question] of data.questions.entries()) {
        const created = await examSupabaseAdmin.from("questions").insert({
          exam_id: data.examId,
          question_text: question.questionText,
          marks: question.marks,
          question_order: firstOrder + index,
        }).select("id").single();
        if (created.error || !created.data) throw new Error("A question could not be created.");
        createdQuestionIds.push(created.data.id);

        const options = await examSupabaseAdmin.from("question_options").insert(question.options.map((option, optionIndex) => ({
          question_id: created.data.id,
          option_text: option.optionText,
          option_order: optionIndex + 1,
          is_correct: option.isCorrect,
        })));
        if (options.error) throw new Error("Question options could not be saved.");
      }
    } catch (error) {
      if (createdQuestionIds.length) await examSupabaseAdmin.from("questions").delete().in("id", createdQuestionIds);
      throw error instanceof Error ? error : new Error("Questions could not be imported.");
    }

    return { count: data.questions.length };
  });

export const deleteQuestion = createServerFn({ method: "POST" })
  .middleware(adminMiddleware)
  .validator((input: { id: string }) => ({ id: z.string().uuid().parse(input.id) }))
  .handler(async ({ data }) => {
    const { examSupabaseAdmin } = await import("../integrations/supabase/exam-client.server");
    const { error } = await examSupabaseAdmin.from("questions").delete().eq("id", data.id);
    if (error) throw new Error("Question could not be deleted.");
    return { ok: true };
  });
