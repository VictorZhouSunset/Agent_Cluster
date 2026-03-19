# input: authenticated dashboard HTTP requests plus the adapter service configuration
# output: JSON responses for health, node summaries, agent cards, and document reads and writes
# pos: HTTP server entrypoint for the deployable agent_2 dashboard adapter
# 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
from __future__ import annotations

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from typing import Any, Dict, Tuple
from urllib import parse

try:
    from .allowlist import AllowlistError, normalize_kind
    from .cluster import (
        AdapterConfigError,
        AdapterRequestError,
        DashboardAdapterService,
        load_config,
    )
except ImportError:  # pragma: no cover - direct execution fallback
    from allowlist import AllowlistError, normalize_kind
    from cluster import (
        AdapterConfigError,
        AdapterRequestError,
        DashboardAdapterService,
        load_config,
    )


def json_bytes(payload: Any) -> bytes:
    return json.dumps(payload, ensure_ascii=True).encode("utf-8")


class DashboardAdapterHandler(BaseHTTPRequestHandler):
    server_version = "Agent2DashboardAdapter/0.1"

    @property
    def config(self):
        return self.server.adapter_config

    @property
    def service(self):
        return self.server.adapter_service

    def do_GET(self) -> None:
        self._handle_request("GET")

    def do_PUT(self) -> None:
        self._handle_request("PUT")

    def log_message(self, format: str, *args: object) -> None:
        return

    def _handle_request(self, method: str) -> None:
        try:
            if not self._is_authorized():
                self._send_json(
                    401,
                    {
                        "error": {
                            "code": "unauthorized",
                            "message": "Invalid dashboard secret.",
                        }
                    },
                )
                return

            path, query = self._parse_path()

            if method == "GET" and path in {"/health", "/dashboard/health"}:
                self._send_json(200, {"data": self.service.get_health_summary()})
                return

            if method == "GET" and path == "/dashboard/nodes":
                self._send_json(200, {"data": self.service.list_nodes()})
                return

            if method == "GET" and path == "/dashboard/agents":
                self._send_json(200, {"data": self.service.list_agents()})
                return

            if path.startswith("/dashboard/documents/"):
                self._handle_document_route(method, path, query)
                return

            self._send_json(
                404,
                {"error": {"code": "not_found", "message": "Route not found."}},
            )
        except AllowlistError as exc:
            self._send_json(
                404,
                {"error": {"code": "not_found", "message": str(exc)}},
            )
        except AdapterRequestError as exc:
            self._send_json(
                502,
                {
                    "error": {
                        "code": "upstream_unavailable",
                        "message": str(exc),
                    }
                },
            )
        except (AdapterConfigError, ValueError) as exc:
            self._send_json(
                400,
                {"error": {"code": "invalid_request", "message": str(exc)}},
            )
        except FileNotFoundError as exc:
            self._send_json(
                404,
                {"error": {"code": "not_found", "message": str(exc)}},
            )
        except Exception as exc:  # pragma: no cover - defensive fallback
            self._send_json(
                500,
                {"error": {"code": "internal_error", "message": str(exc)}},
            )

    def _handle_document_route(
        self, method: str, path: str, query: Dict[str, str]
    ) -> None:
        relative = path[len("/dashboard/documents/") :]
        segments = [segment for segment in relative.split("/") if segment]
        if not segments:
            raise ValueError("Document kind is required.")

        kind = normalize_kind(segments[0])
        node_id = query.get("node")

        if len(segments) == 1:
            if method != "GET":
                raise ValueError(
                    f"Method {method} is not allowed for document collections."
                )
            self._send_json(
                200, {"data": self.service.list_documents(kind, node_id)}
            )
            return

        document_id = parse.unquote(segments[1])
        if method == "GET":
            self._send_json(
                200,
                {"data": self.service.read_document(kind, document_id, node_id)},
            )
            return

        if method == "PUT":
            body = self._read_json_body()
            content = body.get("content")
            if not isinstance(content, str):
                raise ValueError(
                    'Expected JSON body with a string "content" field.'
                )
            self._send_json(
                200,
                {
                    "data": self.service.write_document(
                        kind, document_id, node_id, content
                    )
                },
            )
            return

        raise ValueError(
            f"Method {method} is not allowed for document detail routes."
        )

    def _is_authorized(self) -> bool:
        return (
            self.headers.get("X-Dashboard-Secret", "")
            == self.config.dashboard_secret
        )

    def _parse_path(self) -> Tuple[str, Dict[str, str]]:
        parsed = parse.urlparse(self.path)
        query = {
            key: values[-1]
            for key, values in parse.parse_qs(
                parsed.query, keep_blank_values=True
            ).items()
        }
        return parsed.path, query

    def _read_json_body(self) -> Dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length <= 0:
            return {}
        raw = self.rfile.read(content_length)
        if not raw:
            return {}
        return json.loads(raw.decode("utf-8"))

    def _send_json(self, status_code: int, payload: Any) -> None:
        body = json_bytes(payload)
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


class DashboardAdapterHttpServer(ThreadingHTTPServer):
    def __init__(
        self,
        address: Tuple[str, int],
        handler_type,
        service: DashboardAdapterService,
        config,
    ):
        super().__init__(address, handler_type)
        self.adapter_service = service
        self.adapter_config = config


def create_server() -> DashboardAdapterHttpServer:
    config = load_config()
    service = DashboardAdapterService(config)
    return DashboardAdapterHttpServer(
        (config.host, config.port), DashboardAdapterHandler, service, config
    )


def main() -> None:
    server = create_server()
    print(
        f"{server.adapter_config.local_node_name} dashboard adapter listening on http://{server.adapter_config.host}:{server.adapter_config.port}"
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
