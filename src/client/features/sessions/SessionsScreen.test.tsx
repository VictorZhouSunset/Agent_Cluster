// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionsScreen } from "./SessionsScreen";

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

describe("SessionsScreen", () => {
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

  it("shows a loading state before session data resolves", async () => {
    const sessionsRequest = createDeferredResponse();

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.endsWith("/api/sessions")) {
          return sessionsRequest.promise;
        }

        return Promise.reject(new Error(`Unhandled request: ${url}`));
      })
    );

    await act(async () => {
      root.render(<SessionsScreen />);
    });

    expect(container.textContent).toContain("Sessions");
    expect(container.textContent).toContain("Session Detail");
    expect(container.textContent).toContain("Loading sessions...");
    expect(container.textContent).toContain("Select a session to view its detail.");

    await act(async () => {
      sessionsRequest.resolve(
        jsonResponse({
          data: []
        })
      );
      await Promise.resolve();
    });

    await vi.waitFor(() => {
      expect(container.textContent).not.toContain("Loading sessions...");
    });
  });

  it("renders the session list, auto-selects the first session, and shows fetched detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.endsWith("/api/sessions")) {
          return Promise.resolve(
            jsonResponse({
              data: [
                {
                  id: "session-1",
                  title: "Morning Run",
                  updatedAt: "2026-03-12T01:00:00.000Z",
                  status: "active"
                },
                {
                  id: "session-2",
                  title: "Evening Review",
                  updatedAt: "2026-03-12T02:00:00.000Z",
                  status: "completed"
                }
              ]
            })
          );
        }

        if (url.endsWith("/api/sessions/session-1")) {
          return Promise.resolve(
            jsonResponse({
              data: {
                id: "session-1",
                title: "Morning Run",
                updatedAt: "2026-03-12T01:00:00.000Z",
                status: "active",
                messages: [
                  {
                    id: "message-1",
                    role: "assistant",
                    content: "Ready to help",
                    createdAt: "2026-03-12T01:00:00.000Z"
                  }
                ]
              }
            })
          );
        }

        return Promise.reject(new Error(`Unhandled request: ${url}`));
      })
    );

    await act(async () => {
      root.render(<SessionsScreen />);
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain("Morning Run");
      expect(container.textContent).toContain("Evening Review");
      expect(container.textContent).toContain("Ready to help");
      const selectedButton = container.querySelector('button[aria-pressed="true"]');
      expect(selectedButton?.textContent).toContain("Morning Run");
    });
  });

  it("loads and renders a different detail payload when the selected session changes", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.endsWith("/api/sessions")) {
        return Promise.resolve(
          jsonResponse({
            data: [
              {
                id: "session-1",
                title: "Morning Run",
                updatedAt: "2026-03-12T01:00:00.000Z",
                status: "active"
              },
              {
                id: "session-2",
                title: "Evening Review",
                updatedAt: "2026-03-12T02:00:00.000Z",
                status: "completed"
              }
            ]
          })
        );
      }

      if (url.endsWith("/api/sessions/session-1")) {
        return Promise.resolve(
          jsonResponse({
            data: {
              id: "session-1",
              title: "Morning Run",
              updatedAt: "2026-03-12T01:00:00.000Z",
              status: "active",
              messages: [
                {
                  id: "message-1",
                  role: "assistant",
                  content: "Ready to help",
                  createdAt: "2026-03-12T01:00:00.000Z"
                }
              ]
            }
          })
        );
      }

      if (url.endsWith("/api/sessions/session-2")) {
        return Promise.resolve(
          jsonResponse({
            data: {
              id: "session-2",
              title: "Evening Review",
              updatedAt: "2026-03-12T02:00:00.000Z",
              status: "completed",
              messages: [
                {
                  id: "message-2",
                  role: "assistant",
                  content: "Review complete",
                  createdAt: "2026-03-12T02:00:00.000Z"
                }
              ]
            }
          })
        );
      }

      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });

    vi.stubGlobal("fetch", fetchMock);

    await act(async () => {
      root.render(<SessionsScreen />);
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain("Ready to help");
    });

    const sessionButtons = Array.from(container.querySelectorAll("button"));
    const eveningReviewButton = sessionButtons.find((button) =>
      button.textContent?.includes("Evening Review")
    );

    expect(eveningReviewButton).toBeDefined();

    await act(async () => {
      eveningReviewButton?.click();
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain("Review complete");
      const selectedButton = container.querySelector('button[aria-pressed="true"]');
      expect(selectedButton?.textContent).toContain("Evening Review");
      expect(fetchMock).toHaveBeenCalledWith("/api/sessions/session-2", {
        headers: {
          Accept: "application/json"
        }
      });
    });
  });

  it("shows an error state when the session list fails to load", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.endsWith("/api/sessions")) {
          return Promise.reject(new Error("Session list unavailable"));
        }

        return Promise.reject(new Error(`Unhandled request: ${url}`));
      })
    );

    await act(async () => {
      root.render(<SessionsScreen />);
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain(
        "Unable to load sessions: Session list unavailable"
      );
    });
  });

  it("shows an error state when the selected session detail fails to load", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.endsWith("/api/sessions")) {
          return Promise.resolve(
            jsonResponse({
              data: [
                {
                  id: "session-1",
                  title: "Morning Run",
                  updatedAt: "2026-03-12T01:00:00.000Z",
                  status: "active"
                }
              ]
            })
          );
        }

        if (url.endsWith("/api/sessions/session-1")) {
          return Promise.reject(new Error("Session detail unavailable"));
        }

        return Promise.reject(new Error(`Unhandled request: ${url}`));
      })
    );

    await act(async () => {
      root.render(<SessionsScreen />);
    });

    await vi.waitFor(() => {
      expect(container.textContent).toContain(
        "Unable to load session detail: Session detail unavailable"
      );
    });
  });
});
