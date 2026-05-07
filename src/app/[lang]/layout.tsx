import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale, type Locale } from "@/dictionaries";
import { auth } from "@/auth";
import { LangNavbar } from "@/components/LangNavbar";

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "bn" }];
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};

  const dict = await getDictionary(lang as Locale);

  return {
    title: dict.metadata.title,
    description: dict.metadata.description,
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const dict = await getDictionary(lang as Locale);
  const session = await auth();

  // NOTE: Do NOT render <html> or <body> here — that's in the root layout.tsx
  // This layout wraps the lang-specific content only.
  return (
    <>
      <LangNavbar dict={dict} lang={lang as Locale} session={session} />
      <main>{children}</main>
    </>
  );
}
