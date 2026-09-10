import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Download, FileUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import * as XLSX from "xlsx";

import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { getExamSessionProfile } from "../../../../lib/exam-auth";
import {
  deleteQuestion,
  bulkCreateQuestions,
  getExamWithQuestions,
  saveQuestion,
} from "../../../../lib/exam-management.functions";

type QuestionOption = {
  id: string;
  question_id: string;
  option_text: string;
  option_order: number;
  is_correct: boolean;
};
type Question = {
  id: string;
  question_text: string;
  marks: number;
  question_order: number;
  options: QuestionOption[];
};
type ExamData = {
  id: string;
  title: string;
  course: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
};
type QuestionForm = {
  questionText: string;
  marks: string;
  questionOrder: string;
  options: string[];
  correctOption: string;
};
type ImportPreviewRow = {
  rowNumber: number;
  question: string;
  options: string[];
  correct: string;
  marks: string;
  error: string;
};
const emptyForm: QuestionForm = {
  questionText: "",
  marks: "1",
  questionOrder: "1",
  options: ["", "", "", ""],
  correctOption: "0",
};

function normalizeHeader(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  if (normalized === "optiona") return "option_a";
  if (normalized === "optionb") return "option_b";
  if (normalized === "optionc") return "option_c";
  if (normalized === "optiond") return "option_d";
  if (["correct", "correct_answer"].includes(normalized)) return "correct_answer";
  if (normalized === "mark") return "marks";
  return normalized;
}

export const Route = createFileRoute("/admin/exams/$examId/questions")({
  head: () => ({ meta: [{ title: "Questions | Exam Management" }] }),
  component: QuestionsPage,
});

function QuestionsPage() {
  const navigate = useNavigate();
  const { examId } = useParams({ from: "/admin/exams/$examId/questions" });
  const loadExam = useServerFn(getExamWithQuestions);
  const save = useServerFn(saveQuestion);
  const remove = useServerFn(deleteQuestion);
  const bulkCreate = useServerFn(bulkCreateQuestions);
  const [exam, setExam] = useState<ExamData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState<QuestionForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const result = await loadExam({ data: { examId } });
      setExam(result.exam);
      setQuestions(result.questions);
    } catch {
      setError("Exam questions could not be loaded.");
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
  }, [navigate, examId]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, questionOrder: String(questions.length + 1) });
    setShowForm(true);
    setError("");
  };
  const closeImport = () => {
    if (importing) return;
    setShowImport(false);
    setPreview([]);
    setError("");
  };

  const parseImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setParsing(true);
    setError("");
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", blankrows: false });
      const headers = (rows[0] ?? []).map((value) => normalizeHeader(String(value)));
      const required = ["question", "option_a", "option_b", "option_c", "option_d", "correct_answer", "marks"];
      const missing = required.filter((name) => !headers.includes(name));
      if (missing.length) {
        setPreview([{ rowNumber: 1, question: "", options: ["", "", "", ""], correct: "", marks: "", error: `Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.` }]);
        return;
      }
      const indexOf = (name: string) => headers.indexOf(name);
      const parsed = rows.slice(1).map((row, index) => {
        const values = row as unknown[];
        const item: ImportPreviewRow = {
          rowNumber: index + 2,
          question: String(values[indexOf("question")] ?? "").trim(),
          options: ["option_a", "option_b", "option_c", "option_d"].map((name) => String(values[indexOf(name)] ?? "").trim()),
          correct: String(values[indexOf("correct_answer")] ?? "").trim().toUpperCase(),
          marks: String(values[indexOf("marks")] ?? "").trim(),
          error: "",
        };
        const problems = [];
        if (!item.question) problems.push("Missing question");
        if (item.options.some((option) => !option)) problems.push("All four options are required");
        if (!["A", "B", "C", "D"].includes(item.correct)) problems.push("Correct answer must be A, B, C, or D");
        if (!Number.isInteger(Number(item.marks)) || Number(item.marks) <= 0) problems.push("Marks must be greater than 0");
        item.error = problems.join("; ");
        return item;
      }).filter((item) => item.question || item.options.some(Boolean) || item.correct || item.marks);
      setPreview(parsed.length ? parsed : [{ rowNumber: 2, question: "", options: ["", "", "", ""], correct: "", marks: "", error: "No question rows found." }]);
    } catch {
      setPreview([{ rowNumber: 1, question: "", options: ["", "", "", ""], correct: "", marks: "", error: "The file could not be read. Upload a valid CSV or XLSX file." }]);
    } finally {
      setParsing(false);
    }
  };

  const importQuestions = async () => {
    if (importing || !preview.length || preview.some((row) => row.error)) return;
    setImporting(true);
    setError("");
    try {
      const result = await bulkCreate({ data: { examId, questions: preview.map((row) => ({ questionText: row.question, marks: Number(row.marks), options: row.options.map((optionText, index) => ({ optionText, isCorrect: row.correct === String.fromCharCode(65 + index) })) })) } });
      setShowImport(false);
      setPreview([]);
      setSuccess(`${result.count} question${result.count === 1 ? "" : "s"} imported successfully.`);
      await load();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Questions could not be imported.");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = "Question,Option A,Option B,Option C,Option D,Correct Answer,Marks\nWhat is the full form of CPU?,Central Processing Unit,Computer Processing Unit,Central Program Unit,Control Processing Unit,A,1\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "question-import-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  const openEdit = (question: Question) => {
    setEditingId(question.id);
    setForm({
      questionText: question.question_text,
      marks: String(question.marks),
      questionOrder: String(question.question_order),
      options: [1, 2, 3, 4].map(
        (order) =>
          question.options.find((option) => option.option_order === order)?.option_text ?? "",
      ),
      correctOption: String(
        Math.max(
          0,
          question.options.findIndex((option) => option.is_correct),
        ),
      ),
    });
    setShowForm(true);
    setError("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!form.questionText.trim() || form.options.some((option) => !option.trim()))
      return setError("Question text and all four options are required.");
    const marks = Number(form.marks);
    const questionOrder = Number(form.questionOrder);
    if (!Number.isInteger(marks) || marks <= 0) return setError("Marks must be greater than 0.");
    if (!Number.isInteger(questionOrder) || questionOrder <= 0)
      return setError("Question order must be greater than 0.");
    setSaving(true);
    try {
      await save({
        data: {
          examId,
          questionId: editingId ?? undefined,
          questionText: form.questionText,
          marks,
          questionOrder,
          options: form.options.map((optionText, index) => ({
            optionText,
            optionOrder: index + 1,
            isCorrect: String(index) === form.correctOption,
          })),
        },
      });
      await load();
      setSuccess(editingId ? "Question updated successfully." : "Question added successfully.");
      if (editingId) setShowForm(false);
      else setForm({ ...emptyForm, questionOrder: String(questions.length + 2) });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Question could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = async (question: Question) => {
    if (!window.confirm("Delete this question and its four options?")) return;
    try {
      await remove({ data: { id: question.id } });
      setSuccess("Question deleted successfully.");
      await load();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Question could not be deleted.",
      );
    }
  };

  return (
    <main className="min-h-screen bg-sky px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          to="/admin/exams"
          className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-bold text-navy transition hover:text-primary"
        >
          <ArrowLeft size={17} /> Exams
        </Link>
        <section className="mt-6 rounded-xl border border-border bg-background p-6 shadow-xl shadow-navy/10 sm:p-9">
          <header className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                Question Management
              </p>
              <h1 className="mt-2 font-display text-3xl font-extrabold text-navy">
                {exam?.title ?? "Exam Questions"}
              </h1>
              {exam && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {exam.course} · {exam.duration_minutes} minutes · {exam.total_marks} marks · Pass:{" "}
                  {exam.passing_marks}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={openCreate}>
                <Plus /> Add Question
              </Button>
              <Button variant="outline" onClick={() => { setShowImport(true); setError(""); }}>
                <FileUp /> Import Questions
              </Button>
            </div>
          </header>
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
          {showForm && (
            <QuestionForm
              form={form}
              setForm={setForm}
              editing={Boolean(editingId)}
              saving={saving}
              onSubmit={submit}
              onCancel={() => setShowForm(false)}
            />
          )}
          {showImport && (
            <ImportDialog
              preview={preview}
              parsing={parsing}
              importing={importing}
              onFileChange={parseImportFile}
              onImport={() => void importQuestions()}
              onClose={closeImport}
              onDownloadTemplate={downloadTemplate}
            />
          )}
          {loading ? (
            <p className="mt-8 text-sm font-semibold text-muted-foreground">Loading questions...</p>
          ) : questions.length === 0 ? (
            <p className="mt-8 rounded-md border border-dashed border-primary/30 p-5 text-sm text-muted-foreground">
              No questions have been added yet.
            </p>
          ) : (
            <div className="mt-8 space-y-4">
              {questions.map((question) => (
                <article key={question.id} className="rounded-xl border border-border bg-sky p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase text-primary">
                        Question {question.question_order} · {question.marks} mark
                        {question.marks === 1 ? "" : "s"}
                      </p>
                      <h2 className="mt-2 font-display text-lg font-extrabold text-navy">
                        {question.question_text}
                      </h2>
                      <ol className="mt-3 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                        {question.options
                          .sort((a, b) => a.option_order - b.option_order)
                          .map((option) => (
                            <li
                              key={option.id}
                              className={option.is_correct ? "font-bold text-success" : ""}
                            >
                              {String.fromCharCode(64 + option.option_order)}. {option.option_text}
                              {option.is_correct ? " (correct)" : ""}
                            </li>
                          ))}
                      </ol>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(question)}>
                        <Pencil />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => void removeQuestion(question)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function QuestionForm({
  form,
  setForm,
  editing,
  saving,
  onSubmit,
  onCancel,
}: {
  form: QuestionForm;
  setForm: (form: QuestionForm) => void;
  editing: boolean;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const updateOption = (index: number, value: string) =>
    setForm({
      ...form,
      options: form.options.map((option, optionIndex) => (optionIndex === index ? value : option)),
    });
  return (
    <form onSubmit={onSubmit} className="mt-8 rounded-xl border border-border bg-sky p-5 sm:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold text-navy sm:col-span-2">
          Question Text
          <textarea
            required
            value={form.questionText}
            onChange={(event) => setForm({ ...form, questionText: event.target.value })}
            rows={3}
            className="focus-ring resize-none rounded-md border border-input bg-background p-3 font-normal text-foreground"
          />
        </label>
        <Field
          label="Marks"
          type="number"
          min="1"
          value={form.marks}
          onChange={(event) => setForm({ ...form, marks: event.target.value })}
        />
        <Field
          label="Question Order"
          type="number"
          min="1"
          value={form.questionOrder}
          onChange={(event) => setForm({ ...form, questionOrder: event.target.value })}
        />
        {form.options.map((option, index) => (
          <Field
            key={index}
            label={`Option ${String.fromCharCode(65 + index)}`}
            value={option}
            onChange={(event) => updateOption(index, event.target.value)}
          />
        ))}
        <fieldset className="grid gap-2 text-sm font-bold text-navy sm:col-span-2">
          <legend>Correct Answer</legend>
          <div className="flex flex-wrap gap-4 rounded-md border border-input bg-background p-3 font-normal">
            {["A", "B", "C", "D"].map((option, index) => (
              <label key={option} className="inline-flex items-center gap-2">
                <input type="radio" name="correct-option" value={String(index)} checked={form.correctOption === String(index)} onChange={(event) => setForm({ ...form, correctOption: event.target.value })} required />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : editing ? "Update Question" : "Add Question"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ImportDialog({
  preview,
  parsing,
  importing,
  onFileChange,
  onImport,
  onClose,
  onDownloadTemplate,
}: {
  preview: ImportPreviewRow[];
  parsing: boolean;
  importing: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onImport: () => void;
  onClose: () => void;
  onDownloadTemplate: () => void;
}) {
  const validRows = preview.filter((row) => !row.error);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4" role="dialog" aria-modal="true" aria-labelledby="import-title">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="import-title" className="font-display text-2xl font-extrabold text-navy">Import Questions</h2>
            <p className="mt-1 text-sm text-muted-foreground">Upload a CSV or XLSX file. Nothing is saved until you confirm the preview.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} disabled={importing} aria-label="Close import dialog"><X /></Button>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90">
            <FileUp /> {parsing ? "Reading file..." : "Choose file"}
            <input type="file" accept=".csv,.xlsx,.xls" onChange={onFileChange} disabled={parsing || importing} className="sr-only" />
          </label>
          <Button type="button" variant="outline" onClick={onDownloadTemplate} disabled={importing}><Download /> Download Template</Button>
          <span className="text-sm text-muted-foreground">Supported formats: CSV, XLSX, XLS</span>
        </div>
        {preview.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-sky text-xs font-bold uppercase text-navy"><tr><th className="p-3">#</th><th className="p-3">Question</th><th className="p-3">A</th><th className="p-3">B</th><th className="p-3">C</th><th className="p-3">D</th><th className="p-3">Correct</th><th className="p-3">Marks</th><th className="p-3">Status</th></tr></thead>
              <tbody>{preview.map((row) => <tr key={row.rowNumber} className="border-t border-border align-top"><td className="p-3 font-semibold">{row.rowNumber}</td><td className="max-w-xs p-3">{row.question || "-"}</td>{row.options.map((option, index) => <td key={index} className="max-w-[12rem] p-3">{option || "-"}</td>)}<td className="p-3">{row.correct || "-"}</td><td className="p-3">{row.marks || "-"}</td><td className={`p-3 font-semibold ${row.error ? "text-destructive" : "text-success"}`}>{row.error || "Ready"}</td></tr>)}</tbody>
            </table>
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          {preview.length > 0 && <p className="mr-auto text-sm font-semibold text-muted-foreground">{validRows.length} valid of {preview.length} row{preview.length === 1 ? "" : "s"}</p>}
          <Button type="button" variant="outline" onClick={onClose} disabled={importing}>Cancel</Button>
          <Button type="button" onClick={onImport} disabled={importing || !preview.length || validRows.length !== preview.length}>{importing ? "Importing..." : "Import Questions"}</Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-2 text-sm font-bold text-navy">
      {label}
      <Input required {...props} />
    </label>
  );
}
