import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { attachExamAuth } from "../integrations/supabase/exam-auth-client-middleware";
import { requireExamAdmin } from "../integrations/supabase/exam-auth-server-middleware";
import { normalizeStudentId } from "./exam-auth";

const studentInput = z.object({
  studentId: z.string().trim().min(1).max(40),
  fullName: z.string().trim().min(2).max(120),
  password: z.string().min(6).max(128),
  course: z.string().trim().min(1).max(160),
});

const studentEmailDomain = "exam.scopenet.local";

function studentIdToAuthEmail(studentId: string) {
  return `${studentId.toLowerCase()}@${studentEmailDomain}`;
}

export const listExamStudents = createServerFn({ method: "GET" })
  .middleware([attachExamAuth, requireExamAdmin])
  .handler(async () => {
    const { examSupabaseAdmin } = await import("../integrations/supabase/exam-client.server");
    const { data: profiles, error } = await examSupabaseAdmin
      .from("profiles")
      .select("id, student_id, full_name, role, created_at, updated_at")
      .eq("role", "student")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Students could not be loaded.");

    const users = await examSupabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (users.error) throw new Error("Students could not be loaded.");
    const metadataById = new Map(users.data.users.map((user) => [user.id, user.user_metadata]));

    return (profiles ?? []).map((profile) => ({
      id: profile.id,
      studentId: profile.student_id,
      fullName: profile.full_name,
      course: String(metadataById.get(profile.id)?.course ?? ""),
      createdAt: profile.created_at,
    }));
  });

export const createExamStudent = createServerFn({ method: "POST" })
  .middleware([attachExamAuth, requireExamAdmin])
  .validator((input: z.input<typeof studentInput>) => studentInput.parse(input))
  .handler(async ({ data }) => {
    const { examSupabaseAdmin } = await import("../integrations/supabase/exam-client.server");
    const studentId = normalizeStudentId(data.studentId);
    const email = studentIdToAuthEmail(studentId);

    const { data: created, error: createError } = await examSupabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { course: data.course },
    });
    if (createError || !created.user) {
      throw new Error(createError?.message.includes("already") ? "That Student ID already exists." : "Student could not be created.");
    }

    const { error: profileError } = await examSupabaseAdmin.from("profiles").insert({
      id: created.user.id,
      student_id: studentId,
      full_name: data.fullName.trim(),
      role: "student",
    });
    if (profileError) {
      await examSupabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error(profileError.code === "23505" ? "That Student ID already exists." : "Student could not be created.");
    }

    return { id: created.user.id };
  });