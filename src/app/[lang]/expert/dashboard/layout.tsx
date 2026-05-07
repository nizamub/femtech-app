"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { isExpertAuthenticated, setExpertAuth } from "@/lib/storage";
import Link from "next/link";
import { Sparkles, LayoutDashboard, TrendingUp, Users, HelpCircle, Stethoscope, Hospital, Scale, User, LogOut, Loader2 } from "lucide-react";

export default function ExpertLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const lang = (params?.lang as string) ?? "en";
  const [ready, setReady] = useState(false);

  const NAV = [
    { href: `/${lang}/expert/dashboard`,            label: "Overview",          id: "overview",   icon: LayoutDashboard },
    { href: `/${lang}/expert/dashboard/analytics`,  label: "Analytics",         id: "analytics",  icon: TrendingUp },
    { href: `/${lang}/expert/dashboard/users`,      label: "Patients",          id: "users",      icon: Users },
    { href: `/${lang}/expert/dashboard/questions`,  label: "Questions",         id: "questions",  icon: HelpCircle },
    { href: `/${lang}/expert/dashboard/conditions`, label: "Conditions",        id: "conditions", icon: Stethoscope },
    { href: `/${lang}/expert/dashboard/clinicians`, label: "Clinicians",        id: "clinicians", icon: Hospital },
    { href: `/${lang}/expert/dashboard/thresholds`, label: "Score Thresholds",  id: "thresholds", icon: Scale },
  ];

  useEffect(() => {
    if (!isExpertAuthenticated()) router.push(`/${lang}/expert/login`);
    else setReady(true);
  }, [router, lang]);

  const logout = () => { setExpertAuth(false); router.push(`/${lang}`); };

  if (!ready) return <div className="flex items-center justify-center min-h-screen bg-slate-50"><Loader2 className="animate-spin text-emerald-800" size={48} /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 h-[60px] flex items-center px-6 shrink-0">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
          <Link href={`/${lang}`} className="flex items-center gap-2 no-underline group">
            <Sparkles className="text-emerald-800 group-hover:scale-110 transition-transform" size={24} />
            <span className="font-extrabold text-[1.1rem] text-emerald-800 tracking-tight font-sans">Aura</span>
            <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 ml-2">Expert</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href={`/${lang}`} className="flex items-center gap-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">
              <User size={16} /> User View
            </Link>
            <button className="flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors border border-red-200" onClick={logout}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </nav>
      <div className="flex flex-1 w-full max-w-7xl mx-auto items-stretch">
        <aside className="w-64 shrink-0 bg-white border-r border-slate-200 py-6 px-4 hidden md:block">
          <div className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider px-3">
            Navigation
          </div>
          <div className="flex flex-col gap-1">
            {NAV.map(n => {
              const isActive = pathname === n.href;
              return (
                <Link key={n.id} href={n.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${isActive ? "bg-emerald-800 text-white shadow-sm" : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"}`}>
                  <n.icon size={18} />
                  {n.label}
                </Link>
              );
            })}
          </div>
          <div className="h-px bg-slate-200 my-6 mx-3" />
          <Link href={`/${lang}/assessment`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 transition-all">
            <Stethoscope size={18} />
            Preview User App
          </Link>
        </aside>
        <main className="flex-1 p-6 md:p-8 min-w-0">{children}</main>
      </div>
    </div>
  );
}
