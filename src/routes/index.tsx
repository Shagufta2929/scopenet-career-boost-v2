import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Fragment, useEffect, useRef, useState, type FormEvent } from "react";
import { submitEnquiry } from "../lib/enquiries.functions";

import * as Dialog from "@radix-ui/react-dialog";
import * as Accordion from "@radix-ui/react-accordion";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  Calculator,
  Check,
  ChevronDown,
  Clock3,
  Code2,
  FileSpreadsheet,
  GraduationCap,
  Laptop,
  Layers,
  MapPin,
  Megaphone,
  Menu,
  MessageCircle,
  Palette,
  Phone,
  Quote,
  Send,
  Sparkles,
  Star,
  UserRound,
  Video,
  X,
  Bot,
} from "lucide-react";
import { courses, type Course } from "../data/courses";
import heroImage from "../assets/scopenet-student-lab.jpg";
import classroomImage from "../assets/scopenet-classroom.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Computer Courses | Scopenet Computer Institute" },
      {
        name: "description",
        content:
          "Explore practical, career-focused computer, accounting, design, and English courses at Scopenet Computer Institute.",
      },
      { property: "og:title", content: "Scopenet Computer Institute" },
      {
        property: "og:description",
        content: "Learn skills and build your career with practical computer education.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const navItems = [
  ["Home", "home"],
  ["Courses", "courses"],
  ["About Us", "about"],
  ["Founders", "founders"],
  ["Why Choose Us", "why"],
  ["FAQ", "faq"],
  ["Contact", "contact"],
] as const;

const benefits = [
  [Laptop, "Practical Computer Training", "Learn through guided, hands-on practice."],
  [BriefcaseBusiness, "Career-Focused Courses", "Develop skills relevant to education and work."],
  [BookOpen, "Multiple Course Options", "Choose from foundation to advanced programs."],
  [UserRound, "Beginner-Friendly Learning", "Start with clear, approachable instruction."],
  [Clock3, "Flexible Batch Options", "Ask the institute about available batch timings."],
  [Sparkles, "Skill Development", "Build confidence across practical and communication skills."],
] as const;

const demoTestimonials = [
  {
    name: "Anjali Sharma",
    course: "CCC / MS-CIT / MS Office",
    initial: "A",
    rating: 5,
    review:
      "Scopenet helped me improve my computer skills in a simple and practical way. The classes were easy to understand and practice-oriented.",
  },
  {
    name: "Priya Verma",
    course: "Tally + Advanced Tally + GST",
    initial: "P",
    rating: 5,
    review:
      "The Tally and GST training was easy to follow. Practical examples helped me understand accounting concepts better.",
  },
  {
    name: "Rahul Kumar",
    course: "Advanced Excel",
    initial: "R",
    rating: 5,
    review:
      "Advanced Excel training helped me become more confident with spreadsheets, formulas, reports, and everyday office work.",
  },
  {
    name: "Sneha Patil",
    course: "Graphic Designing",
    initial: "S",
    rating: 5,
    review:
      "I enjoyed the practical approach to graphic design. The training helped me understand design tools and creative project work.",
  },
  {
    name: "Neha Singh",
    course: "MS Office",
    initial: "N",
    rating: 5,
    review:
      "The classes were beginner-friendly and easy to understand. I became much more comfortable using Word, Excel, and PowerPoint.",
  },
  {
    name: "Arjun Mehta",
    course: "Computer Skills",
    initial: "K",
    rating: 5,
    review:
      "The training environment was comfortable and practical. I learned useful computer skills that I can apply in my daily work.",
  },
] as const;

const founders = [
  {
    name: "Vikas Gupta",
    designation: "Founder of Scopenet Computer Institute",
    description:
      "Focused on student growth, student learning, and building practical learning opportunities at Scopenet.",
    experience: "Leadership & Marketing",
    established: "Established 2022",
    image: "/founder/vikas-gupta.jpg",
  },
] as const;

const courseIconMap = {
  "English Speaking": MessageCircle,
  "CCC + Tally": Calculator,
  "CCC + Tally + Advanced Excel": FileSpreadsheet,
  CCAS: BriefcaseBusiness,
  "CCAS + E.S.": MessageCircle,
  "Web Development": Code2,
  "Full Stack Development": Layers,
  "Video Editing": Video,
  Animation: Sparkles,
  "Graphic Designing": Palette,
  "Tally + Advanced Tally + GST": Calculator,
  "CCC / MS-CIT / MS Office": Laptop,
  "Data Science": BrainCircuit,
  "Social Media Marketing": Megaphone,
  "AI / Machine Learning": Bot,
  "Data Analysis with Power BI": BarChart3,
};
const displayedCourses = courses.filter(
  (course) =>
    !["CCC + Tally", "CCC + Tally + Advanced Excel", "CCAS", "CCAS + E.S."].includes(course.name),
);
const institutePhone = "9870407459";
const instituteAddress =
  "Basement 04, Sunshine Commercial Complex, Station Rd, Nala Sopara, Moregaon Talao, Nalasopara East, Vasai-Virar, Maharashtra 401209";
const instituteMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(instituteAddress)}`;
const whatsappUrl =
  "https://wa.me/919870407459?text=Hello%20Scopenet%20Computer%20Institute%2C%20I%20would%20like%20to%20know%20more%20about%20your%20courses.";

function getCourseCategory(courseName: string) {
  if (courseName.includes("Tally")) return "ACCOUNTING";
  if (["Web Development", "Full Stack Development"].includes(courseName)) return "DEVELOPMENT";
  if (
    [
      "Data Science",
      "AI / Machine Learning",
      "Data Analysis with Power BI",
      "Advanced Excel",
    ].includes(courseName)
  )
    return "DATA & AI";
  if (["Graphic Designing", "Video Editing", "Animation"].includes(courseName))
    return "DESIGN & CREATIVE";
  if (courseName === "Social Media Marketing") return "DIGITAL MARKETING";
  return "COMPUTER SKILLS";
}

function buildWhatsAppEnquiryUrl({
  name,
  mobile,
  email,
  course,
  batch,
  message,
}: {
  name: string;
  mobile: string;
  email: string;
  course: string;
  batch: string;
  message: string;
}) {
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
  const [founderImageLoaded, setFounderImageLoaded] = useState(false);
  const aboutRef = useRef<HTMLElement | null>(null);
  const [aboutVisible, setAboutVisible] = useState(false);

  useEffect(() => {
    const element = aboutRef.current;
    if (!element || !("IntersectionObserver" in window)) {
      setAboutVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setAboutVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const image = document.querySelector<HTMLImageElement>(".founder-photo");
    if (image?.complete && image.naturalWidth > 0) {
      setFounderImageLoaded(true);
      image.parentElement?.classList.add("founder-photo-loaded");
    }
  }, []);

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
          <button
            onClick={() => scrollTo("home")}
            className="focus-ring flex min-w-0 items-center gap-3 rounded-md text-left"
          >
            <img
              src="/scopenet-logo.jpeg"
              alt="Scopenet Computer Institute"
              className="h-12 w-auto max-w-[20rem] object-contain sm:h-14 lg:h-18"
            />
          </button>
          <nav aria-label="Main navigation" className="hidden items-center gap-5 lg:flex">
            {navItems.map(([label, id]) => (
              <Fragment key={id}>
                {label === "Contact" && (
                  <Link
                    to="/exams"
                    className="focus-ring rounded-sm text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
                  >
                    Exams
                  </Link>
                )}
                <button
                  onClick={() => scrollTo(id)}
                  className="focus-ring rounded-sm text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
                >
                  {label}
                </button>
              </Fragment>
            ))}
            <button
              onClick={() => goToEnquiry()}
              className="focus-ring inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-navy"
            >
              Enquire Now <ArrowRight className="ml-2" size={16} />
            </button>
          </nav>
          <button
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
            className="focus-ring grid size-11 place-items-center rounded-md border border-border text-navy lg:hidden"
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <nav className="section-shell grid gap-1 border-t border-border py-3 lg:hidden">
            {navItems.map(([label, id]) => (
              <Fragment key={id}>
                {label === "Contact" && (
                  <Link
                    to="/exams"
                    onClick={() => setMenuOpen(false)}
                    className="focus-ring rounded-md px-3 py-3 text-left text-sm font-semibold hover:bg-muted"
                  >
                    Exams
                  </Link>
                )}
                <button
                  onClick={() => {
                    scrollTo(id);
                    setMenuOpen(false);
                  }}
                  className="focus-ring rounded-md px-3 py-3 text-left text-sm font-semibold hover:bg-muted"
                >
                  {label}
                </button>
              </Fragment>
            ))}
            <button
              onClick={() => goToEnquiry()}
              className="mt-2 rounded-md bg-primary px-4 py-3 font-bold text-primary-foreground"
            >
              Enquire Now
            </button>
          </nav>
        )}
      </header>

      <main>
        <section id="home" className="relative bg-sky py-12 sm:py-16 lg:py-20">
          <div className="section-shell grid items-center gap-12 lg:grid-cols-[1fr_0.92fr]">
            <div className="animate-enter max-w-2xl">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background px-4 py-2 text-xs font-bold uppercase text-primary">
                <GraduationCap size={16} /> Practical computer education
              </p>
              <h1 className="font-display text-4xl font-extrabold leading-[1.08] text-navy sm:text-5xl lg:text-7xl">
                Learn Skills.
                <br />
                <span className="text-primary">Build Your Career.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                Upgrade your computer skills with practical and career-focused training at Scopenet
                Computer Institute.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => scrollTo("courses")}
                  className="focus-ring inline-flex h-12 items-center justify-center rounded-md bg-primary px-6 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-navy"
                >
                  Explore Courses <ArrowRight className="ml-2" size={18} />
                </button>
                <button
                  onClick={() => goToEnquiry()}
                  className="focus-ring inline-flex h-12 items-center justify-center rounded-md border border-navy/20 bg-background px-6 font-bold text-navy transition hover:border-primary hover:text-primary"
                >
                  Enquire Now
                </button>
              </div>
            </div>
            <div className="relative animate-enter">
              <div className="overflow-hidden rounded-lg border-8 border-background shadow-2xl shadow-navy/15">
                <img
                  src={heroImage}
                  alt="Student learning computer skills in a modern computer lab"
                  width={1440}
                  height={1200}
                  className="aspect-[6/5] w-full object-cover"
                />
              </div>
              <HeroInfoCard
                className="hero-card-top-left left-2 top-4 sm:left-0 sm:top-8"
                icon={<GraduationCap size={18} />}
                title="Practical Learning"
                subtitle="Learn by doing"
              />
              <HeroInfoCard
                className="hero-card-top-right right-2 top-4 sm:right-0 sm:top-10"
                icon={<Laptop size={18} />}
                title="Job-Ready Skills"
                subtitle="Skills for your career"
              />
              <HeroInfoCard
                className="hero-card-bottom-left bottom-16 left-2 sm:bottom-20 sm:left-0"
                icon={<Award size={18} />}
                title="Certificate Courses"
                subtitle="Learn. Practice. Grow."
              />
              <HeroInfoCard
                className="hero-card-bottom-right bottom-2 right-2 sm:bottom-4 sm:right-0"
                icon={<BriefcaseBusiness size={18} />}
                title="100% Job Assistance"
                subtitle="Learn. Get Skills. Hire."
              />
              <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-md bg-navy px-4 py-3 text-primary-foreground shadow-xl sm:-left-5">
                <span className="grid size-9 place-items-center rounded-md bg-primary">
                  <Check size={18} />
                </span>
                <span>
                  <strong className="block text-sm">Practical Learning</strong>
                  <span className="text-xs opacity-75">Skills for career growth</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Learning highlights" className="border-y border-border bg-background">
          <div className="section-shell grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 md:divide-y-0">
            {[
              "Practical Learning",
              "Career-Focused Courses",
              "Multiple Course Options",
              "Certificate-Oriented Learning",
            ].map((item, i) => (
              <div key={item} className="flex min-h-28 items-center gap-3 px-3 py-5 sm:px-6">
                <span className="font-display text-xl font-extrabold text-primary">0{i + 1}</span>
                <span className="text-sm font-bold leading-5 text-navy">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="courses" className="section-space bg-background">
          <div className="section-shell">
            <div className="courses-section-heading">
              <SectionHeading
                eyebrow="Explore your options"
                title="Our Courses"
                text="Practical learning paths designed to help you build useful, career-focused skills."
              />
            </div>
            <div className="courses-card-grid mt-10">
              {displayedCourses.map((course, index) => {
                return (
                  <CourseFlipCard
                    key={course.name}
                    course={course}
                    index={index}
                    onEnquire={() => openCourse(course)}
                  />
                );
              })}
            </div>
          </div>
        </section>

        <section
          ref={aboutRef}
          id="about"
          className={`about-section section-space ${aboutVisible ? "about-section-visible" : ""}`}
        >
          <div className="about-section-shell section-shell grid items-center gap-12 lg:grid-cols-2">
            <div className="about-image-wrap relative">
              <img
                loading="lazy"
                src={classroomImage}
                alt="Instructor helping students in a computer classroom"
                width={1440}
                height={960}
                className="aspect-[3/2] w-full rounded-lg object-cover shadow-xl shadow-navy/10"
              />
              <div className="about-image-caption absolute bottom-4 right-4 rounded-md bg-background px-4 py-3 shadow-lg">
                <p className="text-xs font-bold uppercase text-primary">Focused on</p>
                <p className="font-display font-extrabold text-navy">Practical skills</p>
              </div>
            </div>
            <div className="about-content">
              <div className="about-heading">
                <SectionHeading
                  eyebrow="ABOUT US"
                  title="Education That Builds Skills, Confidence & Careers"
                  text="Scopenet Computer Institute is focused on providing practical, career-oriented computer education that helps students build useful digital skills for education, employment, and professional growth."
                />
              </div>
              <div className="about-copy">
                <p>
                  Our courses are designed for learners at different stages, from foundational
                  computer skills and MS Office to accounting, advanced Excel, graphic designing,
                  and other career-focused programs. We emphasize practical learning so students can
                  understand concepts and confidently apply them in real-world situations.
                </p>
                <p>
                  At Scopenet, we believe effective learning goes beyond theory. Our training
                  approach focuses on hands-on practice, clear guidance, and skill development so
                  that students can become more confident and capable in today&apos;s
                  technology-driven environment.
                </p>
              </div>
              <button
                onClick={() => scrollTo("courses")}
                className="about-cta focus-ring mt-7 inline-flex items-center font-bold text-primary"
              >
                Explore Our Courses <ArrowRight className="ml-2" size={17} />
              </button>
            </div>
          </div>
        </section>

        <section id="founders" className="founders-section section-space bg-sky">
          <div className="section-shell">
            <div className="founders-heading mx-auto max-w-2xl text-center">
              <SectionHeading
                eyebrow="FOUNDERS"
                title="Meet Our Founders"
                text="Get to know the people behind Scopenet Computer Institute and its practical approach to learning."
              />
            </div>
            <div className="founders-card-grid mt-8">
              {founders.map((founder) => (
                <article key={founder.name} className="scopenet-founder-card">
                  <div className="founder-photo-wrap">
                    {!founderImageLoaded && (
                      <div
                        className="founder-photo-placeholder"
                        role="img"
                        aria-label="Founder portrait to be supplied"
                      >
                        <UserRound aria-hidden="true" size={42} strokeWidth={1.5} />
                        <span>Portrait to be supplied</span>
                      </div>
                    )}
                    {founder.image && (
                      <img
                        src={founder.image}
                        alt={`${founder.name}, ${founder.designation}`}
                        className="founder-photo"
                        onLoad={(event) => {
                          setFounderImageLoaded(true);
                          event.currentTarget.parentElement?.classList.add("founder-photo-loaded");
                        }}
                        onError={(event) => {
                          setFounderImageLoaded(false);
                          event.currentTarget.parentElement?.classList.remove(
                            "founder-photo-loaded",
                          );
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <span className="founder-badge">
                      {founder.experience ?? "Profile details pending"}
                    </span>
                  </div>
                  <div className="founder-card-content text-center">
                    <h3 className="font-display text-xl font-extrabold text-navy">
                      {founder.name}
                    </h3>
                    <p className="mt-2 text-sm font-bold text-primary">{founder.designation}</p>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      {founder.description}
                    </p>
                    <p className="mt-4 inline-flex rounded-full bg-sky px-3 py-1 text-xs font-bold text-primary">
                      {founder.established}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="why" className="section-space bg-sky">
          <div className="section-shell">
            <div className="mx-auto max-w-2xl text-center">
              <SectionHeading
                eyebrow="A better way to learn"
                title="Why Choose Scopenet?"
                text="A clear, practical learning experience centered on useful skill development."
              />
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map(([Icon, title, text]) => (
                <article
                  key={title}
                  className="rounded-lg border border-border bg-background p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className="grid size-11 place-items-center rounded-md bg-primary text-primary-foreground">
                    <Icon size={21} />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-extrabold text-navy">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="reviews-section section-space bg-sky">
          <div className="section-shell">
            <div className="reviews-heading mx-auto max-w-2xl text-center">
              <SectionHeading
                eyebrow="STUDENT EXPERIENCES"
                title="What Our Students Say"
                text="See what our students say about their learning experience at Scopenet."
              />
            </div>
            <div className="reviews-card-grid mt-10">
              {demoTestimonials.map((testimonial) => (
                <article key={testimonial.name} className="testimonial-card">
                  <Quote className="testimonial-quote" aria-hidden="true" size={28} />
                  <div
                    className="testimonial-avatar"
                    role="img"
                    aria-label={`${testimonial.name} demo avatar`}
                  >
                    {testimonial.initial}
                  </div>
                  <div className="mt-5 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg font-extrabold text-navy">
                        {testimonial.name}
                      </h3>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-primary">
                        {testimonial.course}
                      </p>
                    </div>
                    <span className="testimonial-label">Student Review</span>
                  </div>
                  <div
                    className="testimonial-rating mt-5"
                    aria-label={`${testimonial.rating} out of 5 stars`}
                  >
                    {Array.from({ length: testimonial.rating }, (_, index) => (
                      <Star key={index} aria-hidden="true" size={16} fill="currentColor" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    “{testimonial.review}”
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="enquiry" className="section-space bg-navy">
          <div className="section-shell grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="text-primary-foreground">
              <p className="text-xs font-bold uppercase text-primary">Start a conversation</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
                Find the right course for your goals.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-primary-foreground/70">
                Share your interests and preferred timing. The Scopenet team will contact you
                shortly.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  "Choose from all available courses",
                  "Tell us your preferred batch",
                  "No payment required to enquire",
                ].map((item) => (
                  <p key={item} className="flex gap-3 text-sm font-semibold">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary">
                      <Check size={14} />
                    </span>
                    {item}
                  </p>
                ))}
              </div>
            </div>
            <EnquiryForm selectedCourse={formCourse} onCourseChange={setFormCourse} />
          </div>
        </section>

        <section id="faq" className="section-space bg-background">
          <div className="section-shell grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <SectionHeading
              eyebrow="Helpful answers"
              title="Frequently Asked Questions"
              text="Quick information about courses, fees, timings, and enquiries."
            />
            <FAQ />
          </div>
        </section>

        <section id="contact" className="section-space bg-sky">
          <div className="section-shell">
            <SectionHeading
              eyebrow="Get in touch"
              title="Contact Scopenet"
              text="Have questions about our courses? Get in touch with Scopenet Computer Institute."
            />
            <div className="mt-10 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href={`tel:${institutePhone}`}
                  className="rounded-lg border border-border bg-background p-5 transition hover:border-primary/40 hover:shadow-md"
                >
                  <Phone className="text-primary" size={20} />
                  <p className="mt-4 text-xs font-bold uppercase text-muted-foreground">Phone</p>
                  <p className="mt-1 font-semibold text-navy">{institutePhone}</p>
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-border bg-background p-5 transition hover:border-primary/40 hover:shadow-md"
                >
                  <MessageCircle className="text-primary" size={20} />
                  <p className="mt-4 text-xs font-bold uppercase text-muted-foreground">WhatsApp</p>
                  <p className="mt-1 font-semibold text-navy">{institutePhone}</p>
                </a>
                <a
                  href="mailto:vicky143.gupta@gmail"
                  className="rounded-lg border border-border bg-background p-5 transition hover:border-primary/40 hover:shadow-md"
                >
                  <Send className="text-primary" size={20} />
                  <p className="mt-4 text-xs font-bold uppercase text-muted-foreground">Email</p>
                  <p className="mt-1 break-all font-semibold text-navy">vicky143.gupta@gmail</p>
                </a>
                <a
                  href={instituteMapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-border bg-background p-5 transition hover:border-primary/40 hover:shadow-md"
                >
                  <MapPin className="text-primary" size={20} />
                  <p className="mt-4 text-xs font-bold uppercase text-muted-foreground">Address</p>
                  <p className="mt-1 font-semibold leading-5 text-navy">{instituteAddress}</p>
                </a>
                <div className="rounded-lg border border-border bg-background p-5">
                  <Clock3 className="text-primary" size={20} />
                  <p className="mt-4 text-xs font-bold uppercase text-muted-foreground">
                    Opening Hours
                  </p>
                  <p className="mt-1 font-semibold text-navy">Monday–Saturday, 9:00 AM–9:00 PM</p>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-primary/20 bg-background shadow-sm">
                <iframe
                  title="Scopenet Computer Institute location"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(instituteAddress)}&output=embed`}
                  className="h-80 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <a
                  href={instituteMapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 border-t border-border px-5 py-3 text-sm font-bold text-primary hover:text-navy"
                >
                  <MapPin size={16} /> Open in Google Maps
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <CompactFooter />

      <button
        onClick={() => goToEnquiry()}
        className="focus-ring fixed bottom-4 right-4 z-30 inline-flex h-12 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-xl shadow-navy/30 transition hover:-translate-y-1 hover:bg-navy"
      >
        <MessageCircle className="mr-2" size={19} /> Enquire Now
      </button>

      <Dialog.Root
        open={Boolean(selectedCourse)}
        onOpenChange={(open) => !open && setSelectedCourse(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-background shadow-2xl data-[state=open]:animate-in data-[state=open]:zoom-in-95">
            <div className="grid lg:grid-cols-[0.85fr_1.15fr]">
              {selectedCourse && (
                <div className="bg-sky p-6 sm:p-8">
                  <span className="grid size-12 place-items-center rounded-md bg-primary text-primary-foreground">
                    <BookOpen />
                  </span>
                  <Dialog.Title className="mt-6 font-display text-2xl font-extrabold text-navy">
                    {selectedCourse.name}
                  </Dialog.Title>
                  <Dialog.Description className="mt-3 text-sm leading-6 text-muted-foreground">
                    {selectedCourse.description}
                  </Dialog.Description>
                  <dl className="mt-7 space-y-4">
                    <div>
                      <dt className="text-xs font-bold uppercase text-muted-foreground">
                        Duration
                      </dt>
                      <dd className="mt-1 font-semibold text-navy">{selectedCourse.duration}</dd>
                    </div>
                  </dl>
                </div>
              )}
              <div className="p-6 sm:p-8">
                <Dialog.Close
                  className="focus-ring absolute right-4 top-4 grid size-9 place-items-center rounded-md border border-border bg-background text-muted-foreground"
                  aria-label="Close"
                >
                  <X size={18} />
                </Dialog.Close>
                <h3 className="font-display text-xl font-extrabold text-navy">
                  Interested in this course?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Continue to the enquiry form with this course selected.
                </p>
                <button
                  onClick={() => goToEnquiry(selectedCourse?.name ?? "")}
                  className="focus-ring mt-8 inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-5 font-bold text-primary-foreground"
                >
                  Enquire About This Course <ArrowRight className="ml-2" size={17} />
                </button>
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  No payment is required to submit an enquiry.
                </p>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function CompactFooter() {
  const links = navItems;

  return (
    <footer className="border-t border-primary/20 bg-navy text-primary-foreground">
      <div className="section-shell grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_1.1fr] lg:gap-16">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-secondary" />
            <img
              src="/scopenet-logo.jpeg"
              alt="Scopenet Computer Institute"
              className="h-12 w-auto max-w-[15rem] object-contain"
            />
          </div>
          <p className="mt-5 max-w-sm text-sm leading-7 text-primary-foreground/70">
            Practical Computer Education
          </p>
          <div className="mt-6 grid gap-3 text-sm text-primary-foreground/75">
            <a
              className="focus-ring inline-flex items-start gap-3 transition hover:text-primary"
              href="mailto:vicky143.gupta@gmail"
            >
              <Send className="mt-0.5 shrink-0 text-primary" size={16} />
              <span>vicky143.gupta@gmail</span>
            </a>
            <a
              className="focus-ring inline-flex items-start gap-3 transition hover:text-primary"
              href={`tel:${institutePhone}`}
            >
              <Phone className="mt-0.5 shrink-0 text-primary" size={16} />
              <span>{institutePhone}</span>
            </a>
            <a
              className="focus-ring inline-flex items-start gap-3 transition hover:text-primary"
              href={instituteMapUrl}
              target="_blank"
              rel="noreferrer"
            >
              <MapPin className="mt-0.5 shrink-0 text-primary" size={16} />
              <span>{instituteAddress}</span>
            </a>
          </div>
        </div>
        <div>
          <h2 className="font-display text-sm font-extrabold uppercase tracking-[0.16em] text-primary">
            Quick Links
          </h2>
          <nav aria-label="Footer navigation" className="mt-5 grid gap-3 text-sm font-semibold">
            {links.map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="focus-ring w-fit text-left text-primary-foreground/75 transition hover:text-primary"
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div>
          <h2 className="font-display text-sm font-extrabold uppercase tracking-[0.16em] text-primary">
            Connect With Us
          </h2>
          <p className="mt-5 max-w-xs text-sm leading-7 text-primary-foreground/70">
            Have questions about our courses? Get in touch with Scopenet Computer Institute.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="focus-ring mt-6 inline-flex items-center gap-3 rounded-md border border-primary/40 px-4 py-3 text-sm font-bold text-primary-foreground transition hover:border-primary hover:bg-primary/10"
          >
            <MessageCircle size={18} className="text-primary" /> WhatsApp Scopenet
          </a>
        </div>
      </div>
      <div className="section-shell border-t border-primary-foreground/15 py-4 text-center text-xs text-primary-foreground/60">
        © 2026 Scopenet Computer Institute. All Rights Reserved.
      </div>
    </footer>
  );
}

function getCourseLearnings(courseName: string) {
  if (courseName.includes("Tally")) {
    return ["Accounting entries", "GST fundamentals", "Practical business reports"];
  }
  if (courseName.includes("Excel")) {
    return ["Formulas and functions", "Data cleaning", "Reports and dashboards"];
  }
  if (courseName.includes("Designing")) {
    return ["Design principles", "Creative layouts", "Professional visual projects"];
  }
  if (courseName.includes("English")) {
    return ["Confident speaking", "Everyday vocabulary", "Interview communication"];
  }
  if (courseName.includes("Development")) {
    return ["Responsive interfaces", "Modern web tools", "Real-world projects"];
  }
  if (courseName.includes("Video") || courseName.includes("Animation")) {
    return ["Visual storytelling", "Creative production", "Portfolio-ready work"];
  }
  if (courseName.includes("Data") || courseName.includes("Power BI") || courseName.includes("AI")) {
    return ["Data handling", "Practical analysis", "Industry workflows"];
  }
  if (courseName.includes("CCAS")) {
    return ["Advanced computer skills", "Office productivity", "Career-focused practice"];
  }
  return ["Computer fundamentals", "Digital confidence", "Practical workplace skills"];
}

function getCourseIllustrationKind(courseName: string) {
  if (courseName.includes("Tally")) return "accounting";
  if (courseName.includes("Excel")) return "spreadsheet";
  if (courseName.includes("Designing")) return "design";
  if (courseName.includes("English")) return "language";
  if (courseName.includes("Development")) return "development";
  if (courseName.includes("Video") || courseName.includes("Animation")) return "creative";
  if (courseName.includes("Data") || courseName.includes("Power BI") || courseName.includes("AI"))
    return "data";
  return "computer";
}

function CourseIllustration({
  courseName,
  icon: Icon,
  back = false,
}: {
  courseName: string;
  icon: typeof Laptop;
  back?: boolean;
}) {
  const kind = getCourseIllustrationKind(courseName);
  return (
    <div className={`course-illustration course-illustration-${kind}${back ? " is-back" : ""}`}>
      <span className="course-illustration-sun" aria-hidden="true" />
      <span className="course-illustration-ground" aria-hidden="true" />
      <span className="course-illustration-object course-illustration-object-main">
        <Icon size={back ? 38 : 32} strokeWidth={1.6} />
      </span>
      <span
        className="course-illustration-object course-illustration-object-detail"
        aria-hidden="true"
      />
      <span className="course-illustration-label">{getCourseCategory(courseName)}</span>
    </div>
  );
}

function CourseFlipCard({
  course,
  index,
  onEnquire,
}: {
  course: Course;
  index: number;
  onEnquire: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const CourseIcon = courseIconMap[course.name as keyof typeof courseIconMap] ?? BookOpen;
  const learnings = getCourseLearnings(course.name);

  const toggleCard = () => setFlipped((value) => !value);
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleCard();
    }
  };

  return (
    <div
      className={`course-flip-card ${flipped ? "is-flipped" : ""}`}
      tabIndex={0}
      role="button"
      aria-label={`${course.name} course card. Press Enter to flip.`}
      onClick={toggleCard}
      onKeyDown={handleKeyDown}
    >
      <div className="course-flip-card-inner">
        <article className="course-flip-face course-flip-front">
          <div className="course-visual">
            <span className="course-number">{String(index + 1).padStart(2, "0")}</span>
            <CourseIllustration courseName={course.name} icon={CourseIcon} />
          </div>
          <div className="course-card-content">
            <p className="course-category">{getCourseCategory(course.name)}</p>
            <h3 className="course-card-title">{course.name}</h3>
            <p className="course-card-description">{course.description}</p>
            <div className="course-card-meta">
              <span className="course-duration">
                <Clock3 size={14} /> {course.duration}
              </span>
              {course.batchNote && <span className="course-batch-note">{course.batchNote}</span>}
            </div>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onEnquire();
              }}
              className="focus-ring course-enquire-button"
            >
              Enquire Now <ArrowRight size={16} />
            </button>
          </div>
        </article>

        <article className="course-flip-face course-flip-back">
          <div className="course-back-visual">
            <CourseIllustration courseName={course.name} icon={CourseIcon} back />
          </div>
          <div className="course-card-content">
            <p className="course-category">Your learning path</p>
            <h3 className="course-card-title">What You&apos;ll Learn</h3>
            <ul className="course-learning-list">
              {learnings.map((learning) => (
                <li key={learning}>
                  <Check size={14} /> {learning}
                </li>
              ))}
            </ul>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onEnquire();
              }}
              className="focus-ring course-enquire-button"
            >
              Enquire Now <ArrowRight size={16} />
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}

function HeroInfoCard({
  className,
  icon,
  title,
  subtitle,
}: {
  className: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      className={`hero-card-float absolute z-10 flex w-[9.25rem] items-center gap-2 rounded-lg border border-primary/15 bg-white/95 px-2.5 py-2 shadow-lg shadow-navy/15 backdrop-blur-sm sm:w-[11.5rem] sm:gap-3 sm:px-3 sm:py-2.5 ${className}`}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary sm:size-9">
        {icon}
      </span>
      <span className="min-w-0">
        <strong className="block truncate text-[10px] font-extrabold leading-4 text-navy sm:text-xs">
          {title}
        </strong>
        <span className="block truncate text-[9px] leading-3 text-muted-foreground sm:text-[10px]">
          {subtitle}
        </span>
      </span>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  text,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  text: string;
  dark?: boolean;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-bold uppercase text-primary">{eyebrow}</p>
      <h2
        className={`mt-3 font-display text-3xl font-extrabold sm:text-4xl ${dark ? "text-primary-foreground" : "text-navy"}`}
      >
        {title}
      </h2>
      <p
        className={`mt-4 text-sm leading-7 ${dark ? "text-primary-foreground/65" : "text-muted-foreground"}`}
      >
        {text}
      </p>
    </div>
  );
}

function EnquiryForm({
  selectedCourse,
  onCourseChange,
}: {
  selectedCourse: string;
  onCourseChange: (value: string) => void;
}) {
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
    const mobile = String(data.get("mobile") ?? "")
      .trim()
      .replace(/\s/g, "");
    const email = String(data.get("email") ?? "").trim();
    const course = String(data.get("course") ?? "");
    if (name.length < 2) nextErrors["name"] = "Please enter your full name.";
    if (!/^[6-9][0-9]{9}$/.test(mobile))
      nextErrors["mobile"] = "Enter a valid 10-digit mobile number.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      nextErrors["email"] = "Enter a valid email address.";
    if (!course) nextErrors["course"] = "Please select a course.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSending(true);
    const message = String(data.get("message") ?? "").trim();
    const batch = String(data.get("batch") ?? "").trim();
    window.open(
      buildWhatsAppEnquiryUrl({ name, mobile, email, course, batch, message }),
      "_blank",
      "noopener,noreferrer",
    );
    try {
      await send({ data: { fullName: name, mobile, email, course, batch, message } });
    } catch {
      console.error(
        "Could not save enquiry to Supabase; the WhatsApp message was opened successfully.",
      );
    } finally {
      form.reset();
      setSubmitted(true);
      setSending(false);
    }
  };
  if (submitted)
    return (
      <div
        role="status"
        className="grid min-h-[34rem] place-items-center rounded-lg bg-background p-8 text-center shadow-xl"
      >
        <div>
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-success text-primary-foreground">
            <Check size={30} />
          </span>
          <h3 className="mt-6 font-display text-2xl font-extrabold text-navy">
            Thank you! Your enquiry has been received.
          </h3>
          <p className="mt-3 text-muted-foreground">Our team will contact you shortly.</p>
          <button
            onClick={() => setSubmitted(false)}
            className="focus-ring mt-7 font-bold text-primary"
          >
            Submit another enquiry
          </button>
        </div>
      </div>
    );
  return (
    <form onSubmit={submit} noValidate className="rounded-lg bg-background p-6 shadow-2xl sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Full Name"
          name="name"
          placeholder="Enter your full name"
          required
          error={errors["name"]}
        />
        <Field
          label="Mobile Number"
          name="mobile"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          placeholder="10-digit mobile number"
          required
          error={errors["mobile"]}
        />
        <Field
          label="Email Address"
          name="email"
          type="email"
          placeholder="Enter your email address"
          error={errors["email"]}
        />
        <label className="grid gap-2 text-sm font-bold text-navy">
          Course Interested In
          <select
            name="course"
            value={selectedCourse}
            onChange={(event) => onCourseChange(event.target.value)}
            className="focus-ring h-12 min-w-0 rounded-md border border-input bg-background px-3 font-normal text-foreground"
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={course.name}>{course.name}</option>
            ))}
          </select>
          {errors["course"] && <span className="text-xs text-destructive">{errors["course"]}</span>}
        </label>
        <Field
          label="Preferred Batch / Timing"
          name="batch"
          placeholder="Enter preferred timing"
          maxLength={80}
        />
        <label className="grid gap-2 text-sm font-bold text-navy sm:col-span-2">
          Message
          <textarea
            name="message"
            maxLength={500}
            rows={4}
            placeholder="Tell us what you would like to know"
            className="focus-ring min-w-0 resize-none rounded-md border border-input bg-background p-3 font-normal text-foreground"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={sending}
        aria-busy={sending}
        className="focus-ring mt-6 inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-6 font-bold text-primary-foreground transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-70"
      >
        {sending ? (
          "Sending enquiry..."
        ) : (
          <>
            Submit Enquiry <Send className="ml-2" size={17} />
          </>
        )}
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Your details are shared securely with the Scopenet team.
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  ...props
}: { label: string; error?: string | undefined } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-2 text-sm font-bold text-navy">
      {label}
      <input
        {...props}
        className="focus-ring h-12 min-w-0 rounded-md border border-input bg-background px-3 font-normal text-foreground"
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

const faqItems = [
  [
    "What courses are available at Scopenet Computer Institute?",
    "Scopenet currently lists courses in computer fundamentals, accounting and business, office productivity, graphic design, English speaking, and advanced programs.",
  ],
  [
    "How can I enquire about a course?",
    "Select Enquire Now anywhere on this page, choose your course, and submit the enquiry form.",
  ],
  [
    "What are the course fees?",
    "Fees are shown on every course card. They currently range from ₹3,000 to ₹16,000 depending on the course.",
  ],
  [
    "What is the duration of the courses?",
    "Course duration varies by program and is shown on each course card. The duration for CCAS + E.S. is available by contacting the institute.",
  ],
  [
    "Are different batch timings available?",
    "Batch timings are available for English Speaking. For all other courses, share your preferred timing in the enquiry form.",
  ],
  [
    "How can I contact the institute?",
    "Use the enquiry form on this page. Phone, WhatsApp, email, address, and opening hours will be added once confirmed.",
  ],
];

function FAQ() {
  return (
    <Accordion.Root
      type="single"
      collapsible
      className="divide-y divide-border border-y border-border"
    >
      {faqItems.map(([question, answer], index) => (
        <Accordion.Item key={question} value={`item-${index}`}>
          <Accordion.Header>
            <Accordion.Trigger className="group focus-ring flex w-full items-center justify-between gap-4 py-5 text-left font-display font-extrabold text-navy">
              {question}
              <ChevronDown
                className="shrink-0 text-primary transition group-data-[state=open]:rotate-180"
                size={19}
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden pb-5 text-sm leading-7 text-muted-foreground data-[state=open]:animate-accordion-down">
            {answer}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
