import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, type FormEvent } from "react";
import { submitEnquiry } from "../lib/enquiries.functions";
import { supabase } from "../integrations/supabase/client";

import * as Dialog from "@radix-ui/react-dialog";
import * as Accordion from "@radix-ui/react-accordion";
import { ArrowRight, BarChart3, BookOpen, BrainCircuit, BriefcaseBusiness, Check, ChevronDown, Clock3, Clapperboard, Code2, GraduationCap, IndianRupee, Laptop, Layers, MapPin, Megaphone, Menu, MessageCircle, Phone, Send, Sparkles, Star, UserRound, Video, X, Bot } from "lucide-react";
import { courses, type Course } from "../data/courses";
import heroImage from "../assets/scopenet-student-lab.jpg";
import classroomImage from "../assets/scopenet-classroom.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Computer Courses | Scopenet Computer Institute" },
      { name: "description", content: "Explore practical, career-focused computer, accounting, design, and English courses at Scopenet Computer Institute." },
      { property: "og:title", content: "Scopenet Computer Institute" },
      { property: "og:description", content: "Learn skills and build your career with practical computer education." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const navItems = [
  ["Home", "home"], ["Courses", "courses"], ["About Us", "about"], ["Why Choose Us", "why"], ["Reviews", "reviews"], ["FAQ", "faq"], ["Contact", "contact"],
] as const;

const benefits = [
  [Laptop, "Practical Computer Training", "Learn through guided, hands-on practice."],
  [BriefcaseBusiness, "Career-Focused Courses", "Develop skills relevant to education and work."],
  [BookOpen, "Multiple Course Options", "Choose from foundation to advanced programs."],
  [UserRound, "Beginner-Friendly Learning", "Start with clear, approachable instruction."],
  [Clock3, "Flexible Batch Options", "Ask the institute about available batch timings."],
  [Sparkles, "Skill Development", "Build confidence across practical and communication skills."],
] as const;

const courseIconMap = { "Web Development": Code2, "Full Stack Development": Layers, "Video Editing": Video, Animation: Sparkles, "Data Science": BrainCircuit, "Social Media Marketing": Megaphone, "AI / Machine Learning": Bot, "Data Analysis with Power BI": BarChart3 };
const displayedCourses = courses.filter((course) => !["CCC + Tally", "CCC + Tally + Advanced Excel", "CCAS", "CCAS + E.S."].includes(course.name));
const institutePhone = "9870407459";
const instituteAddress = "Sunshine Commercial Complex, Station Rd, Nala Sopara, Moregaon Talao, Nalasopara East, Vasai-Virar, Maharashtra 401209";
const instituteMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(instituteAddress)}`;
const whatsappUrl = "https://wa.me/919870407459?text=Hello%20Scopenet%20Computer%20Institute%2C%20I%20would%20like%20to%20know%20more%20about%20your%20courses.";

function getCourseCategory(courseName: string) {
  if (courseName.includes("Tally")) return "ACCOUNTING";
  if (["Web Development", "Full Stack Development"].includes(courseName)) return "DEVELOPMENT";
  if (["Data Science", "AI / Machine Learning", "Data Analysis with Power BI", "Advanced Excel"].includes(courseName)) return "DATA & AI";
  if (["Graphic Designing", "Video Editing", "Animation"].includes(courseName)) return "DESIGN & CREATIVE";
  if (courseName === "Social Media Marketing") return "DIGITAL MARKETING";
  return "COMPUTER SKILLS";
}

function buildWhatsAppEnquiryUrl({ name, mobile, email, course, batch, message }: { name: string; mobile: string; email: string; course: string; batch: string; message: string }) {
  const whatsappMessage = [
    "Hello Scopenet Computer Institute,",
    "",
    "New Course Enquiry",
    "",
    `Name: ${name}`,
    `Phone: ${mobile}`,
    `Email: ${email || "-"}`,
    `Course: ${course}`,
    `Preferred Batch / Timing: ${batch || "-"}`,
    `Message: ${message || "-"}`,
    "",
    "Thank you.",
  ].join("\n");
  return `https://wa.me/919870407459?text=${encodeURIComponent(whatsappMessage)}`;
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function Index() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [formCourse, setFormCourse] = useState("");

  const openCourse = (course: Course) => {
    setSelectedCourse(course);
    setFormCourse(course.name);
  };

  const goToEnquiry = (courseName = "") => {
    if (courseName) setFormCourse(courseName);
    setSelectedCourse(null);
    setMenuOpen(false);
    window.setTimeout(() => scrollTo("enquiry"), 30);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-xl">
        <div className="section-shell grid min-h-18 grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <button onClick={() => scrollTo("home")} className="focus-ring flex min-w-0 items-center gap-3 rounded-md text-left">
            <img src="/scopenet-logo.jpeg" alt="Scopenet Computer Institute" className="h-12 w-auto max-w-[20rem] object-contain sm:h-14 lg:h-18" />
          </button>
          <nav aria-label="Main navigation" className="hidden items-center gap-5 lg:flex">
            {navItems.map(([label, id]) => <button key={id} onClick={() => scrollTo(id)} className="focus-ring rounded-sm text-sm font-semibold text-muted-foreground transition-colors hover:text-primary">{label}</button>)}
            <button onClick={() => goToEnquiry()} className="focus-ring inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-navy">Enquire Now <ArrowRight className="ml-2" size={16} /></button>
          </nav>
          <button aria-label="Toggle menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)} className="focus-ring grid size-11 place-items-center rounded-md border border-border text-navy lg:hidden">{menuOpen ? <X /> : <Menu />}</button>
        </div>
        {menuOpen && <nav className="section-shell grid gap-1 border-t border-border py-3 lg:hidden">{navItems.map(([label, id]) => <button key={id} onClick={() => { scrollTo(id); setMenuOpen(false); }} className="focus-ring rounded-md px-3 py-3 text-left text-sm font-semibold hover:bg-muted">{label}</button>)}<button onClick={() => goToEnquiry()} className="mt-2 rounded-md bg-primary px-4 py-3 font-bold text-primary-foreground">Enquire Now</button></nav>}
      </header>

      <main>
        <section id="home" className="relative bg-sky py-12 sm:py-16 lg:py-20">
          <div className="section-shell grid items-center gap-12 lg:grid-cols-[1fr_0.92fr]">
            <div className="animate-enter max-w-2xl">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background px-4 py-2 text-xs font-bold uppercase text-primary"><GraduationCap size={16} /> Practical computer education</p>
              <h1 className="font-display text-4xl font-extrabold leading-[1.08] text-navy sm:text-5xl lg:text-7xl">Learn Skills.<br /><span className="text-primary">Build Your Career.</span></h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">Upgrade your computer skills with practical and career-focused training at Scopenet Computer Institute.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row"><button onClick={() => scrollTo("courses")} className="focus-ring inline-flex h-12 items-center justify-center rounded-md bg-primary px-6 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-navy">Explore Courses <ArrowRight className="ml-2" size={18} /></button><button onClick={() => goToEnquiry()} className="focus-ring inline-flex h-12 items-center justify-center rounded-md border border-navy/20 bg-background px-6 font-bold text-navy transition hover:border-primary hover:text-primary">Enquire Now</button></div>
            </div>
            <div className="relative animate-enter"><div className="overflow-hidden rounded-lg border-8 border-background shadow-2xl shadow-navy/15"><img src={heroImage} alt="Student learning computer skills in a modern computer lab" width={1440} height={1200} className="aspect-[6/5] w-full object-cover" /></div><div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-md bg-navy px-4 py-3 text-primary-foreground shadow-xl sm:-left-5"><span className="grid size-9 place-items-center rounded-md bg-primary"><Check size={18} /></span><span><strong className="block text-sm">Practical Learning</strong><span className="text-xs opacity-75">Skills for career growth</span></span></div></div>
          </div>
        </section>

        <section aria-label="Learning highlights" className="border-y border-border bg-background"><div className="section-shell grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 md:divide-y-0">{["Practical Learning", "Career-Focused Courses", "Multiple Course Options", "Certificate-Oriented Learning"].map((item, i) => <div key={item} className="flex min-h-28 items-center gap-3 px-3 py-5 sm:px-6"><span className="font-display text-xl font-extrabold text-primary">0{i + 1}</span><span className="text-sm font-bold leading-5 text-navy">{item}</span></div>)}</div></section>

        <section id="courses" className="section-space bg-background"><div className="section-shell"><SectionHeading eyebrow="Explore your options" title="Our Courses" text="Practical learning paths designed to help you build useful, career-focused skills." /><div className="mt-10 grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">{displayedCourses.map((course, index) => { const CourseIcon = courseIconMap[course.name as keyof typeof courseIconMap] ?? BookOpen; return <article key={course.name} className="group flex h-full min-h-[27rem] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10"><div className="relative isolate flex h-36 shrink-0 items-center justify-between overflow-hidden bg-gradient-to-br from-sky via-background to-white px-6"><span aria-hidden="true" className="absolute -right-8 -top-10 h-40 w-40 rotate-12 bg-primary/5 [clip-path:polygon(25%_0,100%_0,100%_75%)]" /><span className="absolute -bottom-10 left-20 h-24 w-32 -skew-x-12 bg-secondary/5" aria-hidden="true" /><span className="relative grid size-16 place-items-center rounded-2xl bg-background text-primary shadow-md transition duration-300 group-hover:scale-105"><CourseIcon size={31} strokeWidth={1.8} /></span><span className="relative self-start rounded-full border border-primary/10 bg-background/80 px-3 py-1.5 text-xs font-bold tracking-widest text-primary backdrop-blur-sm">{String(index + 1).padStart(2, "0")}</span></div><div className="flex flex-1 flex-col p-6"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">{getCourseCategory(course.name)}</p><h3 className="mt-2 font-display text-xl font-extrabold leading-tight text-navy">{course.name}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{course.description}</p><div className="mt-5 flex flex-wrap gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground"><Clock3 size={14} className="text-primary" /> {course.duration}</span>{course.batchNote && <span className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground">{course.batchNote}</span>}</div><div className="mt-auto pt-6"><button onClick={() => openCourse(course)} className="focus-ring inline-flex h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground transition duration-300 hover:-translate-y-0.5 hover:bg-navy">Enquire Now <ArrowRight className="ml-2 transition-transform duration-300 group-hover:translate-x-1" size={16} /></button></div></div></article>; })}</div></div></section>

        <section id="about" className="section-space relative overflow-hidden border-y border-primary/10 bg-[#f5f0ff]"><div className="section-shell grid items-center gap-12 lg:grid-cols-2"><div className="relative"><img loading="lazy" src={classroomImage} alt="Instructor helping students in a computer classroom" width={1440} height={960} className="aspect-[3/2] w-full rounded-lg object-cover shadow-xl shadow-navy/10" /><div className="absolute bottom-4 right-4 rounded-md bg-background px-4 py-3 shadow-lg"><p className="text-xs font-bold uppercase text-primary">Focused on</p><p className="font-display font-extrabold text-navy">Practical skills</p></div></div><div className="border-l-2 border-secondary pl-5 sm:pl-6"><SectionHeading eyebrow="About us" title="Education That Builds Confidence" text="Scopenet Computer Institute is focused on helping students develop practical computer and communication skills for education, employment and career growth." /><p className="mt-6 text-sm leading-7 text-muted-foreground">Our course options support learners at different stages, from foundational computer skills to accounting, design, communication, and advanced programs.</p><button onClick={() => scrollTo("courses")} className="focus-ring mt-7 inline-flex items-center font-bold text-primary">Explore all courses <ArrowRight className="ml-2" size={17} /></button></div></div></section>

        <section id="why" className="section-space bg-sky"><div className="section-shell"><SectionHeading eyebrow="A better way to learn" title="Why Choose Scopenet?" text="A clear, practical learning experience centered on useful skill development." /><div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{benefits.map(([Icon, title, text]) => <article key={title} className="rounded-lg border border-border bg-background p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><span className="grid size-11 place-items-center rounded-md bg-primary text-primary-foreground"><Icon size={21} /></span><h3 className="mt-5 font-display text-lg font-extrabold text-navy">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div></div></section>

        <Testimonials />

        <section id="enquiry" className="section-space bg-navy"><div className="section-shell grid gap-10 lg:grid-cols-[0.72fr_1.28fr]"><div className="text-primary-foreground"><p className="text-xs font-bold uppercase text-primary">Start a conversation</p><h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">Find the right course for your goals.</h2><p className="mt-5 max-w-md text-sm leading-7 text-primary-foreground/70">Share your interests and preferred timing. The Scopenet team will contact you shortly.</p><div className="mt-8 space-y-4">{["Choose from all available courses", "Tell us your preferred batch", "No payment required to enquire"].map((item) => <p key={item} className="flex gap-3 text-sm font-semibold"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary"><Check size={14} /></span>{item}</p>)}</div></div><EnquiryForm selectedCourse={formCourse} onCourseChange={setFormCourse} /></div></section>

        <section id="faq" className="section-space bg-background"><div className="section-shell grid gap-10 lg:grid-cols-[0.7fr_1.3fr]"><SectionHeading eyebrow="Helpful answers" title="Frequently Asked Questions" text="Quick information about courses, fees, timings, and enquiries." /><FAQ /></div></section>

        <section id="contact" className="section-space bg-sky"><div className="section-shell"><SectionHeading eyebrow="Get in touch" title="Contact Scopenet" text="Have questions about our courses? Get in touch with Scopenet Computer Institute." /><div className="mt-10 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]"><div className="grid gap-3 sm:grid-cols-2"><a href={`tel:${institutePhone}`} className="rounded-lg border border-border bg-background p-5 transition hover:border-primary/40 hover:shadow-md"><Phone className="text-primary" size={20} /><p className="mt-4 text-xs font-bold uppercase text-muted-foreground">Phone</p><p className="mt-1 font-semibold text-navy">{institutePhone}</p></a><a href={whatsappUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-border bg-background p-5 transition hover:border-primary/40 hover:shadow-md"><MessageCircle className="text-primary" size={20} /><p className="mt-4 text-xs font-bold uppercase text-muted-foreground">WhatsApp</p><p className="mt-1 font-semibold text-navy">{institutePhone}</p></a><a href="mailto:vicky143.gupta@gmail" className="rounded-lg border border-border bg-background p-5 transition hover:border-primary/40 hover:shadow-md"><Send className="text-primary" size={20} /><p className="mt-4 text-xs font-bold uppercase text-muted-foreground">Email</p><p className="mt-1 break-all font-semibold text-navy">vicky143.gupta@gmail</p></a><a href={instituteMapUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-border bg-background p-5 transition hover:border-primary/40 hover:shadow-md"><MapPin className="text-primary" size={20} /><p className="mt-4 text-xs font-bold uppercase text-muted-foreground">Address</p><p className="mt-1 font-semibold leading-5 text-navy">{instituteAddress}</p></a><div className="rounded-lg border border-border bg-background p-5"><Clock3 className="text-primary" size={20} /><p className="mt-4 text-xs font-bold uppercase text-muted-foreground">Opening Hours</p><p className="mt-1 font-semibold text-navy">Monday–Saturday, 9:00 AM–9:00 PM</p></div></div><div className="overflow-hidden rounded-lg border border-primary/20 bg-background shadow-sm"><iframe title="Scopenet Computer Institute location" src={`https://www.google.com/maps?q=${encodeURIComponent(instituteAddress)}&output=embed`} className="h-80 w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /><a href={instituteMapUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 border-t border-border px-5 py-3 text-sm font-bold text-primary hover:text-navy"><MapPin size={16} /> Open in Google Maps</a></div></div></div></section>

      </main>

      <CompactFooter />

      <button onClick={() => goToEnquiry()} className="focus-ring fixed bottom-4 right-4 z-30 inline-flex h-12 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-xl shadow-navy/30 transition hover:-translate-y-1 hover:bg-navy"><MessageCircle className="mr-2" size={19} /> Enquire Now</button>

      <Dialog.Root open={Boolean(selectedCourse)} onOpenChange={(open) => !open && setSelectedCourse(null)}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-navy/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-background shadow-2xl data-[state=open]:animate-in data-[state=open]:zoom-in-95"><div className="grid lg:grid-cols-[0.85fr_1.15fr]">{selectedCourse && <div className="bg-sky p-6 sm:p-8"><span className="grid size-12 place-items-center rounded-md bg-primary text-primary-foreground"><BookOpen /></span><Dialog.Title className="mt-6 font-display text-2xl font-extrabold text-navy">{selectedCourse.name}</Dialog.Title><Dialog.Description className="mt-3 text-sm leading-6 text-muted-foreground">{selectedCourse.description}</Dialog.Description><dl className="mt-7 space-y-4"><div><dt className="text-xs font-bold uppercase text-muted-foreground">Duration</dt><dd className="mt-1 font-semibold text-navy">{selectedCourse.duration}</dd></div></dl></div>}<div className="p-6 sm:p-8"><Dialog.Close className="focus-ring absolute right-4 top-4 grid size-9 place-items-center rounded-md border border-border bg-background text-muted-foreground" aria-label="Close"><X size={18} /></Dialog.Close><h3 className="font-display text-xl font-extrabold text-navy">Interested in this course?</h3><p className="mt-2 text-sm text-muted-foreground">Continue to the enquiry form with this course selected.</p><button onClick={() => goToEnquiry(selectedCourse?.name ?? "")} className="focus-ring mt-8 inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-5 font-bold text-primary-foreground">Enquire About This Course <ArrowRight className="ml-2" size={17} /></button><p className="mt-4 text-center text-xs text-muted-foreground">No payment is required to submit an enquiry.</p></div></div></Dialog.Content></Dialog.Portal></Dialog.Root>
    </div>
  );
}

function CompactFooter() {
  const links = [["Home", "home"], ["Courses", "courses"], ["About Us", "about"], ["Contact", "contact"]] as const;

  return <footer className="bg-navy text-primary-foreground"><div className="section-shell flex flex-col gap-6 py-7 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-secondary" /><img src="/scopenet-logo.jpeg" alt="Scopenet Computer Institute" className="h-9 w-auto max-w-[13rem] object-contain" /></div><p className="mt-2 pl-5 text-xs font-semibold text-primary-foreground/70">Practical Computer Education</p></div><nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold sm:justify-end">{links.map(([label, id]) => <button key={id} onClick={() => scrollTo(id)} className="focus-ring text-primary-foreground/75 transition hover:text-primary">{label}</button>)}</nav></div><div className="section-shell border-t border-primary-foreground/15 py-4 text-center text-xs text-primary-foreground/60">© 2026 Scopenet Computer Institute. All Rights Reserved.</div></footer>;
}

type Review = {
  id: string;
  student_name: string;
  course_name: string;
  rating: number;
  review_message: string;
  photo_url: string | null;
  created_at: string;
};

function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewError, setReviewError] = useState("");
  const [reviewLoadError, setReviewLoadError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("id, student_name, course_name, rating, review_message, photo_url, created_at")
      .order("created_at", { ascending: false })
      .limit(12);
    if (error) {
      console.error("Could not load reviews", error);
      setReviewLoadError(error.code === "PGRST205" ? "Reviews are not available until the Supabase reviews migration is applied." : "Reviews could not be loaded right now.");
      return;
    }
    setReviewLoadError("");
    setReviews((data ?? []) as Review[]);
  };

  useEffect(() => {
    void loadReviews();
  }, []);

  const openReviewForm = () => {
    setReviewError("");
    setReviewSuccess(false);
    setRating(5);
    setReviewDialogOpen(true);
  };

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingReview) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const studentName = String(data.get("studentName") ?? "").trim();
    const courseName = String(data.get("courseName") ?? "").trim();
    const reviewMessage = String(data.get("reviewMessage") ?? "").trim();
    const photo = data.get("studentPhoto");
    const honeypot = String(data.get("website") ?? "").trim();
    const lastSubmitted = Number(window.localStorage.getItem("scopenet-review-last-submitted") ?? "0");
    const nextError = honeypot
      ? "Please complete the form normally."
      : Date.now() - lastSubmitted < 30000
        ? "Please wait 30 seconds before submitting another review."
        : studentName.length < 2 || studentName.length > 80
          ? "Enter your name (2 to 80 characters)."
          : !courseName
            ? "Please select your course."
            : reviewMessage.length < 10 || reviewMessage.length > 1000
              ? "Your review must be between 10 and 1000 characters."
              : "";
    if (nextError) {
      setReviewError(nextError);
      return;
    }
    if (photo instanceof File && photo.size > 0 && (!photo.type.startsWith("image/") || photo.size > 2 * 1024 * 1024)) {
      setReviewError("Please choose an image smaller than 2MB.");
      return;
    }

    setReviewError("");
    setSubmittingReview(true);
    try {
      let photoUrl: string | null = null;
      if (photo instanceof File && photo.size > 0) {
        const extension = photo.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${crypto.randomUUID()}.${extension}`;
        const upload = await supabase.storage.from("review-photos").upload(path, photo, { contentType: photo.type, upsert: false });
        if (upload.error) throw upload.error;
        photoUrl = supabase.storage.from("review-photos").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("reviews").insert({ student_name: studentName, course_name: courseName, rating, review_message: reviewMessage, photo_url: photoUrl });
      if (error) throw error;
      window.localStorage.setItem("scopenet-review-last-submitted", String(Date.now()));
      form.reset();
      setRating(5);
      setReviewSuccess(true);
      await loadReviews();
    } catch (error) {
      console.error("Could not submit review", error);
      setReviewError(error && typeof error === "object" && "code" in error && error.code === "PGRST205" ? "The Supabase reviews migration has not been applied yet." : "We could not submit your review right now. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return <section id="reviews" className="section-space bg-background"><div className="section-shell"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><SectionHeading eyebrow="Student experiences" title="What Our Students Say" text="Hear directly from students who have learned and grown with Scopenet." /><button onClick={openReviewForm} className="focus-ring inline-flex h-11 shrink-0 items-center justify-center rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:bg-navy"><MessageCircle className="mr-2" size={17} /> Share Your Experience</button></div>{reviewLoadError && <p role="alert" className="mt-6 rounded-md bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{reviewLoadError}</p>}<div className="mt-10 grid gap-5 md:grid-cols-3">{reviews.length > 0 ? reviews.map((review) => <article key={review.id} className="rounded-lg border border-border bg-sky p-6 shadow-sm"><div className="flex items-center gap-3">{review.photo_url ? <img src={review.photo_url} alt={review.student_name} className="size-12 rounded-full object-cover" /> : <span className="grid size-12 place-items-center rounded-full bg-primary text-lg font-bold text-primary-foreground">{review.student_name.charAt(0).toUpperCase()}</span>}<div><p className="font-bold text-navy">{review.student_name}</p><p className="text-xs font-semibold text-muted-foreground">{review.course_name}</p></div></div><div className="mt-5 flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={16} className={index < review.rating ? "fill-secondary text-secondary" : "text-border"} />)}</div><p className="mt-4 text-sm leading-6 text-muted-foreground">{review.review_message}</p><p className="mt-5 text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p></article>) : <div className="rounded-lg border border-dashed border-primary/30 bg-sky p-6 text-sm text-muted-foreground md:col-span-3">Be the first student to share an experience.</div>}</div></div><Dialog.Root open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-navy/70 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-background p-6 shadow-2xl sm:p-8"><Dialog.Close className="focus-ring absolute right-4 top-4 grid size-9 place-items-center rounded-md border border-border text-muted-foreground" aria-label="Close"><X size={18} /></Dialog.Close>{reviewSuccess ? <div role="status" className="py-8 text-center"><span className="mx-auto grid size-14 place-items-center rounded-full bg-success text-primary-foreground"><Check size={26} /></span><Dialog.Title className="mt-5 font-display text-2xl font-extrabold text-navy">Thank you for sharing your experience!</Dialog.Title><p className="mt-3 text-sm text-muted-foreground">Your review is now visible to other students.</p><button onClick={() => setReviewDialogOpen(false)} className="focus-ring mt-6 font-bold text-primary">Close</button></div> : <><Dialog.Title className="font-display text-2xl font-extrabold text-navy">Share Your Experience</Dialog.Title><Dialog.Description className="mt-2 text-sm text-muted-foreground">Tell future students about your learning experience.</Dialog.Description><form onSubmit={submitReview} noValidate className="mt-6 grid gap-4"><label className="grid gap-2 text-sm font-bold text-navy">Student Name<input name="studentName" required maxLength={80} className="focus-ring h-11 rounded-md border border-input px-3 font-normal" /></label><label className="grid gap-2 text-sm font-bold text-navy">Course Name<select name="courseName" required className="focus-ring h-11 rounded-md border border-input bg-background px-3 font-normal"><option value="">Select a course</option>{courses.map((course) => <option key={course.name}>{course.name}</option>)}</select></label><fieldset><legend className="text-sm font-bold text-navy">Star Rating</legend><div className="mt-2 flex gap-1">{Array.from({ length: 5 }, (_, index) => <button key={index} type="button" onClick={() => setRating(index + 1)} aria-label={`Rate ${index + 1} stars`} className="focus-ring rounded-sm p-1"><Star size={25} className={index < rating ? "fill-accent text-accent" : "text-border"} /></button>)}</div></fieldset><label className="grid gap-2 text-sm font-bold text-navy">Review Message<textarea name="reviewMessage" required minLength={10} maxLength={1000} rows={5} className="focus-ring resize-none rounded-md border border-input p-3 font-normal" /></label><label className="grid gap-2 text-sm font-bold text-navy">Student Photo <span className="text-xs font-normal text-muted-foreground">Optional, max 2MB</span><input name="studentPhoto" type="file" accept="image/jpeg,image/png,image/webp" className="focus-ring rounded-md border border-input p-2 text-sm font-normal" /></label><input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px]" /><p aria-live="polite" className="min-h-5 text-sm font-semibold text-destructive">{reviewError}</p><button type="submit" disabled={submittingReview} className="focus-ring inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 font-bold text-primary-foreground transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-70">{submittingReview ? "Submitting..." : "Submit Review"}</button></form></>}</Dialog.Content></Dialog.Portal></Dialog.Root></section>;
}

function SectionHeading({ eyebrow, title, text, dark = false }: { eyebrow: string; title: string; text: string; dark?: boolean }) { return <div className="max-w-2xl"><p className="text-xs font-bold uppercase text-primary">{eyebrow}</p><h2 className={`mt-3 font-display text-3xl font-extrabold sm:text-4xl ${dark ? "text-primary-foreground" : "text-navy"}`}>{title}</h2><p className={`mt-4 text-sm leading-7 ${dark ? "text-primary-foreground/65" : "text-muted-foreground"}`}>{text}</p></div>; }

function EnquiryForm({ selectedCourse, onCourseChange }: { selectedCourse: string; onCourseChange: (value: string) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const send = useServerFn(submitEnquiry);
  useEffect(() => setSubmitted(false), [selectedCourse]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const nextErrors: Record<string, string> = {};
    const name = String(data.get("name") ?? "").trim();
    const mobile = String(data.get("mobile") ?? "").trim().replace(/\s/g, "");
    const email = String(data.get("email") ?? "").trim();
    const course = String(data.get("course") ?? "");
    if (name.length < 2) nextErrors['name'] = "Please enter your full name.";
    if (!/^[6-9][0-9]{9}$/.test(mobile)) nextErrors['mobile'] = "Enter a valid 10-digit mobile number.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors['email'] = "Enter a valid email address.";
    if (!course) nextErrors['course'] = "Please select a course.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSending(true);
    const message = String(data.get("message") ?? "").trim();
    const batch = String(data.get("batch") ?? "").trim();
    window.open(buildWhatsAppEnquiryUrl({ name, mobile, email, course, batch, message }), "_blank", "noopener,noreferrer");
    try {
      await send({ data: { fullName: name, mobile, email, course, batch, message } });
    } catch {
      console.error("Could not save enquiry to Supabase; the WhatsApp message was opened successfully.");
    } finally {
      form.reset();
      setSubmitted(true);
      setSending(false);
    }
  };
  if (submitted) return <div role="status" className="grid min-h-[34rem] place-items-center rounded-lg bg-background p-8 text-center shadow-xl"><div><span className="mx-auto grid size-16 place-items-center rounded-full bg-success text-primary-foreground"><Check size={30} /></span><h3 className="mt-6 font-display text-2xl font-extrabold text-navy">Thank you! Your enquiry has been received.</h3><p className="mt-3 text-muted-foreground">Our team will contact you shortly.</p><button onClick={() => setSubmitted(false)} className="focus-ring mt-7 font-bold text-primary">Submit another enquiry</button></div></div>;
  return <form onSubmit={submit} noValidate className="rounded-lg bg-background p-6 shadow-2xl sm:p-8"><div className="grid gap-5 sm:grid-cols-2"><Field label="Full Name" name="name" placeholder="Enter your full name" required error={errors['name']} /><Field label="Mobile Number" name="mobile" type="tel" inputMode="numeric" maxLength={10} placeholder="10-digit mobile number" required error={errors['mobile']} /><Field label="Email Address" name="email" type="email" placeholder="Enter your email address" error={errors['email']} /><label className="grid gap-2 text-sm font-bold text-navy">Course Interested In<select name="course" value={selectedCourse} onChange={(event) => onCourseChange(event.target.value)} className="focus-ring h-12 min-w-0 rounded-md border border-input bg-background px-3 font-normal text-foreground"><option value="">Select a course</option>{courses.map((course) => <option key={course.name}>{course.name}</option>)}</select>{errors['course'] && <span className="text-xs text-destructive">{errors['course']}</span>}</label><Field label="Preferred Batch / Timing" name="batch" placeholder="Enter preferred timing" maxLength={80} /><label className="grid gap-2 text-sm font-bold text-navy sm:col-span-2">Message<textarea name="message" maxLength={500} rows={4} placeholder="Tell us what you would like to know" className="focus-ring min-w-0 resize-none rounded-md border border-input bg-background p-3 font-normal text-foreground" /></label></div><button type="submit" disabled={sending} aria-busy={sending} className="focus-ring mt-6 inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-6 font-bold text-primary-foreground transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-70">{sending ? "Sending enquiry..." : <>Submit Enquiry <Send className="ml-2" size={17} /></>}</button><p className="mt-3 text-center text-xs text-muted-foreground">Your details are shared securely with the Scopenet team.</p></form>;
}


function Field({ label, error, ...props }: { label: string; error?: string | undefined } & React.InputHTMLAttributes<HTMLInputElement>) { return <label className="grid gap-2 text-sm font-bold text-navy">{label}<input {...props} className="focus-ring h-12 min-w-0 rounded-md border border-input bg-background px-3 font-normal text-foreground" />{error && <span className="text-xs text-destructive">{error}</span>}</label>; }

const faqItems = [
  ["What courses are available at Scopenet Computer Institute?", "Scopenet currently lists courses in computer fundamentals, accounting and business, office productivity, graphic design, English speaking, and advanced programs."],
  ["How can I enquire about a course?", "Select Enquire Now anywhere on this page, choose your course, and submit the enquiry form."],
  ["What are the course fees?", "Fees are shown on every course card. They currently range from ₹3,000 to ₹16,000 depending on the course."],
  ["What is the duration of the courses?", "Course duration varies by program and is shown on each course card. The duration for CCAS + E.S. is available by contacting the institute."],
  ["Are different batch timings available?", "Batch timings are available for English Speaking. For all other courses, share your preferred timing in the enquiry form."],
  ["How can I contact the institute?", "Use the enquiry form on this page. Phone, WhatsApp, email, address, and opening hours will be added once confirmed."],
];

function FAQ() { return <Accordion.Root type="single" collapsible className="divide-y divide-border border-y border-border">{faqItems.map(([question, answer], index) => <Accordion.Item key={question} value={`item-${index}`}><Accordion.Header><Accordion.Trigger className="group focus-ring flex w-full items-center justify-between gap-4 py-5 text-left font-display font-extrabold text-navy">{question}<ChevronDown className="shrink-0 text-primary transition group-data-[state=open]:rotate-180" size={19} /></Accordion.Trigger></Accordion.Header><Accordion.Content className="overflow-hidden pb-5 text-sm leading-7 text-muted-foreground data-[state=open]:animate-accordion-down">{answer}</Accordion.Content></Accordion.Item>)}</Accordion.Root>; }

