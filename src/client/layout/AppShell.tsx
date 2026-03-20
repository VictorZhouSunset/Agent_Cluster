// input: selected dashboard section plus the active screen content
// output: Gemini-inspired operations shell with section-aware navigation and a framed content area
// pos: top-level client layout wrapper for all dashboard screens
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import {
  getNavigationSection,
  navigationSections,
  type NavigationSectionId
} from "../features/navigation";
import type { ReactNode } from "react";

type AppShellProps = {
  selectedSection: NavigationSectionId;
  onSectionSelect: (sectionId: NavigationSectionId) => void;
  children?: ReactNode;
};

export function AppShell({
  selectedSection,
  onSectionSelect,
  children
}: AppShellProps) {
  const activeSection = getNavigationSection(selectedSection);

  return (
    <main className="app-shell" data-ui="app-shell">
      <aside className="app-sidebar" aria-label="Primary" data-ui="app-sidebar">
        <div className="app-brand">
          <p className="app-brand__eyebrow">Gate Cluster</p>
          <h1 className="app-brand__title">Operations Dashboard</h1>
          <p className="app-brand__description">
            Internal visibility into node health, sessions, skills, and allowlisted workspace files.
          </p>
        </div>
        <nav className="app-nav" aria-label="Dashboard sections">
          {navigationSections.map((section) => {
            const isActive = section.id === selectedSection;

            return (
              <button
                key={section.id}
                className="app-nav__button"
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => onSectionSelect(section.id)}
              >
                <span className="app-nav__label">{section.label}</span>
                <span className="app-nav__description">{section.description}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="app-main">
        <div className="section-frame" data-ui="section-frame">
          <header className="section-header">
            <p className="section-header__eyebrow">Dashboard Section</p>
            <h2 className="section-header__title">{activeSection.label}</h2>
            <p className="section-header__description">{activeSection.description}</p>
          </header>
          {children}
        </div>
      </section>
    </main>
  );
}
