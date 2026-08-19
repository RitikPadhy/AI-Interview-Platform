import Link from "next/link";
import { ArrowRight, FileText, Mail, MessagesSquare, Users } from "lucide-react";
import ResumeStatus from "@/components/ResumeStatus";

const CARDS = [
  {
    href: "/interview",
    icon: MessagesSquare,
    title: "Mock Interview",
    body: "Pick a track and a round, paste the job description, then sit a real interview or a timed online assessment. Graded honestly at the end.",
    cta: "Start a round",
  },
  {
    href: "/resume",
    icon: FileText,
    title: "Resume Suggestions",
    body: "The keywords this job description actually screens for, which of your bullets to change, and the gaps you cannot keyword your way out of. Suggestions only.",
    cta: "Analyse a JD",
  },
  {
    href: "/cover-letter",
    icon: Mail,
    title: "Cover Letter",
    body: "150 words. Hook, proof, close. Real metrics from your resume, plain language, none of the words that make a letter read as generated.",
    cta: "Write one",
  },
  {
    href: "/outreach",
    icon: Users,
    title: "Who to Message",
    body: "Searches the web for the hiring manager, the recruiter and the engineers on the team, then drafts the connection request and the follow-up.",
    cta: "Find people",
  },
];

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <h1>Get the interview. Then crack it.</h1>
        <p>
          Four tools that run entirely on your machine through the Claude CLI — no API key, no
          cloud account, nothing leaves this laptop except the web searches you ask for.
        </p>
      </section>

      <ResumeStatus />

      <div className="card-grid">
        {CARDS.map(({ href, icon: Icon, title, body, cta }) => (
          <Link key={href} href={href} className="feature-card">
            <span className="feature-icon">
              <Icon size={18} />
            </span>
            <h2>{title}</h2>
            <p>{body}</p>
            <span className="feature-cta">
              {cta} <ArrowRight size={14} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
