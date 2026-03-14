// input: selected navigation state plus the client feature screen components
// output: dashboard section content rendered inside the shared app shell
// pos: root client composition for the Gate dashboard single-page UI
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { useState } from "react";
import { AppShell } from "./layout/AppShell";
import {
  defaultNavigationSectionId,
  type NavigationSectionId
} from "./features/navigation";
import { FilesScreen } from "./features/files/FilesScreen";
import { OverviewScreen } from "./features/overview/OverviewScreen";
import { SessionsScreen } from "./features/sessions/SessionsScreen";
import { SkillsScreen } from "./features/skills/SkillsScreen";

function DashboardSectionContent({
  selectedSection
}: {
  selectedSection: NavigationSectionId;
}) {
  if (selectedSection === "overview") {
    return <OverviewScreen />;
  }

  if (selectedSection === "sessions") {
    return <SessionsScreen />;
  }

  if (selectedSection === "skills") {
    return <SkillsScreen />;
  }

  if (selectedSection === "files") {
    return <FilesScreen />;
  }

  return null;
}

export function App() {
  const [selectedSection, setSelectedSection] =
    useState<NavigationSectionId>(defaultNavigationSectionId);

  return (
    <AppShell
      selectedSection={selectedSection}
      onSectionSelect={setSelectedSection}
    >
      <DashboardSectionContent selectedSection={selectedSection} />
    </AppShell>
  );
}
