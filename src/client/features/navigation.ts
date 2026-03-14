// input: static dashboard section metadata defined for the client shell
// output: navigation ids, labels, descriptions, and lookup helpers
// pos: shared navigation registry for client sections
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
export const navigationSections = [
  {
    id: "overview",
    label: "Overview",
    description: "Agent health and status will appear here."
  },
  {
    id: "sessions",
    label: "Sessions",
    description: "Session list and session content will appear here."
  },
  {
    id: "skills",
    label: "Skills",
    description: "Skill management tools will appear here."
  },
  {
    id: "files",
    label: "Files",
    description: "Editable markdown files will appear here."
  }
] as const;

export type NavigationSection = (typeof navigationSections)[number];
export type NavigationSectionId = NavigationSection["id"];

export const defaultNavigationSectionId: NavigationSectionId =
  navigationSections[0].id;

export function getNavigationSection(
  sectionId: NavigationSectionId
): NavigationSection {
  return (
    navigationSections.find((section) => section.id === sectionId) ??
    navigationSections[0]
  );
}
