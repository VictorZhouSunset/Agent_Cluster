import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { App } from "../App";
import { AppShell } from "./AppShell";

describe("App shell", () => {
  it("defaults to Overview in the app", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain("<h2");
    expect(html).toContain(">Overview</h2>");
    expect(html).toContain("Agent health and status will appear here.");
    expect(html).toMatch(/aria-current="page"[^>]*>Overview<\/button>/);
  });

  it("shows another section as active and visible when the selection changes", () => {
    const html = renderToStaticMarkup(
      <AppShell selectedSection="sessions" onSectionSelect={() => undefined} />
    );

    expect(html).toContain(">Sessions</h2>");
    expect(html).toContain("Session list and session content will appear here.");
    expect(html).toMatch(/aria-current="page"[^>]*>Sessions<\/button>/);
  });
});
