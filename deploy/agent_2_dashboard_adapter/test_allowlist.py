# input: temporary filesystem fixtures that simulate allowlisted markdown and skill files
# output: unit assertions for local allowlist resolution, listing, reading, and writing helpers
# pos: local helper tests for the deployable agent_2 dashboard adapter package
# 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
from __future__ import annotations

import os
import tempfile
import unittest

try:
    from .allowlist import (
        AllowlistError,
        list_local_documents,
        read_local_document,
        resolve_document_target,
        write_local_document,
    )
except ImportError:  # pragma: no cover - direct execution fallback
    from allowlist import (
        AllowlistError,
        list_local_documents,
        read_local_document,
        resolve_document_target,
        write_local_document,
    )


class AllowlistTests(unittest.TestCase):
    def test_resolve_document_target_rejects_unknown_ids(self) -> None:
        with self.assertRaises(AllowlistError):
            resolve_document_target("file", "unknown-id")

        with self.assertRaises(AllowlistError):
            resolve_document_target("skill", "bad name")

    def test_list_read_and_write_local_documents(self) -> None:
        with tempfile.TemporaryDirectory() as root_dir:
            workspace_dir = os.path.join(root_dir, ".openclaw", "workspace")
            workspace_skills_dir = os.path.join(workspace_dir, "skills")
            managed_skills_dir = os.path.join(root_dir, ".openclaw", "skills")
            os.makedirs(os.path.join(workspace_skills_dir, "planner"))
            os.makedirs(os.path.join(managed_skills_dir, "reviewer"))
            with open(
                os.path.join(workspace_dir, "AGENTS.md"), "w", encoding="utf-8"
            ) as handle:
                handle.write("# Agents")
            with open(
                os.path.join(workspace_skills_dir, "planner", "SKILL.md"),
                "w",
                encoding="utf-8",
            ) as handle:
                handle.write("# Planner")
            with open(
                os.path.join(managed_skills_dir, "reviewer", "SKILL.md"),
                "w",
                encoding="utf-8",
            ) as handle:
                handle.write("# Reviewer")

            listed_files = list_local_documents(root_dir, "file")
            listed_skills = list_local_documents(root_dir, "skill")

            self.assertEqual([item["id"] for item in listed_files], ["agents-md"])
            self.assertEqual(
                [item["id"] for item in listed_skills],
                ["skill:managed:reviewer", "skill:workspace:planner"],
            )

            read_skill = read_local_document(root_dir, "skill", "planner")
            self.assertEqual(read_skill["content"], "# Planner")

            written_file = write_local_document(
                root_dir, "file", "agents-md", "# Updated Agents"
            )
            self.assertEqual(written_file["content"], "# Updated Agents")
            self.assertEqual(
                os.path.normpath(written_file["path"]),
                os.path.normpath(
                    os.path.join(root_dir, ".openclaw", "workspace", "AGENTS.md")
                ),
            )


if __name__ == "__main__":
    unittest.main()
