# input: environment configuration, local allowlisted files, and remote node HTTP control-plane APIs
# output: dashboard-shaped health, node, agent, and document data for the adapter HTTP layer
# pos: service layer that bridges the dashboard adapter to agent_2 local state and remote cluster nodes
# 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import json
import os
from typing import Any, Dict, List, Mapping, Optional
from urllib import error, parse, request

try:
    from .allowlist import (
        FIXED_DOCUMENT_PATHS,
        list_local_documents,
        read_local_document,
        resolve_document_target,
        write_local_document,
    )
except ImportError:  # pragma: no cover - direct execution fallback
    from allowlist import (
        FIXED_DOCUMENT_PATHS,
        list_local_documents,
        read_local_document,
        resolve_document_target,
        write_local_document,
    )


class AdapterConfigError(RuntimeError):
    pass


class AdapterRequestError(RuntimeError):
    pass


@dataclass(frozen=True)
class RemoteNodeConfig:
    node_id: str
    name: str
    kind: str
    base_url: str


@dataclass(frozen=True)
class AdapterConfig:
    host: str
    port: int
    dashboard_secret: str
    cluster_secret: str
    local_node_id: str
    local_node_name: str
    local_node_kind: str
    root_dir: str
    control_url: str
    remote_nodes: List[RemoteNodeConfig]


def utc_now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z")


def load_remote_nodes(raw_value: Optional[str]) -> List[RemoteNodeConfig]:
    if not raw_value:
        return []

    try:
        payload = json.loads(raw_value)
    except json.JSONDecodeError as exc:
        raise AdapterConfigError(
            "DASHBOARD_ADAPTER_REMOTE_NODES_JSON must be valid JSON."
        ) from exc

    if not isinstance(payload, list):
        raise AdapterConfigError(
            "DASHBOARD_ADAPTER_REMOTE_NODES_JSON must be a JSON array."
        )

    nodes: List[RemoteNodeConfig] = []
    for item in payload:
        if not isinstance(item, dict):
            raise AdapterConfigError("Each remote node entry must be an object.")
        try:
            node_id = str(item["id"])
            name = str(item["name"])
            kind = str(item.get("kind", "other"))
            base_url = str(item["base_url"]).rstrip("/")
        except KeyError as exc:
            raise AdapterConfigError(
                "Each remote node entry needs id, name, and base_url."
            ) from exc

        nodes.append(
            RemoteNodeConfig(
                node_id=node_id,
                name=name,
                kind=kind,
                base_url=base_url,
            )
        )
    return nodes


def load_config(env: Optional[Mapping[str, str]] = None) -> AdapterConfig:
    values = dict(os.environ if env is None else env)
    dashboard_secret = values.get("DASHBOARD_ADAPTER_SECRET") or values.get(
        "AGENT_SHARED_SECRET"
    )
    cluster_secret = (
        values.get("AGENT_SHARED_SECRET")
        or values.get("DASHBOARD_CLUSTER_SECRET")
        or dashboard_secret
    )

    if not dashboard_secret:
        raise AdapterConfigError(
            "DASHBOARD_ADAPTER_SECRET or AGENT_SHARED_SECRET is required."
        )
    if not cluster_secret:
        raise AdapterConfigError(
            "AGENT_SHARED_SECRET or DASHBOARD_CLUSTER_SECRET is required."
        )

    return AdapterConfig(
        host=values.get("DASHBOARD_ADAPTER_HOST", "0.0.0.0"),
        port=int(values.get("DASHBOARD_ADAPTER_PORT", "9011")),
        dashboard_secret=dashboard_secret,
        cluster_secret=cluster_secret,
        local_node_id=values.get("DASHBOARD_ADAPTER_NODE_ID", "openmoose02-md"),
        local_node_name=values.get("DASHBOARD_ADAPTER_NODE_NAME", "OpenMoose02_MD"),
        local_node_kind=values.get("DASHBOARD_ADAPTER_NODE_KIND", "md"),
        root_dir=os.path.abspath(
            values.get("DASHBOARD_ADAPTER_ROOT_DIR", os.getcwd())
        ),
        control_url=values.get(
            "DASHBOARD_ADAPTER_CONTROL_URL", "http://127.0.0.1:9001"
        ),
        remote_nodes=load_remote_nodes(
            values.get("DASHBOARD_ADAPTER_REMOTE_NODES_JSON")
        ),
    )


def _join_url(
    base_url: str, path: str, query: Optional[Mapping[str, str]] = None
) -> str:
    url = f"{base_url.rstrip('/')}/{path.lstrip('/')}"
    if query:
        encoded = parse.urlencode(query)
        if encoded:
            url = f"{url}?{encoded}"
    return url


def _request_json(
    url: str,
    secret: str,
    *,
    method: str = "GET",
    payload: Optional[Mapping[str, Any]] = None,
    header_name: str = "X-Agent-Secret",
) -> Any:
    body = None
    headers = {"Accept": "application/json", header_name: secret}
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = request.Request(url, data=body, method=method, headers=headers)
    try:
        with request.urlopen(req, timeout=10) as response:
            raw_body = response.read().decode("utf-8")
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise AdapterRequestError(f"{exc.code} {exc.reason}: {detail}".strip()) from exc
    except error.URLError as exc:
        raise AdapterRequestError(str(exc.reason)) from exc

    if not raw_body.strip():
        return None
    return json.loads(raw_body)


def _normalize_node_status(health_payload: Mapping[str, Any]) -> str:
    llm_value = health_payload.get("llm")
    if isinstance(llm_value, Mapping) and llm_value.get("status") not in {
        None,
        "healthy",
        "ok",
    }:
        return "degraded"
    return "healthy"


def _agent_status_from_health(health_payload: Mapping[str, Any]) -> str:
    queue_depth = int(health_payload.get("queue", 0) or 0)
    return "running" if queue_depth > 0 else "idle"


def _format_health_summary(node_name: str, health_payload: Mapping[str, Any]) -> str:
    role = str(health_payload.get("role", "unknown"))
    queue_depth = int(health_payload.get("queue", 0) or 0)
    return f"{node_name} role {role}, queue {queue_depth}"


def _remote_supports_documents(
    capabilities_payload: Optional[Mapping[str, Any]]
) -> bool:
    if not isinstance(capabilities_payload, Mapping):
        return False
    fs_cap = capabilities_payload.get("fs")
    return bool(
        isinstance(fs_cap, Mapping) and fs_cap.get("read") and fs_cap.get("write")
    )


class DashboardAdapterService:
    def __init__(self, config: AdapterConfig):
        self.config = config

    def _local_health_payload(self) -> Dict[str, Any]:
        url = _join_url(self.config.control_url, "/health")
        payload = _request_json(url, self.config.cluster_secret)
        if isinstance(payload, Mapping):
            return dict(payload)
        return {
            "agent": self.config.local_node_name,
            "role": self.config.local_node_kind,
            "queue": 0,
        }

    def _fetch_remote_health(self, node: RemoteNodeConfig) -> Dict[str, Any]:
        payload = _request_json(
            _join_url(node.base_url, "/health"),
            self.config.cluster_secret,
        )
        if not isinstance(payload, Mapping):
            raise AdapterRequestError(
                f"Unexpected health payload from {node.node_id}."
            )
        return dict(payload)

    def _fetch_remote_capabilities(
        self, node: RemoteNodeConfig
    ) -> Optional[Dict[str, Any]]:
        try:
            payload = _request_json(
                _join_url(node.base_url, "/capabilities"),
                self.config.cluster_secret,
            )
        except AdapterRequestError:
            return None
        return dict(payload) if isinstance(payload, Mapping) else None

    def list_nodes(self) -> List[Dict[str, Any]]:
        checked_at = utc_now_iso()
        local_health = self._local_health_payload()
        nodes: List[Dict[str, Any]] = [
            {
                "id": self.config.local_node_id,
                "name": self.config.local_node_name,
                "kind": self.config.local_node_kind,
                "origin": "remote",
                "status": _normalize_node_status(local_health),
                "checkedAt": checked_at,
                "summary": _format_health_summary(
                    self.config.local_node_name, local_health
                ),
                "supportsSessions": False,
                "supportsSkills": True,
                "supportsFiles": True,
                "supportsWrites": True,
            }
        ]

        for node in self.config.remote_nodes:
            try:
                health_payload = self._fetch_remote_health(node)
                capabilities_payload = self._fetch_remote_capabilities(node)
                supports_documents = _remote_supports_documents(capabilities_payload)
                nodes.append(
                    {
                        "id": node.node_id,
                        "name": node.name,
                        "kind": node.kind,
                        "origin": "remote",
                        "status": _normalize_node_status(health_payload),
                        "checkedAt": checked_at,
                        "summary": _format_health_summary(node.name, health_payload),
                        "supportsSessions": False,
                        "supportsSkills": supports_documents,
                        "supportsFiles": supports_documents,
                        "supportsWrites": supports_documents,
                    }
                )
            except AdapterRequestError as exc:
                nodes.append(
                    {
                        "id": node.node_id,
                        "name": node.name,
                        "kind": node.kind,
                        "origin": "remote",
                        "status": "offline",
                        "checkedAt": checked_at,
                        "summary": f"{node.name} unreachable: {exc}",
                        "supportsSessions": False,
                        "supportsSkills": False,
                        "supportsFiles": False,
                        "supportsWrites": False,
                    }
                )

        return nodes

    def get_health_summary(self) -> Dict[str, Any]:
        nodes = self.list_nodes()
        healthy_nodes = sum(1 for node in nodes if node["status"] == "healthy")
        degraded_nodes = sum(1 for node in nodes if node["status"] == "degraded")
        offline_nodes = sum(1 for node in nodes if node["status"] == "offline")

        status = "healthy"
        if offline_nodes or degraded_nodes:
            status = "degraded"

        summary = f"{healthy_nodes}/{len(nodes)} nodes healthy"
        if offline_nodes:
            summary += f", {offline_nodes} offline"
        elif degraded_nodes:
            summary += f", {degraded_nodes} degraded"

        return {
            "status": status,
            "checkedAt": utc_now_iso(),
            "summary": summary,
            "nodeCount": len(nodes),
        }

    def list_agents(self) -> List[Dict[str, Any]]:
        checked_at = utc_now_iso()
        local_health = self._local_health_payload()
        agents: List[Dict[str, Any]] = [
            {
                "id": f"{self.config.local_node_id}:agent",
                "name": str(local_health.get("agent", self.config.local_node_name)),
                "status": _agent_status_from_health(local_health),
                "summary": _format_health_summary(
                    self.config.local_node_name, local_health
                ),
                "updatedAt": checked_at,
                "nodeId": self.config.local_node_id,
                "nodeName": self.config.local_node_name,
            }
        ]

        for node in self.config.remote_nodes:
            try:
                health_payload = self._fetch_remote_health(node)
                agents.append(
                    {
                        "id": f"{node.node_id}:agent",
                        "name": str(health_payload.get("agent", node.name)),
                        "status": _agent_status_from_health(health_payload),
                        "summary": _format_health_summary(node.name, health_payload),
                        "updatedAt": checked_at,
                        "nodeId": node.node_id,
                        "nodeName": node.name,
                    }
                )
            except AdapterRequestError as exc:
                agents.append(
                    {
                        "id": f"{node.node_id}:agent",
                        "name": node.name,
                        "status": "offline",
                        "summary": f"{node.name} unreachable: {exc}",
                        "updatedAt": checked_at,
                        "nodeId": node.node_id,
                        "nodeName": node.name,
                    }
                )
        return agents

    def _resolve_node(self, node_id: Optional[str]) -> Optional[RemoteNodeConfig]:
        if not node_id or node_id == self.config.local_node_id:
            return None

        for node in self.config.remote_nodes:
            if node.node_id == node_id:
                return node
        raise AdapterRequestError(f'Unknown node "{node_id}".')

    def _remote_list_documents(
        self, node: RemoteNodeConfig, kind: str
    ) -> List[Dict[str, Any]]:
        if kind == "file":
            documents: List[Dict[str, Any]] = []
            for document_id, relative_path in FIXED_DOCUMENT_PATHS.items():
                try:
                    _request_json(
                        _join_url(node.base_url, "/fs/read", {"path": relative_path}),
                        self.config.cluster_secret,
                    )
                except AdapterRequestError:
                    continue
                documents.append(
                    {
                        "id": document_id,
                        "name": relative_path,
                        "path": relative_path,
                        "kind": "file",
                        "updatedAt": utc_now_iso(),
                    }
                )
            return documents

        payload = _request_json(
            _join_url(node.base_url, "/fs/find", {"pattern": "SKILL.md"}),
            self.config.cluster_secret,
        )
        matches = payload.get("matches", []) if isinstance(payload, Mapping) else []
        documents: List[Dict[str, Any]] = []
        for match in sorted(matches):
            if not isinstance(match, str):
                continue
            parts = match.split("/")
            if len(parts) != 3 or parts[0] != "skills" or parts[2] != "SKILL.md":
                continue
            target = resolve_document_target("skill", parts[1])
            documents.append(
                {
                    "id": target.document_id,
                    "name": target.name,
                    "path": target.relative_path,
                    "kind": "skill",
                    "updatedAt": utc_now_iso(),
                }
            )
        return documents

    def _remote_read_document(
        self, node: RemoteNodeConfig, kind: str, document_id: str
    ) -> Dict[str, Any]:
        target = resolve_document_target(kind, document_id)
        payload = _request_json(
            _join_url(node.base_url, "/fs/read", {"path": target.relative_path}),
            self.config.cluster_secret,
        )
        if not isinstance(payload, Mapping):
            raise AdapterRequestError(f"Unexpected read payload from {node.node_id}.")
        content = str(payload.get("content", ""))
        return {
            "id": target.document_id,
            "name": target.name,
            "path": target.relative_path,
            "kind": target.kind,
            "updatedAt": utc_now_iso(),
            "content": content,
        }

    def _remote_write_document(
        self, node: RemoteNodeConfig, kind: str, document_id: str, content: str
    ) -> Dict[str, Any]:
        target = resolve_document_target(kind, document_id)
        _request_json(
            _join_url(node.base_url, "/fs/write"),
            self.config.cluster_secret,
            method="POST",
            payload={"path": target.relative_path, "content": content},
        )
        return self._remote_read_document(node, kind, document_id)

    def list_documents(self, kind: str, node_id: Optional[str]) -> List[Dict[str, Any]]:
        remote_node = self._resolve_node(node_id)
        if remote_node is None:
            return list_local_documents(self.config.root_dir, kind)
        return self._remote_list_documents(remote_node, kind)

    def read_document(
        self, kind: str, document_id: str, node_id: Optional[str]
    ) -> Dict[str, Any]:
        remote_node = self._resolve_node(node_id)
        if remote_node is None:
            return read_local_document(self.config.root_dir, kind, document_id)
        return self._remote_read_document(remote_node, kind, document_id)

    def write_document(
        self, kind: str, document_id: str, node_id: Optional[str], content: str
    ) -> Dict[str, Any]:
        remote_node = self._resolve_node(node_id)
        if remote_node is None:
            return write_local_document(
                self.config.root_dir, kind, document_id, content
            )
        return self._remote_write_document(remote_node, kind, document_id, content)
