import { Link } from "react-router";
import { t } from "../locales";

export function NotFoundPage() {
  return (
    <main className="p-s4">
      <h1 className="text-text-1 text-(length:--text-title-1)">{t("notFound.title")}</h1>
      <p className="mt-s2 text-text-2">{t("notFound.body")}</p>
      <Link to="/" className="mt-s4 inline-block text-accent underline">
        {t("notFound.back")}
      </Link>
    </main>
  );
}
