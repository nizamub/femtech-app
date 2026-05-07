import { getDictionary, hasLocale, type Locale } from "@/dictionaries";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import {
  Leaf, Stethoscope, BookOpen, Heart, MapPin,
  ShieldCheck, Sparkles, Sun, ArrowRight,
  Users, Flower2, HandHeart, Sunrise,
} from "lucide-react";

// ─── Feature Pills (right column) ────────────────────────────────────────────
const PILLS = [
  {
    bn: "ডাক্তারের পরামর্শ",
    en: "Talk to a Doctor",
    icon: Stethoscope,
    accent: "orange",
  },
  {
    bn: "স্বাস্থ্য শিক্ষা",
    en: "Health Education",
    icon: BookOpen,
    accent: "green",
  },
  {
    bn: "মাসিক স্বাস্থ্য সেবা",
    en: "Menstrual Support",
    icon: Flower2,
    accent: "orange",
  },
  {
    bn: "কাছের স্বাস্থ্য কেন্দ্র",
    en: "Nearby Care Centers",
    icon: MapPin,
    accent: "green",
  },
];

// ─── Bottom banner features ───────────────────────────────────────────────────
const OFFERS = [
  { icon: ShieldCheck, en: "Safe & Confidential", bn: "নিরাপদ ও গোপনীয়" },
  { icon: Users, en: "Designed for Women", bn: "নারীর জন্য নির্মিত" },
  { icon: Leaf, en: "Inspired by Nature", bn: "প্রকৃতি থেকে অনুপ্রাণিত" },
  { icon: HandHeart, en: "Compassionate Care", bn: "সহানুভূতিশীল সেবা" },
  { icon: Sunrise, en: "A New Dawn of Hope", bn: "আশার নতুন ঊষা" },
];

export default async function UshaLandingPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);
  const session = await auth();
  const user = session?.user;
  const role = (user as any)?.role;
  const isBn = lang === "bn";

  return (
    /* ── Full-bleed page wrapper ─────────────────────────────────────────── */
    <div
      className="relative min-h-[calc(100vh-60px)] flex flex-col overflow-hidden"
      style={{
        backgroundImage: "url('/images/hero-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundColor: "#FAF9F6",
      }}
    >
      {/* Warm tinted overlay so text stays readable over any hero image */}
      <div className="absolute inset-0 bg-stone-900/40 backdrop-brightness-90 pointer-events-none z-0" />

      {/* ── Decorative ambient glows ───────────────────────────────────────── */}
      <div className="absolute -top-32 -left-32 w-[480px] h-[480px] bg-orange-500/20 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[360px] h-[360px] bg-green-800/20 rounded-full blur-3xl pointer-events-none z-0" />

      {/* ── Top floating nature badge ──────────────────────────────────────── */}
      <div className="relative z-10 flex justify-end px-6 pt-5 md:px-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-lg">
          <Leaf size={15} className="text-green-300" />
          <span className="text-white/90 text-xs font-semibold tracking-wide">
            Rooted in Nature. Rising with Hope.
          </span>
          <Sun size={15} className="text-orange-300" />
        </div>
      </div>

      {/* ── MAIN HERO ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex items-center px-4 py-10 md:px-12 lg:px-20">
        <div className="w-full grid lg:grid-cols-[1fr_420px] gap-8 xl:gap-14 items-center">

          {/* ── LEFT: Main glassmorphic hero card ─────────────────────────── */}
          <div
            className="bg-white/15 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-8 md:p-12 animate-up"
            style={{ animationDelay: "0s" }}
          >
            {/* Welcome badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-700/80 backdrop-blur-sm border border-orange-500/50 shadow mb-8">
              <Sparkles size={15} className="text-orange-100" />
              <span className="text-orange-50 text-xs font-bold tracking-widest uppercase">
                {isBn ? "ঊষা-তে স্বাগতম" : "Welcome to ঊষা · USHA"}
              </span>
            </div>

            {/* Bilingual H1 */}
            <h1 className="mb-6 leading-[1.15] tracking-tight">
              <span className="block text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg">
                আপনার স্বাস্থ্য,
              </span>
              <span className="block text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg">
                আমাদের অঙ্গীকার
              </span>
              <span className="block text-xl md:text-2xl font-bold text-orange-200 mt-2">
                Your Health, Our Promise.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-white/80 text-base md:text-lg leading-relaxed mb-10 max-w-xl font-medium">
              {isBn
                ? "পার্বত্য অঞ্চলের নারীদের জন্য বিশেষভাবে তৈরি একটি ডিজিটাল স্বাস্থ্যসেবা প্ল্যাটফর্ম — যেখানে আপনি পাবেন বিশেষজ্ঞ পরামর্শ, স্বাস্থ্য শিক্ষা এবং কাছের সেবা কেন্দ্রের তথ্য।"
                : "A digital health platform built for women of the Hill Tracts — offering expert consultations, health education, and access to nearby care in your language."}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              {user ? (
                <>
                  <Link
                    href={`/${lang}/assessment`}
                    className="group inline-flex items-center gap-2.5 bg-orange-700 hover:bg-orange-600 text-white font-bold py-3.5 px-8 rounded-2xl transition-all shadow-lg hover:shadow-orange-700/40 hover:-translate-y-0.5 text-base"
                  >
                    <Stethoscope size={19} />
                    {isBn ? "স্বাস্থ্য সেবা নিন" : "Get Services"}
                    <ArrowRight size={17} className="opacity-70 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href={role === "expert" || role === "admin" ? `/${lang}/expert/dashboard` : `/${lang}/dashboard`}
                    className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/40 text-white font-bold py-3.5 px-8 rounded-2xl transition-all shadow text-base"
                  >
                    {isBn ? "ড্যাশবোর্ড" : "My Dashboard"}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={`/${lang}/auth/register`}
                    className="group inline-flex items-center gap-2.5 bg-orange-700 hover:bg-orange-600 text-white font-bold py-3.5 px-8 rounded-2xl transition-all shadow-lg hover:shadow-orange-700/40 hover:-translate-y-0.5 text-base"
                  >
                    {isBn ? "সেবা নিন" : "Get Services"}
                    <ArrowRight size={17} className="opacity-70 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href={`/${lang}/auth/login`}
                    className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/40 text-white font-bold py-3.5 px-8 rounded-2xl transition-all shadow text-base"
                  >
                    <BookOpen size={17} />
                    {isBn ? "জানুন ও অন্বেষণ করুন" : "Learn & Explore"}
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* ── RIGHT: Feature Pills ───────────────────────────────────────── */}
          <div
            className="flex flex-col gap-4 animate-up"
            style={{ animationDelay: "0.15s" }}
          >
            {PILLS.map((pill, i) => {
              const Icon = pill.icon;
              const isOrange = pill.accent === "orange";
              return (
                <div
                  key={i}
                  className="group flex items-center gap-5 bg-white/15 hover:bg-white/25 backdrop-blur-xl border border-white/30 shadow-xl rounded-2xl px-6 py-5 transition-all cursor-default hover:-translate-y-0.5"
                >
                  {/* Colored icon box */}
                  <div
                    className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110 ${isOrange
                        ? "bg-orange-700/80 text-orange-100"
                        : "bg-green-800/80 text-green-100"
                      }`}
                  >
                    <Icon size={22} />
                  </div>
                  {/* Bilingual text */}
                  <div>
                    <div className="text-white font-bold text-base leading-tight">
                      {pill.bn}
                    </div>
                    <div className="text-white/60 text-sm font-medium mt-0.5">
                      {pill.en}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* USHA identity micro-card */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 mt-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-800 flex items-center justify-center shadow-lg shrink-0">
                <Sun size={20} className="text-white" />
              </div>
              <div>
                <div className="text-white font-extrabold text-lg leading-none tracking-tight">
                  ঊষা <span className="text-orange-300">USHA</span>
                </div>
                <div className="text-white/50 text-xs font-medium mt-0.5">
                  Hill Tracts Women&apos;s Health Platform
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM BANNER: What USHA Offers You ────────────────────────────── */}
      <div className="relative z-10 px-4 pb-6 md:px-10 animate-up" style={{ animationDelay: "0.3s" }}>
        <div className="bg-white/10 backdrop-blur-xl border border-white/25 shadow-2xl rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Title */}
          <div className="shrink-0">
            <div className="text-white/50 text-xs font-bold uppercase tracking-widest mb-0.5">
              {isBn ? "ঊষা যা দেয়" : "What USHA Offers You"}
            </div>
            <div className="w-10 h-0.5 bg-orange-500 rounded-full" />
          </div>

          {/* Divider — hidden on mobile */}
          <div className="hidden sm:block w-px h-10 bg-white/20 shrink-0" />

          {/* Feature row */}
          <div className="flex flex-wrap gap-x-6 gap-y-4">
            {OFFERS.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-orange-300" />
                  </div>
                  <div>
                    <div className="text-white text-xs font-bold leading-tight">{item.bn}</div>
                    <div className="text-white/50 text-[0.65rem] font-medium">{item.en}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
