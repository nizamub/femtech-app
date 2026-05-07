"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Dictionary, Locale } from "@/dictionaries";
import type { Session } from "next-auth";
import { useState } from "react";
import { Sparkles } from "lucide-react";

interface Props {
  dict: Dictionary;
  lang: Locale;
  session: Session | null;
}

export function LangNavbar({ dict, lang, session }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = session?.user;
  const role = (user as any)?.role ?? "user";
  const isExpert = role === "expert" || role === "admin";

  const switchLang = () => {
    const other = lang === "en" ? "bn" : "en";
    const path = window.location.pathname.replace(`/${lang}`, `/${other}`);
    router.push(path);
  };

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between h-[60px] px-6 bg-white/80 backdrop-blur-xl border-b border-slate-200">
      {/* Logo */}
      <Link href={`/${lang}`} className="flex items-center gap-2 no-underline">
        <Sparkles className="text-emerald-800" size={24} />
        <span className="font-extrabold text-[1.1rem] text-emerald-800 font-sans tracking-tight">
          {dict.common.appName}
        </span>
        {isExpert && (
          <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
            EXPERT
          </span>
        )}
      </Link>

      {/* Desktop nav */}
      <div className="flex gap-2 items-center">
        {/* Language toggle */}
        <button
          onClick={switchLang}
          className="bg-slate-50 border border-slate-200 text-slate-600 rounded-lg px-3 py-1.5 cursor-pointer text-xs font-semibold hover:bg-slate-100 transition-colors"
          title={dict.nav.language}
        >
          🌐 {lang === "en" ? "বাং" : "EN"}
        </button>

        {user ? (
          <>
            <Link href={`/${lang}/assessment`} className="btn btn-ghost text-slate-700 hover:bg-slate-100 btn-sm text-[0.85rem]">
              {dict.nav.assessment}
            </Link>
            {isExpert ? (
              <Link href={`/${lang}/expert/dashboard`} className="btn btn-ghost text-slate-700 hover:bg-slate-100 btn-sm text-[0.85rem]">
                {dict.nav.expertPanel}
              </Link>
            ) : (
              <Link href={`/${lang}/dashboard`} className="btn btn-ghost text-slate-700 hover:bg-slate-100 btn-sm text-[0.85rem]">
                {dict.nav.dashboard}
              </Link>
            )}
            <Link href={`/${lang}/clinicians`} className="btn btn-ghost text-slate-700 hover:bg-slate-100 btn-sm text-[0.85rem]">
              {dict.nav.clinicians}
            </Link>
            <button
              className="btn btn-outline border-slate-200 text-slate-700 hover:bg-slate-100 btn-sm text-[0.85rem]"
              onClick={() => signOut({ callbackUrl: `/${lang}/auth/login` })}
            >
              {dict.nav.logout}
            </button>
          </>
        ) : (
          <>
            <Link href={`/${lang}/auth/login`} className="btn btn-ghost text-slate-700 hover:bg-slate-100 btn-sm text-[0.85rem]">
              {dict.nav.login}
            </Link>
            <Link href={`/${lang}/auth/register`} className="btn bg-emerald-800 hover:bg-emerald-700 text-white border-none btn-sm text-[0.85rem]">
              {dict.nav.register}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
