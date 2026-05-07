import "server-only";

const dictionaries = {
  en: () => import("./en.json").then((m) => m.default),
  bn: () => import("./bn.json").then((m) => m.default),
};

export type Locale = keyof typeof dictionaries;

export const LOCALES: Locale[] = ["en", "bn"];
export const DEFAULT_LOCALE: Locale = "en";

export const hasLocale = (locale: string): locale is Locale =>
  locale in dictionaries;

export const getDictionary = async (locale: Locale) => dictionaries[locale]();

export type Dictionary = Awaited<ReturnType<typeof getDictionary>> & {
  metadata: {
    title: string;
    description: string;
  };
};
