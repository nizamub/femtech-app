import { getDictionary, hasLocale, type Locale } from "@/dictionaries";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { Sparkles, Stethoscope, Activity, ShieldCheck, Mail, Globe, Smartphone, MapPin, ArrowRight, HeartPulse, CheckCircle2 } from "lucide-react";

export default async function LangHomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang as Locale);
  const session = await auth();
  const user = session?.user;
  const role = (user as any)?.role;

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-emerald-50/50 to-transparent pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 -left-40 w-[500px] h-[500px] bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />

      <main className="relative max-w-7xl mx-auto px-6 pt-24 pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Copy & CTAs */}
          <div className="flex flex-col items-start animate-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/50 border border-emerald-200 text-emerald-800 text-sm font-bold mb-8">
              <Sparkles size={16} className="text-emerald-600" />
              <span>Next-Gen Clinical Wellness</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Understand Your <br />
              <span className="bg-gradient-to-r from-emerald-800 to-teal-600 bg-clip-text text-transparent">Inner Health.</span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-10 max-w-lg leading-relaxed font-medium">
              {dict.common.tagline} Discover clinical-grade insights, track your metrics securely, and take control of your well-being.
            </p>

            <div className="flex flex-wrap gap-4 w-full sm:w-auto">
              {user ? (
                <>
                  <Link href={`/${lang}/assessment`} className="group flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-full transition-all shadow-lg hover:shadow-emerald-900/20 hover:-translate-y-0.5 w-full sm:w-auto text-lg">
                    <Stethoscope size={20} />
                    {dict.assessment.start}
                    <ArrowRight size={20} className="ml-1 opacity-70 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href={role === "expert" || role === "admin" ? `/${lang}/expert/dashboard` : `/${lang}/dashboard`}
                    className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-emerald-200 text-slate-700 font-bold py-4 px-8 rounded-full transition-all shadow-sm w-full sm:w-auto text-lg"
                  >
                    <Activity size={20} className="text-emerald-600" />
                    {dict.nav.dashboard}
                  </Link>
                </>
              ) : (
                <>
                  <Link href={`/${lang}/auth/register`} className="group flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-full transition-all shadow-lg hover:shadow-emerald-900/20 hover:-translate-y-0.5 w-full sm:w-auto text-lg">
                    Get Started
                    <ArrowRight size={20} className="ml-1 opacity-70 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link href={`/${lang}/auth/login`} className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-emerald-200 text-slate-700 font-bold py-4 px-8 rounded-full transition-all shadow-sm w-full sm:w-auto text-lg">
                    {dict.nav.login}
                  </Link>
                </>
              )}
            </div>

            <div className="mt-12 flex items-center gap-6 text-sm font-semibold text-slate-500">
              <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-600" /> End-to-end Encrypted</div>
              <div className="flex items-center gap-2"><Stethoscope size={18} className="text-emerald-600" /> Clinically Validated</div>
            </div>
          </div>

          {/* Right: Visual/App Preview */}
          <div className="relative animate-up" style={{ animationDelay: "0.2s" }}>
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-slate-100 rounded-[3rem] rotate-3 scale-105 opacity-50 transition-transform hover:rotate-6 duration-700"></div>
            <div className="relative bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl rounded-[2.5rem] p-8">
              {/* Mock App UI */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <Activity size={24} className="text-emerald-800" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Overall Health</div>
                    <div className="text-2xl font-extrabold text-slate-900 leading-none">Optimal</div>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" style={{ animationDuration: "3s" }}></div>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Cardiovascular", val: "92%", color: "text-emerald-700", bg: "bg-emerald-50", icon: HeartPulse },
                  { label: "Mental Clarity", val: "88%", color: "text-teal-700", bg: "bg-teal-50", icon: Sparkles },
                  { label: "Immunity", val: "Strong", color: "text-slate-700", bg: "bg-slate-100", icon: ShieldCheck },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 transition-colors cursor-default">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.bg}`}>
                        <item.icon size={18} className={item.color} />
                      </div>
                      <span className="font-bold text-slate-700">{item.label}</span>
                    </div>
                    <span className="font-extrabold text-slate-900">{item.val}</span>
                  </div>
                ))}
              </div>

              {/* Floating Widget */}
              <div className="absolute -bottom-6 -left-8 bg-white border border-slate-100 shadow-xl rounded-2xl p-4 flex items-center gap-4 animate-bounce" style={{ animationDuration: "4s" }}>
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Assessment</div>
                  <div className="text-sm font-bold text-slate-900">Completed today</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-32 grid md:grid-cols-3 gap-8">
          {[
            { title: "Clinical Grade", desc: "Algorithms and thresholds designed by leading medical specialists.", icon: Stethoscope },
            { title: "Bilingual First", desc: "Seamless experience in both English and Bengali.", icon: Globe },
            { title: "Complete Privacy", desc: "Your health data is yours. Strict OTP and session security.", icon: ShieldCheck },
          ].map((f, i) => (
            <div key={i} className="bg-white/60 backdrop-blur-md border border-slate-200 p-8 rounded-3xl hover:shadow-lg hover:border-emerald-200 transition-all group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-emerald-100">
                <f.icon size={28} className="text-emerald-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
              <p className="text-slate-600 font-medium leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
