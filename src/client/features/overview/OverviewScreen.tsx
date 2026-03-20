// input: health, node, and agent responses from the dashboard API client
// output: operational overview surfaces for cluster health, nodes, and agent activity using real backend fields
// pos: overview feature screen for the client dashboard
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { useEffect, useState } from "react";
import type { AgentStatus, ClusterNode, DashboardHealth } from "../../../shared/types";
import { apiClient } from "../../lib/apiClient";
import { formatLongDateTime, formatShortDateTime } from "../../lib/formatters";

type OverviewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      health: DashboardHealth;
      nodes: ClusterNode[];
      agents: AgentStatus[];
    };

function getStatusTone(status: string) {
  if (status === "healthy" || status === "idle" || status === "completed") {
    return "status-badge status-badge--healthy";
  }

  if (status === "running" || status === "active" || status === "degraded") {
    return "status-badge status-badge--degraded";
  }

  if (status === "error" || status === "offline") {
    return "status-badge status-badge--error";
  }

  return "status-badge status-badge--neutral";
}

export function OverviewScreen() {
  const [state, setState] = useState<OverviewState>({ status: "loading" });

  useEffect(() => {
    let isActive = true;

    async function loadOverview() {
      try {
        const [health, nodes, agents] = await Promise.all([
          apiClient.getHealth(),
          apiClient.getNodes(),
          apiClient.getAgents()
        ]);

        if (!isActive) {
          return;
        }

        setState({
          status: "success",
          health,
          nodes,
          agents
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setState({
          status: "error",
          message:
            error instanceof Error ? error.message : "Unable to load overview."
        });
      }
    }

    void loadOverview();

    return () => {
      isActive = false;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="overview-workbench stack-grid" data-ui="overview-workbench">
        <section className="workbench-toolbar panel panel--soft" data-ui="overview-toolbar">
          <div className="panel__body workbench-toolbar__body">
            <div className="workbench-toolbar__copy">
              <span className="workbench-toolbar__label">Cluster</span>
              <span className="workbench-toolbar__value">Loading cluster state</span>
            </div>
          </div>
        </section>
        <p className="loading-copy">Loading cluster state...</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="overview-workbench stack-grid" data-ui="overview-workbench">
        <section className="workbench-toolbar panel panel--soft" data-ui="overview-toolbar">
          <div className="panel__body workbench-toolbar__body">
            <div className="workbench-toolbar__copy">
              <span className="workbench-toolbar__label">Cluster</span>
              <span className="workbench-toolbar__value">Overview unavailable</span>
            </div>
          </div>
        </section>
        <p className="error-copy" role="alert">
          Unable to load overview data: {state.message}
        </p>
      </div>
    );
  }

  const healthyNodeCount = state.nodes.filter((node) => node.status === "healthy").length;

  return (
    <div className="overview-workbench stack-grid" data-ui="overview-workbench">
      <section className="workbench-toolbar panel panel--soft" data-ui="overview-toolbar">
        <div className="panel__body workbench-toolbar__body">
          <div className="workbench-toolbar__copy">
            <span className="workbench-toolbar__label">Cluster</span>
            <span className="workbench-toolbar__value">
              {state.health.summary ?? "No cluster summary provided."}
            </span>
          </div>
          <div className="workbench-toolbar__actions">
            <span className={getStatusTone(state.health.status)}>{state.health.status}</span>
          </div>
        </div>
      </section>
      <section className="panel metric-card" data-ui="overview-hero">
        <div className="panel__body">
          <div className="metric-card__kicker">Cluster Health</div>
          <div className="badge-row">
            <span className={getStatusTone(state.health.status)}>
              {state.health.status}
            </span>
            <span className="status-badge status-badge--neutral">
              {healthyNodeCount}/{state.nodes.length || 0} Healthy Nodes
            </span>
            <span className="status-badge status-badge--neutral">
              {state.agents.length} Agent{state.agents.length === 1 ? "" : "s"}
            </span>
          </div>
          <h3 className="metric-card__value">Cluster Health</h3>
          <p className="metric-card__detail">
            {state.health.summary ?? "No summary provided by the backend."}
          </p>
          <div className="meta-line meta-line--mono">
            <span>Checked {formatLongDateTime(state.health.checkedAt)}</span>
          </div>
        </div>
      </section>

      <div className="two-column-grid">
        <section className="panel panel--soft" data-ui="overview-nodes">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Nodes</h3>
              <p className="panel__subtitle">
                Deployment shape and capability support across the visible cluster.
              </p>
            </div>
          </div>
          <div className="panel__body">
            {state.nodes.length > 0 ? (
              <div className="item-list">
                {state.nodes.map((node) => (
                  <article className="item-card" key={node.id}>
                    <div className="badge-row">
                      <span className={getStatusTone(node.status)}>{node.status}</span>
                      <span className="status-badge status-badge--neutral">{node.kind}</span>
                      <span className="status-badge status-badge--neutral">{node.origin}</span>
                    </div>
                    <h4 className="item-card__title">{node.name}</h4>
                    <div className="meta-line meta-line--mono">
                      <span>{node.id}</span>
                      <span>Checked {formatShortDateTime(node.checkedAt)}</span>
                    </div>
                    <p className="item-card__summary">
                      {node.summary ?? "No node summary provided."}
                    </p>
                    <div className="badge-row">
                      {node.supportsSessions ? (
                        <span className="status-badge status-badge--neutral">
                          Sessions
                        </span>
                      ) : null}
                      {node.supportsSkills ? (
                        <span className="status-badge status-badge--neutral">
                          Skills
                        </span>
                      ) : null}
                      {node.supportsFiles ? (
                        <span className="status-badge status-badge--neutral">
                          Files
                        </span>
                      ) : null}
                      {node.supportsWrites ? (
                        <span className="status-badge status-badge--neutral">
                          Writes
                        </span>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-copy">No nodes found.</p>
            )}
          </div>
        </section>

        <section className="panel panel--soft" data-ui="overview-agents">
          <div className="panel__header">
            <div>
              <h3 className="panel__title">Agents</h3>
              <p className="panel__subtitle">
                Real lifecycle data from the dashboard backend, without synthetic telemetry.
              </p>
            </div>
          </div>
          <div className="panel__body">
            {state.agents.length > 0 ? (
              <div className="item-list">
                {state.agents.map((agent) => (
                  <article className="item-card" key={agent.id}>
                    <div className="badge-row">
                      <span className={getStatusTone(agent.status)}>{agent.status}</span>
                    </div>
                    <h4 className="item-card__title">{agent.name}</h4>
                    <div className="meta-line meta-line--mono">
                      {agent.nodeName ? <span>{agent.nodeName}</span> : null}
                      {agent.updatedAt ? (
                        <span>Updated {formatShortDateTime(agent.updatedAt)}</span>
                      ) : null}
                    </div>
                    <p className="item-card__summary">
                      {agent.summary ?? "No agent summary provided."}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-copy">No agents found.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
