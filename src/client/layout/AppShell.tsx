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
          <div className="app-brand__mark" aria-hidden="true">
            <span className="app-brand__pulse" />
          </div>
          <div className="app-brand__copy">
            <p className="app-brand__eyebrow">Cluster Ops</p>
            <h1 className="app-brand__title">Gate Workbench</h1>
          </div>
        </div>
        <nav className="app-nav" aria-label="Dashboard sections" data-ui="app-nav-rail">
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
                {isActive ? (
                  <span className="app-nav__description">{section.description}</span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="app-main">
        <div className="section-frame" data-ui="section-frame">
          <header className="app-toolbar" data-ui="app-toolbar">
            <div className="app-toolbar__copy">
              <p className="section-header__eyebrow">Workspace</p>
              <h2 className="section-header__title">{activeSection.label}</h2>
            </div>
            <p className="app-toolbar__context">{activeSection.description}</p>
          </header>
          {children}
        </div>
      </section>
    </main>
  );
}
