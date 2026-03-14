import { describe, expect, it, vi } from "vitest";
import { resolvePort, startServer } from "./index.js";

describe("server startup", () => {
  it("defaults to port 3000 when PORT is unset", () => {
    expect(resolvePort({})).toBe(3000);
  });

  it("uses the provided PORT value when it is valid", () => {
    expect(resolvePort({ PORT: "4310" })).toBe(4310);
  });

  it("starts the server with the resolved port without opening a real listener", () => {
    const listen = vi.fn((port: number, onListen?: () => void) => {
      onListen?.();
      return fakeServer;
    });
    const fakeServer = { listen };
    const createHttpServer = vi.fn(() => fakeServer);
    const log = vi.fn();

    const result = startServer({
      env: { PORT: "4310" },
      app: (() => undefined) as never,
      createHttpServer,
      log
    });

    expect(createHttpServer).toHaveBeenCalledTimes(1);
    expect(createHttpServer).toHaveBeenCalledWith(expect.any(Function));
    expect(listen).toHaveBeenCalledWith(4310, expect.any(Function));
    expect(log).toHaveBeenCalledWith(
      "Gate dashboard listening on http://localhost:4310"
    );
    expect(result).toBe(fakeServer);
  });
});
