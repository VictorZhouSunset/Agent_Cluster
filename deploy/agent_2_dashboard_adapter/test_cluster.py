# input: in-memory config and stubbed service methods for local and remote node interactions
# output: unit assertions for adapter config parsing and service-level document routing
# pos: service helper tests for the deployable agent_2 dashboard adapter package
# 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
from __future__ import annotations

import os
import tempfile
import unittest
from unittest.mock import patch

try:
    from .cluster import (
        AdapterConfig,
        AdapterRequestError,
        DashboardAdapterService,
        RemoteNodeConfig,
        load_config,
    )
except ImportError:  # pragma: no cover - direct execution fallback
    from cluster import (
        AdapterConfig,
        AdapterRequestError,
        DashboardAdapterService,
        RemoteNodeConfig,
        load_config,
    )


class ClusterConfigTests(unittest.TestCase):
    def test_load_config_parses_remote_nodes_json(self) -> None:
        config = load_config(
            {
                "DASHBOARD_ADAPTER_SECRET": "dash-secret",
                "AGENT_SHARED_SECRET": "cluster-secret",
                "DASHBOARD_ADAPTER_REMOTE_NODES_JSON": '[{"id":"openmoose01-cso","name":"OpenMoose01_CSO","kind":"other","base_url":"http://10.0.0.3:9001"}]',
            }
        )

        self.assertEqual(config.dashboard_secret, "dash-secret")
        self.assertEqual(config.cluster_secret, "cluster-secret")
        self.assertEqual(config.local_node_id, "openmoose02-md")
        self.assertEqual(config.local_node_name, "OpenMoose02_MD")
        self.assertEqual(config.remote_nodes[0].node_id, "openmoose01-cso")


class DashboardAdapterServiceTests(unittest.TestCase):
    def _create_service(self, root_dir: str) -> DashboardAdapterService:
        config = AdapterConfig(
            host="0.0.0.0",
            port=9011,
            dashboard_secret="dash-secret",
            cluster_secret="cluster-secret",
            local_node_id="openmoose02-md",
            local_node_name="OpenMoose02_MD",
            local_node_kind="md",
            root_dir=root_dir,
            control_url="http://127.0.0.1:9001",
            remote_nodes=[
                RemoteNodeConfig(
                    node_id="openmoose01-cso",
                    name="OpenMoose01_CSO",
                    kind="other",
                    base_url="http://10.0.0.3:9001",
                )
            ],
        )
        return DashboardAdapterService(config)

    def test_list_nodes_marks_unreachable_remote_nodes_offline(self) -> None:
        with tempfile.TemporaryDirectory() as root_dir:
            os.makedirs(os.path.join(root_dir, ".openclaw", "workspace"), exist_ok=True)
            with open(
                os.path.join(root_dir, ".openclaw", "workspace", "AGENTS.md"),
                "w",
                encoding="utf-8",
            ) as handle:
                handle.write("# Agents")

            service = self._create_service(root_dir)

            with patch.object(
                DashboardAdapterService,
                "_local_health_payload",
                return_value={"agent": "OpenMoose02_MD", "role": "md", "queue": 0},
            ), patch.object(
                DashboardAdapterService,
                "_fetch_remote_health",
                side_effect=AdapterRequestError("remote down"),
            ):
                nodes = service.list_nodes()

            self.assertEqual(nodes[0]["id"], "openmoose02-md")
            self.assertEqual(nodes[1]["status"], "offline")

    def test_list_nodes_marks_timed_out_remote_nodes_offline(self) -> None:
        with tempfile.TemporaryDirectory() as root_dir:
            os.makedirs(os.path.join(root_dir, ".openclaw", "workspace"), exist_ok=True)
            with open(
                os.path.join(root_dir, ".openclaw", "workspace", "AGENTS.md"),
                "w",
                encoding="utf-8",
            ) as handle:
                handle.write("# Agents")

            service = self._create_service(root_dir)

            with patch.object(
                DashboardAdapterService,
                "_local_health_payload",
                return_value={"agent": "OpenMoose02_MD", "role": "md", "queue": 0},
            ), patch.object(
                DashboardAdapterService,
                "_fetch_remote_health",
                side_effect=AdapterRequestError("timed out"),
            ):
                nodes = service.list_nodes()
                health = service.get_health_summary()

            self.assertEqual(nodes[1]["status"], "offline")
            self.assertIn("offline", health["summary"])

    def test_remote_document_calls_use_remote_passthrough_helpers(self) -> None:
        with tempfile.TemporaryDirectory() as root_dir:
            os.makedirs(os.path.join(root_dir, ".openclaw", "workspace"), exist_ok=True)
            with open(
                os.path.join(root_dir, ".openclaw", "workspace", "AGENTS.md"),
                "w",
                encoding="utf-8",
            ) as handle:
                handle.write("# Agents")

            service = self._create_service(root_dir)

            with patch.object(
                DashboardAdapterService,
                "_remote_list_documents",
                return_value=[{"id": "agents-md", "kind": "file"}],
            ) as list_mock:
                result = service.list_documents("file", "openmoose01-cso")

            self.assertEqual(result, [{"id": "agents-md", "kind": "file"}])
            list_mock.assert_called_once()

    def test_local_skill_listing_can_include_bundled_ready_skills(self) -> None:
        with tempfile.TemporaryDirectory() as root_dir:
            os.makedirs(
                os.path.join(root_dir, ".openclaw", "workspace", "skills", "planner"),
                exist_ok=True,
            )
            with open(
                os.path.join(root_dir, ".openclaw", "workspace", "skills", "planner", "SKILL.md"),
                "w",
                encoding="utf-8",
            ) as handle:
                handle.write("# Planner")

            service = self._create_service(root_dir)

            with patch.object(
                service,
                "_list_ready_bundled_skills",
                return_value=[
                    {
                        "id": "skill:bundled:healthcheck",
                        "name": "healthcheck",
                        "kind": "skill",
                        "source": "bundled",
                        "editable": False,
                    }
                ],
            ):
                documents = service.list_documents("skill", None)

            self.assertTrue(
                any(item["id"] == "skill:bundled:healthcheck" for item in documents)
            )
            self.assertTrue(
                any(item["id"] == "skill:workspace:planner" for item in documents)
            )


if __name__ == "__main__":
    unittest.main()
