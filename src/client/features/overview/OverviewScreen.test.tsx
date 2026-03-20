// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OverviewScreen } from "./OverviewScreen";

function createDeferredResponse() {
  let resolveResponse: (response: Response) => void;
  let rejectResponse: (error: Error) => void;

  const promise = new Promise<Response>((resolve, reject) => {
    resolveResponse = resolve;
    rejectResponse = reject;
  });

  return {
    promise,
    resolve(response: Response) {
      resolveResponse(response);
    },
    reject(error: Error) {
      rejectResponse(error);
    }
  };
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

describe("OverviewScreen", () => {
  let container: HTMLDivElement;
  let root: ReturnType<typeof createRoot>;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean })
      .IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
  });

  it("shows a loading state before overview data resolves", async () => {
    const healthRequest = createDeferredResponse();
    const agentsRequest = createDeferredResponse();

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.endsWith("/api/health")) {
          return healthRequest.promise;
        }

        if (url.endsWith("/api/agents")) {
          return agentsRequest.promise;
        }

        if (url.endsWith("/api/nodes")) {
          return Promise.resolve(
            jsonResponse({
              data: [
                {
                  id: "agent-1",
                  name: "Gate Node",
                  kind: "gate",
                  origin: "local",
                  status: "healthy",
                  checkedAt: "2026-03-12T00:00:00.000Z",
                  summary: "Gate healthy",
                  supportsSessions: true,
                  supportsSkills: true,
                  supportsFiles: true,
                  supportsWrites: true
                }
              ]
            })
          );
        }

        return Promise.reject(new Error(`Unhandled request: ${url}`));
      })
    );

    await act(async () => {
      root.render(<OverviewScreen />);
    });

    expect(container.textContent).toContain("Loading cluster state...");

    await act(async () => {
      healthRequest.resolve(
        jsonResponse({
          data: {
            status: "healthy",
            checkedAt: "2026-03-12T00:00:00.000Z",
            summary: "All systems normal"
          }
        })
      );
      agentsRequest.resolve(
        jsonResponse({
          data: [
            {
              id: "agent-1",
              name: "Planner",
              status: "idle",
              summary: "Ready"
            }
          ]
        })
      );
      await Promise.resolve();
    });

    await vi.waitFor(() => {
      expect(container.textContent).not.toContain("Loading overview data...");
    });
  });

  it("renders fetched health and agent data after loading", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.endsWith("/api/health")) {
          return Promise.resolve(
            jsonResponse({
              data: {
                status: "healthy",
                checkedAt: "2026-03-12T00:00:00.000Z",
                summary: "All systems normal"
              }
            })
          );
        }

        if (url.endsWith("/api/agents")) {
          return Promise.resolve(
            jsonResponse({
              data: [
                {
                  id: "agent-1",
                  name: "Planner",
                  status: "idle",
                  summary: "Ready"
                },
                {
                  id: "agent-2",
                  name: "Responder",
                  status: "running",
                  summary: "Processing"
                }
              ]
            })
          );
        }

        if (url.endsWith("/api/nodes")) {
          return Promise.resolve(
            jsonResponse({
              data: [
                {
                  id: "agent-1",
                  name: "Gate Node",
                  kind: "gate",
                  origin: "local",
                  status: "healthy",
                  checkedAt: "2026-03-12T00:00:00.000Z",
                  summary: "Gate healthy",
                  supportsSessions: true,
                  supportsSkills: true,
                  supportsFiles: true,
                  supportsWrites: true
                },
                {
                  id: "agent-2",
                  name: "OpenMoose02_MD",
                  kind: "md",
                  origin: "remote",
                  status: "degraded",
                  checkedAt: "2026-03-12T00:00:00.000Z",
                  summary: "Coordinator reachable",
                  supportsSessions: false,
                  supportsSkills: true,
                  supportsFiles: true,
                  supportsWrites: true
                }
              ]
            })
          );
        }

        return Promise.reject(new Error(`Unhandled request: ${url}`));
      })
    );

    await act(async () => {
      root.render(<OverviewScreen />);
    });

    await vi.waitFor(() => {
      expect(container.querySelector('[data-ui="overview-hero"]')).toBeTruthy();
      expect(container.querySelector('[data-ui="overview-nodes"]')).toBeTruthy();
      expect(container.querySelector('[data-ui="overview-agents"]')).toBeTruthy();
      expect(container.textContent).toContain("Cluster Health");
      expect(container.textContent).toContain("All systems normal");
      expect(container.textContent).toContain("Gate Node");
      expect(container.textContent).toContain("OpenMoose02_MD");
      expect(container.textContent).toContain("Planner");
      expect(container.textContent).toContain("Responder");
    });
  });

  it("shows an error state when overview fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.endsWith("/api/health")) {
          return Promise.reject(new Error("Health endpoint unavailable"));
        }

        if (url.endsWith("/api/agents")) {
          return Promise.resolve(
            jsonResponse({
              data: []
            })
          );
        }

        if (url.endsWith("/api/nodes")) {
          return Promise.resolve(
            jsonResponse({
              data: []
            })
          );
        }

        return Promise.reject(new Error(`Unhandled request: ${url}`));
      })
    );

    await act(async () => {
      root.render(<OverviewScreen />);
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain(
        "Unable to load overview data: Health endpoint unavailable"
      );
    });
  });
});
