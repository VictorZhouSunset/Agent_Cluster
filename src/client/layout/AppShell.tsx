// input: selected section state, section change callback, and active section content
// output: sidebar-based dashboard shell with the active section rendered in the main panel
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
    <main
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        minHeight: "100vh",
        fontFamily: "sans-serif"
      }}
    >
      <aside
        aria-label="Primary"
        style={{
          borderRight: "1px solid #d1d5db",
          padding: "1.5rem 1rem",
          backgroundColor: "#f8fafc"
        }}
      >
        <h1 style={{ marginTop: 0 }}>Gate Dashboard</h1>
        <nav
          aria-label="Dashboard sections"
          style={{ display: "grid", gap: "0.75rem" }}
        >
          {navigationSections.map((section) => {
            const isActive = section.id === selectedSection;

            return (
              <button
                key={section.id}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => onSectionSelect(section.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #cbd5e1",
                  backgroundColor: isActive ? "#0f172a" : "#ffffff",
                  color: isActive ? "#ffffff" : "#0f172a",
                  cursor: "pointer"
                }}
              >
                {section.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <section style={{ padding: "2rem" }}>
        <header>
          <p
            style={{
              marginBottom: "0.5rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#475569"
            }}
          >
            Dashboard section
          </p>
          <h2 style={{ marginTop: 0 }}>{activeSection.label}</h2>
        </header>
        <p>{activeSection.description}</p>
        {children}
      </section>
    </main>
  );
}
