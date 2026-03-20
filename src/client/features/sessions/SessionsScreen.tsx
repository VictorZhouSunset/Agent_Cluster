// input: session list/detail responses from the dashboard API client
// output: Gemini-inspired master-detail session browser with Markdown-rich conversation rendering
// pos: sessions feature screen for the client dashboard
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type {
  SessionDetail,
  SessionMessage,
  SessionSummary
} from "../../../shared/types";
import { apiClient } from "../../lib/apiClient";
import {
  formatLongDateTime,
  formatShortDateTime,
  formatShortTime
} from "../../lib/formatters";

type SessionsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; sessions: SessionSummary[] };

type SessionDetailState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; detail: SessionDetail };

function getStatusTone(status?: string) {
  if (status === "completed" || status === "idle") {
    return "status-badge status-badge--healthy";
  }

  if (status === "active" || status === "running") {
    return "status-badge status-badge--degraded";
  }

  if (status === "error") {
    return "status-badge status-badge--error";
  }

  return "status-badge status-badge--neutral";
}

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
    <div className="split-layout">
      <section className="panel split-panel" data-ui="sessions-list">
        <div className="panel__header">
          <div>
            <h3 className="panel__title">Sessions</h3>
            <p className="panel__subtitle">
              Browse recent conversations and inspect message history from the current backend.
            </p>
          </div>
        </div>
        <div className="panel__body list-shell">
          {sessionsState.status === "loading" ? (
            <p className="loading-copy">Loading sessions...</p>
          ) : null}
          {sessionsState.status === "error" ? (
            <p className="error-copy" role="alert">
              Unable to load sessions: {sessionsState.message}
            </p>
          ) : null}
          {sessionsState.status === "success" ? (
            sessions.length > 0 ? (
              <div className="list-scroll">
                {sessions.map((session) => {
                  const isSelected = session.id === selectedSessionId;

                  return (
                    <button
                      key={session.id}
                      className="list-button"
                      type="button"
                      onClick={() => setSelectedSessionId(session.id)}
                      aria-pressed={isSelected}
                    >
                      <span className="list-button__title">{session.title}</span>
                      <div className="list-button__meta">
                        <span>{session.agentName ?? session.agentId ?? "Unknown agent"}</span>
                        <span>{formatShortTime(session.updatedAt)}</span>
                      </div>
                      <div className="badge-row" style={{ marginTop: "10px" }}>
                        <span className={getStatusTone(session.status)}>
                          {session.status ?? "unknown"}
                        </span>
                        {session.nodeName ? (
                          <span className="status-badge status-badge--neutral">
                            {session.nodeName}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="empty-copy">No sessions found.</p>
            )
          ) : null}
        </div>
      </section>

      <section className="panel split-panel detail-shell" data-ui="session-detail">
        {detailState.status === "idle" ? (
          <div className="detail-body">
            <p className="empty-copy">Select a session to view its detail.</p>
          </div>
        ) : null}
        {detailState.status === "loading" ? (
          <div className="detail-body">
            <p className="loading-copy">Loading session detail...</p>
          </div>
        ) : null}
        {detailState.status === "error" ? (
          <div className="detail-body">
            <p className="error-copy" role="alert">
              Unable to load session detail: {detailState.message}
            </p>
          </div>
        ) : null}
        {detailState.status === "success" ? (
          <>
            <div className="detail-header">
              <div className="badge-row">
                <span className={getStatusTone(detailState.detail.status)}>
                  {detailState.detail.status ?? "unknown"}
                </span>
                {detailState.detail.nodeName ? (
                  <span className="status-badge status-badge--neutral">
                    {detailState.detail.nodeName}
                  </span>
                ) : null}
                {detailState.detail.agentName ? (
                  <span className="status-badge status-badge--neutral">
                    {detailState.detail.agentName}
                  </span>
                ) : null}
              </div>
              <h3 className="detail-title">{detailState.detail.title}</h3>
              <div className="meta-line meta-line--mono">
                <span>{detailState.detail.id}</span>
                <span>Updated {formatLongDateTime(detailState.detail.updatedAt)}</span>
                {detailState.detail.startedAt ? (
                  <span>Started {formatShortDateTime(detailState.detail.startedAt)}</span>
                ) : null}
              </div>
            </div>

            <div className="detail-body session-messages">
              {detailState.detail.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}

function MessageBubble({ message }: { message: SessionMessage }) {
  const roleClass = `session-message session-message--${message.role}`;

  return (
    <div className={roleClass} data-message-role={message.role}>
      <div className="session-bubble">
        <div className="session-bubble__meta">
          <span>{message.role}</span>
          <span>{formatLongDateTime(message.createdAt)}</span>
        </div>
        <div className="markdown-surface">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
