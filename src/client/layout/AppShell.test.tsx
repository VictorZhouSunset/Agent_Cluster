import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { App } from "../App";
import { AppShell } from "./AppShell";

describe("App shell", () => {
  it("defaults to Overview in the app", () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('data-ui="app-shell"');
    expect(html).toContain('data-ui="app-sidebar"');
    expect(html).toContain('data-ui="app-nav-rail"');
    expect(html).toContain('data-ui="app-toolbar"');
    expect(html).toContain('data-ui="app-brand-copy"');
    expect(html).toContain('data-ui="app-toolbar-copy"');
    expect(html).toContain('data-ui="section-frame"');
    expect(html).toContain(">Overview<");
    expect(html).toContain(">Swiss-grade Grotesque UI for cluster operations.<");
    expect(html).toContain('aria-current="page"');
  });

  it("shows another section as active and visible when the selection changes", () => {
    const html = renderToStaticMarkup(
      <AppShell selectedSection="sessions" onSectionSelect={() => undefined} />
    );

    expect(html).toContain('data-ui="section-frame"');
    expect(html).toContain('data-ui="app-toolbar"');
    expect(html).toContain('data-ui="app-toolbar-copy"');
    expect(html).toContain(">Sessions<");
    expect(html).toContain(">Calm navigation, sharper hierarchy, and cleaner contrast.<");
    expect(html).toContain('aria-current="page"');
  });
});
