// input: health, node, and agent responses from the dashboard API client
// output: overview screen states for loading, error, and successful cluster summaries
// pos: overview feature screen for the client dashboard
// 一旦我被更新，务必更新我的开头注释以及所属文件夹的md。
import { useEffect, useState } from "react";
import type { AgentStatus, ClusterNode, DashboardHealth } from "../../../shared/types";
import { apiClient } from "../../lib/apiClient";

type OverviewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "success";
      health: DashboardHealth;
      nodes: ClusterNode[];
      agents: AgentStatus[];
    };

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

  return (
    <div style={{ marginTop: "2rem", display: "grid", gap: "1.5rem" }}>
      <section>
        <h3>Health</h3>
        {state.status === "loading" ? <p>Loading overview data...</p> : null}
        {state.status === "error" ? (
          <p role="alert">Unable to load overview data: {state.message}</p>
        ) : null}
        {state.status === "success" ? (
          <div
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: "0.75rem",
              padding: "1rem",
              backgroundColor: "#ffffff"
            }}
          >
            <p style={{ margin: 0 }}>
              <strong>Status:</strong> {state.health.status}
            </p>
            <p style={{ marginBottom: 0 }}>
              <strong>Summary:</strong> {state.health.summary ?? "No summary provided."}
            </p>
          </div>
        ) : null}
      </section>

      <section>
        <h3>Nodes</h3>
        {state.status === "success" ? (
          state.nodes.length > 0 ? (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {state.nodes.map((node) => (
                <article
                  key={node.id}
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: "0.75rem",
                    padding: "0.85rem 1rem",
                    backgroundColor: "#ffffff"
                  }}
                >
                  <strong>{node.name}</strong>
                  <div>{node.kind} node</div>
                  <div>Status: {node.status}</div>
                  {node.summary ? <div>{node.summary}</div> : null}
                </article>
              ))}
            </div>
          ) : (
            <p>No nodes found.</p>
          )
        ) : null}
      </section>

      <section>
        <h3>Agents</h3>
        {state.status === "success" ? (
          state.agents.length > 0 ? (
            <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
              {state.agents.map((agent) => (
                <li key={agent.id}>
                  <strong>{agent.name}</strong>: {agent.status}
                  {agent.nodeName ? ` (${agent.nodeName})` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p>No agents found.</p>
          )
        ) : null}
      </section>
    </div>
  );
}
