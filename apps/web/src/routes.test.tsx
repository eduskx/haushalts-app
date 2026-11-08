import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import { t } from "./locales";
import { routes } from "./routes";

function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />);
}

describe("routes", () => {
  it("shows the placeholder page at /", () => {
    renderAt("/");
    expect(screen.getByRole("heading", { name: t("home.title") })).toBeTruthy();
  });

  it("shows an error page for an unknown route", () => {
    renderAt("/does-not-exist");
    expect(screen.getByRole("heading", { name: t("notFound.title") })).toBeTruthy();
  });
});
