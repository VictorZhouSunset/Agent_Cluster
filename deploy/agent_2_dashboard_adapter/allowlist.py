# input: document ids plus the agent_2 OpenClaw home-directory root on disk
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
    "agents-md": ".openclaw/workspace/AGENTS.md",
    "bootstrap-md": ".openclaw/workspace/BOOTSTRAP.md",
    "heartbeat-md": ".openclaw/workspace/HEARTBEAT.md",
    "identity-md": ".openclaw/workspace/IDENTITY.md",
    "soul-md": ".openclaw/workspace/SOUL.md",
    "tools-md": ".openclaw/workspace/TOOLS.md",
    "user-md": ".openclaw/workspace/USER.md",
}

SKILL_ID_PREFIX = "skill:"
MANAGED_SKILL_SCOPE = "managed"
WORKSPACE_SKILL_SCOPE = "workspace"
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


def _parse_skill_target(document_id: str) -> tuple[str, str]:
    raw_value = (
        document_id[len(SKILL_ID_PREFIX) :]
        if document_id.startswith(SKILL_ID_PREFIX)
        else document_id
    )
    segments = raw_value.split(":")
    has_explicit_scope = len(segments) > 1 and segments[0] != ""
    scope = segments[0] if has_explicit_scope else WORKSPACE_SKILL_SCOPE
    skill_name = ":".join(segments[1:]) if has_explicit_scope else raw_value

    if scope not in {MANAGED_SKILL_SCOPE, WORKSPACE_SKILL_SCOPE}:
        raise AllowlistError(f'Editable skill "{document_id}" is not allowlisted.')

    normalized_name = normalize_skill_name(skill_name)
    return scope, normalized_name


def _skill_display_name(skill_name: str, scope: str) -> str:
    return (
        f"{skill_name} (managed)"
        if scope == MANAGED_SKILL_SCOPE
        else f"{skill_name} (workspace)"
    )


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
            name=os.path.basename(relative_path),
        )

    scope, skill_name = _parse_skill_target(document_id)
    relative_path = (
        f".openclaw/skills/{skill_name}/SKILL.md"
        if scope == MANAGED_SKILL_SCOPE
        else f".openclaw/workspace/skills/{skill_name}/SKILL.md"
    )
    return DocumentTarget(
        document_id=f"{SKILL_ID_PREFIX}{scope}:{skill_name}",
        kind="skill",
        relative_path=relative_path,
        name=_skill_display_name(skill_name, scope),
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
        "path": absolute_path,
        "kind": target.kind,
        "updatedAt": timestamp_from_stat(stat_result),
    }
    if content is not None:
        payload["content"] = content
    return payload


def _iter_local_skill_targets(root_dir: str) -> Iterable[DocumentTarget]:
    targets: List[DocumentTarget] = []
    skill_roots = [
        (MANAGED_SKILL_SCOPE, os.path.join(root_dir, ".openclaw", "skills")),
        (
            WORKSPACE_SKILL_SCOPE,
            os.path.join(root_dir, ".openclaw", "workspace", "skills"),
        ),
    ]
    for scope, skills_dir in skill_roots:
        if not os.path.isdir(skills_dir):
            continue
        for entry in sorted(os.listdir(skills_dir)):
            try:
                target = resolve_document_target("skill", f"{scope}:{entry}")
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
                        name=os.path.basename(relative_path),
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
