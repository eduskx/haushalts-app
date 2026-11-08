import { t } from "../locales";

export function HomePage() {
  return (
    <main className="p-s4">
      <h1 className="font-(family-name:--font-display) text-text-1 text-(length:--text-large-title)">
        {t("home.title")}
      </h1>
      <p className="mt-s2 text-text-2">{t("home.intro")}</p>
    </main>
  );
}
