"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Dictionary, Locale } from "@/dictionaries";
import type { Session } from "next-auth";
import { useState } from "react";
import { Sun, Stethoscope, LayoutDashboard, Users, MapPin, LogOut, Globe, Menu, X, ChevronRight } from "lucide-react";

interface Props {
  dict: Dictionary;
  lang: Locale;
  session: Session | null;
}

export function LangNavbar({ dict, lang, session }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = session?.user;
  const role = (user as any)?.role ?? "user";
  const isExpert = role === "expert" || role === "admin";

  const switchLang = () => {
    const other = lang === "en" ? "bn" : "en";
    const path = window.location.pathname.replace(`/${lang}`, `/${other}`);
    router.push(path);
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  // Nav links for logged-in users
  const navLinks = user
    ? [
      { href: `/${lang}/assessment`, label: dict.nav.assessment, icon: Stethoscope },
      ...(isExpert
        ? [{ href: `/${lang}/expert/dashboard`, label: dict.nav.expertPanel, icon: LayoutDashboard }]
        : [{ href: `/${lang}/dashboard`, label: dict.nav.dashboard, icon: LayoutDashboard }]
      ),
      { href: `/${lang}/clinicians`, label: dict.nav.clinicians, icon: MapPin },
    ]
    : [];

  return (
    <>
      {/* ── Main Navbar ───────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 px-4 py-2.5">
        {/* Glassmorphism pill container */}
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-stone-900/5 rounded-2xl px-5 py-2.5">

          {/* ── Logo ───────────────────────────────────────────────────── */}
          <Link href={`/${lang}`} className="flex items-center gap-2.5 no-underline shrink-0 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-800 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Sun size={16} className="text-white" />
            </div>
            <div className="leading-none">
              <span className="font-extrabold text-[1rem] text-orange-800 tracking-tight">ঊষা</span>
              <span className="font-extrabold text-[1rem] text-green-900 tracking-tight ml-1">USHA</span>
            </div>
            {isExpert && (
              <span className="hidden sm:inline text-[0.6rem] px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-bold border border-green-200 uppercase tracking-wider">
                Expert
              </span>
            )}
          </Link>

          {/* ── Desktop Nav Links ───────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${active
                      ? "bg-orange-700 text-white shadow-sm shadow-orange-700/30"
                      : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-900"
                    }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* ── Right: Lang + Auth ──────────────────────────────────────── */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language toggle */}
            <button
              onClick={switchLang}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-100/80 hover:text-stone-800 transition-colors border border-stone-200/60"
              title={dict.nav.language}
            >
              <Globe size={14} />
              {lang === "en" ? "বাং" : "EN"}
            </button>

            {user ? (
              <>
                {/* User avatar / name pill */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100/80 border border-stone-200/60">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-700 flex items-center justify-center text-white text-[0.65rem] font-extrabold shadow-sm">
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="text-xs font-semibold text-stone-700 max-w-[90px] truncate">
                    {user.name?.split(" ")[0]}
                  </span>
                </div>
                <button
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors border border-transparent hover:border-red-100"
                  onClick={() => signOut({ callbackUrl: `/${lang}/auth/login` })}
                >
                  <LogOut size={15} />
                  <span className="hidden lg:inline">{dict.nav.logout}</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/${lang}/auth/login`}
                  className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-100/80 hover:text-stone-900 transition-colors"
                >
                  {dict.nav.login}
                </Link>
                <Link
                  href={`/${lang}/auth/register`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-orange-700 hover:bg-orange-600 text-white shadow-sm shadow-orange-700/30 transition-all hover:-translate-y-px"
                >
                  {dict.nav.register}
                  <ChevronRight size={14} />
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors"
              onClick={() => setMenuOpen(v => !v)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* ── Mobile Dropdown Menu ────────────────────────────────────────── */}
        {menuOpen && (
          <div className="md:hidden max-w-6xl mx-auto mt-2 bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl rounded-2xl px-4 py-3 flex flex-col gap-1 animate-up">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${active
                      ? "bg-orange-700 text-white"
                      : "text-stone-700 hover:bg-stone-100"
                    }`}
                >
                  <Icon size={17} />
                  {label}
                </Link>
              );
            })}

            {/* Mobile auth buttons */}
            <div className="h-px bg-stone-100 my-1" />
            {user ? (
              <button
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                onClick={() => { signOut({ callbackUrl: `/${lang}/auth/login` }); setMenuOpen(false); }}
              >
                <LogOut size={17} />
                {dict.nav.logout}
              </button>
            ) : (
              <>
                <Link href={`/${lang}/auth/login`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-stone-700 hover:bg-stone-100">
                  {dict.nav.login}
                </Link>
                <Link href={`/${lang}/auth/register`} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-orange-700 text-white">
                  {dict.nav.register}
                </Link>
              </>
            )}

            {/* Language in mobile */}
            <button onClick={() => { switchLang(); setMenuOpen(false); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-100">
              <Globe size={17} />
              {lang === "en" ? "বাংলায় দেখুন" : "View in English"}
            </button>
          </div>
        )}
      </nav>
    </>
  );
}
