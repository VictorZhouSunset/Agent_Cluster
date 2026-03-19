# agent_2_dashboard_adapter
Deploy this folder to `agent_2` to expose the dashboard-facing adapter on port `9011`.
It keeps dashboard requests separate from the existing `9001` control plane while reusing that protocol underneath.
Tests here cover the local allowlist and service-layer aggregation helpers.
一旦我所属的文件夹有所变化，请更新我。

| file name | position | function |
| --- | --- | --- |
| README.md | deployment guide | explains what to copy to `agent_2`, required env vars, and how to run the adapter |
| ARCH.md | folder contract | documents the deployable package layout |
| __init__.py | package marker | marks the folder as a Python package |
| __main__.py | module entry | starts the adapter with `python -m agent_2_dashboard_adapter` |
| allowlist.py | filesystem guard | constrains editable files and skill paths to the approved dashboard scope |
| cluster.py | service layer | loads config, aggregates node and agent data, and proxies document operations |
| server.py | HTTP entrypoint | serves JSON endpoints for the dashboard adapter on `9011` |
| test_allowlist.py | helper test | verifies allowlisted file and skill behaviors for local disk access |
| test_cluster.py | service test | verifies node aggregation and local/remote document routing helpers |
