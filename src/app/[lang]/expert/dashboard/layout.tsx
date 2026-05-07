"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { isExpertAuthenticated, setExpertAuth } from "@/lib/storage";
import Link from "next/link";
import { Sun, LayoutDashboard, TrendingUp, Users, HelpCircle, Stethoscope, Hospital, Scale, User, LogOut, Loader2 } from "lucide-react";

export default function ExpertLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const lang = (params?.lang as string) ?? "en";
  const [ready, setReady] = useState(false);

  const NAV = [
    { href: `/${lang}/expert/dashboard`, label: "Overview", id: "overview", icon: LayoutDashboard },
    { href: `/${lang}/expert/dashboard/analytics`, label: "Analytics", id: "analytics", icon: TrendingUp },
    { href: `/${lang}/expert/dashboard/users`, label: "Patients", id: "users", icon: Users },
    { href: `/${lang}/expert/dashboard/questions`, label: "Questions", id: "questions", icon: HelpCircle },
    { href: `/${lang}/expert/dashboard/conditions`, label: "Conditions", id: "conditions", icon: Stethoscope },
    { href: `/${lang}/expert/dashboard/clinicians`, label: "Clinicians", id: "clinicians", icon: Hospital },
    { href: `/${lang}/expert/dashboard/thresholds`, label: "Score Thresholds", id: "thresholds", icon: Scale },
  ];

  useEffect(() => {
    if (!isExpertAuthenticated()) router.push(`/${lang}/expert/login`);
    else setReady(true);
  }, [router, lang]);

  const logout = () => { setExpertAuth(false); router.push(`/${lang}`); };

  if (!ready) return (
    <div className="flex items-center justify-center min-h-screen bg-stone-50">
      <Loader2 className="animate-spin text-orange-700" size={48} />
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">


      <div className="flex flex-1 w-full max-w-7xl mx-auto items-stretch">
        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <aside className="w-64 shrink-0 bg-white border-r border-stone-200 py-6 px-4 hidden md:block shadow-sm">
          <div className="text-xs font-bold text-stone-400 mb-4 uppercase tracking-wider px-3">
            Navigation
          </div>
          <div className="flex flex-col gap-1">
            {NAV.map(n => {
              const isActive = pathname === n.href;
              return (
                <Link
                  key={n.id}
                  href={n.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${isActive
                    ? "bg-orange-700 text-white shadow-sm"
                    : "text-stone-600 hover:bg-orange-50 hover:text-orange-700"
                    }`}
                >
                  <n.icon size={18} />
                  {n.label}
                </Link>
              );
            })}
          </div>
          <div className="h-px bg-stone-200 my-6 mx-3" />
          <Link
            href={`/${lang}/assessment`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm text-stone-600 hover:bg-orange-50 hover:text-orange-700 transition-all"
          >
            <Stethoscope size={18} />
            Preview User App
          </Link>
        </aside>

        {/* ── Main content ───────────────────────────────────────────────── */}
        <main className="flex-1 p-6 md:p-8 min-w-0">{children}</main>
      </div>
    </div>
  );
}
