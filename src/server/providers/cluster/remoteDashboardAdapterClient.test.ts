import { afterEach, describe, expect, it, vi } from "vitest";
import { createRemoteDashboardAdapterClient } from "./remoteDashboardAdapterClient.js";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("remote dashboard adapter client", () => {
  it("times out hung remote adapter requests instead of hanging forever", async () => {
    vi.useFakeTimers();

    const fetchSpy = vi.fn((_url: URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted.", "AbortError"));
        });
      });
    });
    vi.stubGlobal("fetch", fetchSpy);

    const client = createRemoteDashboardAdapterClient({
      baseUrl: "http://127.0.0.1:9011",
      secret: "test-secret",
      timeoutMs: 25
    });

    const outcome = Promise.race([
      client.listNodes().then(
        () => "resolved",
        (error) => `rejected:${error instanceof Error ? error.message : String(error)}`
      ),
      new Promise<string>((resolve) => {
        setTimeout(() => resolve("still-pending"), 50);
      })
    ]);

    await vi.advanceTimersByTimeAsync(50);

    await expect(outcome).resolves.toMatch(/timed out/i);
  });
});
