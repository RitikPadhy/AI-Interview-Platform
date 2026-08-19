"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FileText, Mail, MessagesSquare, Users } from "lucide-react";

const LINKS = [
  { href: "/interview", label: "Mock Interview", icon: MessagesSquare },
  { href: "/resume", label: "Resume", icon: FileText },
  { href: "/cover-letter", label: "Cover Letter", icon: Mail },
  { href: "/outreach", label: "Who to Message", icon: Users },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="nav">
      <Link href="/" className="nav-brand">
        <Image src="/logo.svg" alt="" width={26} height={22} />
        <span>Interview Copilot</span>
      </Link>

      <nav className="nav-links">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="nav-link"
            data-active={pathname === href || undefined}
          >
            <Icon size={15} strokeWidth={2} />
            {label}
          </Link>
        ))}
      </nav>

      <span className="nav-badge">running on local claude</span>
    </header>
  );
}
