// input: session list/detail responses from the dashboard API client
// output: master-detail session browser with loading, error, and content states
// pos: sessions feature screen for the client dashboard
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { useEffect, useState } from "react";
import type { SessionDetail, SessionSummary } from "../../../shared/types";
import { apiClient } from "../../lib/apiClient";

type SessionsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; sessions: SessionSummary[] };

type SessionDetailState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; detail: SessionDetail };

export function SessionsScreen() {
  const [sessionsState, setSessionsState] = useState<SessionsState>({
    status: "loading"
  });
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [detailState, setDetailState] = useState<SessionDetailState>({
    status: "idle"
  });

  useEffect(() => {
    let isActive = true;

    async function loadSessions() {
      try {
        const sessions = await apiClient.listSessions();

        if (!isActive) {
          return;
        }

        setSessionsState({
          status: "success",
          sessions
        });
        setSelectedSessionId((currentId) => currentId ?? sessions[0]?.id ?? null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setSessionsState({
          status: "error",
          message:
            error instanceof Error ? error.message : "Unable to load sessions."
        });
      }
    }

    void loadSessions();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedSessionId) {
      setDetailState({ status: "idle" });
      return;
    }

    const sessionId = selectedSessionId;
    let isActive = true;
    setDetailState({ status: "loading" });

    async function loadDetail() {
      try {
        const detail = await apiClient.getSession(sessionId);

        if (!isActive) {
          return;
        }

        setDetailState({
          status: "success",
          detail
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setDetailState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to load session detail."
        });
      }
    }

    void loadDetail();

    return () => {
      isActive = false;
    };
  }, [selectedSessionId]);

  const sessions =
    sessionsState.status === "success" ? sessionsState.sessions : [];

  return (
    <div
      style={{
        marginTop: "2rem",
        display: "grid",
        gridTemplateColumns: "minmax(220px, 320px) 1fr",
        gap: "1.5rem"
      }}
    >
      <section>
        <h3>Sessions</h3>
        {sessionsState.status === "loading" ? <p>Loading sessions...</p> : null}
        {sessionsState.status === "error" ? (
          <p role="alert">Unable to load sessions: {sessionsState.message}</p>
        ) : null}
        {sessionsState.status === "success" ? (
          sessions.length > 0 ? (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {sessions.map((session) => {
                const isSelected = session.id === selectedSessionId;

                return (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => setSelectedSessionId(session.id)}
                    aria-pressed={isSelected}
                    style={{
                      textAlign: "left",
                      border: "1px solid #cbd5e1",
                      borderRadius: "0.75rem",
                      padding: "0.85rem 1rem",
                      backgroundColor: isSelected ? "#e2e8f0" : "#ffffff",
                      cursor: "pointer"
                    }}
                  >
                    <strong>{session.title}</strong>
                    <div>{session.status ?? "unknown"}</div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p>No sessions found.</p>
          )
        ) : null}
      </section>

      <section>
        <h3>Session Detail</h3>
        {detailState.status === "idle" ? (
          <p>Select a session to view its detail.</p>
        ) : null}
        {detailState.status === "loading" ? <p>Loading session detail...</p> : null}
        {detailState.status === "error" ? (
          <p role="alert">Unable to load session detail: {detailState.message}</p>
        ) : null}
        {detailState.status === "success" ? (
          <article
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: "0.75rem",
              padding: "1rem",
              backgroundColor: "#ffffff"
            }}
          >
            <h4 style={{ marginTop: 0 }}>{detailState.detail.title}</h4>
            <p>
              <strong>Status:</strong> {detailState.detail.status ?? "unknown"}
            </p>
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {detailState.detail.messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "0.5rem",
                    padding: "0.75rem"
                  }}
                >
                  <strong>{message.role}</strong>
                  <p style={{ marginBottom: 0 }}>{message.content}</p>
                </div>
              ))}
            </div>
          </article>
        ) : null}
      </section>
    </div>
  );
}
