# input: document ids plus the agent_2 project root directory on disk
# output: validated allowlisted document metadata and local file read/write helpers
# pos: filesystem guardrail layer for editable markdown files and skills
# 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import os
import re
from typing import Dict, Iterable, List

FIXED_DOCUMENT_PATHS: Dict[str, str] = {
    "agents-md": "AGENTS.md",
    "soul-md": "SOUL.md",
    "tools-md": "TOOLS.md",
    "user-md": "USER.md",
}

SKILL_ID_PREFIX = "skill:"
SKILL_NAME_PATTERN = re.compile(r"^(?!\.{1,2}$)[A-Za-z0-9._-]+$")


class AllowlistError(ValueError):
    pass


@dataclass(frozen=True)
class DocumentTarget:
    document_id: str
    kind: str
    relative_path: str
    name: str


def normalize_kind(kind: str) -> str:
    if kind not in {"file", "skill"}:
        raise AllowlistError(f'Unsupported document kind "{kind}".')
    return kind


def normalize_skill_name(document_id: str) -> str:
    candidate = (
        document_id[len(SKILL_ID_PREFIX) :]
        if document_id.startswith(SKILL_ID_PREFIX)
        else document_id
    )
    if not SKILL_NAME_PATTERN.fullmatch(candidate or ""):
        raise AllowlistError(f'Editable skill "{document_id}" is not allowlisted.')
    return candidate


def resolve_document_target(kind: str, document_id: str) -> DocumentTarget:
    normalized_kind = normalize_kind(kind)

    if normalized_kind == "file":
        relative_path = FIXED_DOCUMENT_PATHS.get(document_id)
        if relative_path is None:
            raise AllowlistError(f'Editable file "{document_id}" is not allowlisted.')
        return DocumentTarget(
            document_id=document_id,
            kind="file",
            relative_path=relative_path,
            name=relative_path,
        )

    skill_name = normalize_skill_name(document_id)
    return DocumentTarget(
        document_id=f"{SKILL_ID_PREFIX}{skill_name}",
        kind="skill",
        relative_path=f"skills/{skill_name}/SKILL.md",
        name=skill_name,
    )


def timestamp_from_stat(stat_result: os.stat_result) -> str:
    return (
        datetime.fromtimestamp(stat_result.st_mtime, tz=timezone.utc)
        .isoformat()
        .replace("+00:00", "Z")
    )


def build_document_payload(
    root_dir: str, target: DocumentTarget, content: str | None = None
) -> Dict[str, str]:
    absolute_path = os.path.join(root_dir, target.relative_path)
    stat_result = os.stat(absolute_path)
    payload = {
        "id": target.document_id,
        "name": target.name,
        "path": target.relative_path,
        "kind": target.kind,
        "updatedAt": timestamp_from_stat(stat_result),
    }
    if content is not None:
        payload["content"] = content
    return payload


def _iter_local_skill_targets(root_dir: str) -> Iterable[DocumentTarget]:
    skills_dir = os.path.join(root_dir, "skills")
    if not os.path.isdir(skills_dir):
        return []

    targets: List[DocumentTarget] = []
    for entry in sorted(os.listdir(skills_dir)):
        try:
            target = resolve_document_target("skill", entry)
        except AllowlistError:
            continue
        absolute_path = os.path.join(root_dir, target.relative_path)
        if os.path.isfile(absolute_path):
            targets.append(target)
    return targets


def list_local_documents(root_dir: str, kind: str) -> List[Dict[str, str]]:
    normalized_kind = normalize_kind(kind)
    targets: List[DocumentTarget] = []

    if normalized_kind == "file":
        for document_id, relative_path in FIXED_DOCUMENT_PATHS.items():
            absolute_path = os.path.join(root_dir, relative_path)
            if os.path.isfile(absolute_path):
                targets.append(
                    DocumentTarget(
                        document_id=document_id,
                        kind="file",
                        relative_path=relative_path,
                        name=relative_path,
                    )
                )
    else:
        targets.extend(_iter_local_skill_targets(root_dir))

    return [build_document_payload(root_dir, target) for target in targets]


def read_local_document(root_dir: str, kind: str, document_id: str) -> Dict[str, str]:
    target = resolve_document_target(kind, document_id)
    absolute_path = os.path.join(root_dir, target.relative_path)
    with open(absolute_path, "r", encoding="utf-8") as handle:
        content = handle.read()
    return build_document_payload(root_dir, target, content=content)


def write_local_document(
    root_dir: str, kind: str, document_id: str, content: str
) -> Dict[str, str]:
    target = resolve_document_target(kind, document_id)
    absolute_path = os.path.join(root_dir, target.relative_path)
    os.makedirs(os.path.dirname(absolute_path), exist_ok=True)
    with open(absolute_path, "w", encoding="utf-8") as handle:
        handle.write(content)
    return read_local_document(root_dir, kind, document_id)
