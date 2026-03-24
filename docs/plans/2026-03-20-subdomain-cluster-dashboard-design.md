# Subdomain Cluster Dashboard Design

## Goal

在官网登录体系之下的面向最终用户的dashboard，称作 `sub-dashboard`，让用户登录后可以查看自己的订阅状态，并通过官网与 Nginx 的授权链路进入自己已购买集群对应的 `cluster-dashboard`（也就是我做的“中台”）。

第一阶段采用子域名方案：(下面的域名等都是例子）

- 官网: `https://openmoose.ai`
- 用户订阅页: `https://openmoose.ai/dashboard`
- 集群 Dashboard: `https://cluster-001.cluster-dash.openmoose.ai`

## Scope

本设计覆盖以下内容：

- 域名、DNS、HTTPS 的基础入口形态
- 官网登录后订阅页的职责
- 用户、订阅、集群、访问权限的最小数据模型
- 通过子域名进入 `cluster-dashboard` 的授权与反代路径
- MVP 推荐实施顺序

本设计暂不展开以下内容：

- 完整支付产品设计（支付、定价、不同subscription等你们可以研究一下，但暂时不属于现在的MVP内容）
- 自动创建 AWS 集群的详细编排（这个是完整的下一阶段，先要跑完当前的所有内容）
- Sub-Dashboard 或者 Cluster-Dashboard 内部页面本身的重构

## 总设计方案

采用“每个 cluster 一个固定子域名”的模型，而不是“每个用户一个子域名”。

原因有四：

- `cluster` 是资源，`user` 是权限主体，职责更清晰
- 同一个 cluster 转移给其他用户时不需要改域名
- 一个用户未来购买多个 cluster 时更自然
- 当前 `cluster-dashboard` 更适合直接挂在子域名根路径 `/`

## 信息流

1. 用户访问官网并完成登录。
2. 用户进入 `sub-dashboard` 页面。
3. 官网后端根据登录身份查询该用户的订阅状态和可访问 cluster 列表。
4. 页面展示订阅信息、集群状态，以及“打开 Dashboard”按钮。
5. 用户点击“打开 Dashboard”后，请求先到官网后端。
6. 官网后端校验该用户是否有权访问目标 cluster。
7. 校验通过后，浏览器跳转到该 cluster 的子域名，例如 `https://cluster-001.cluster-dash.openmoose.ai`。
8. 子域名入口上的 Nginx （MVP阶段，流量不是特别大的情况，不需要专门的Nginx机器，就用现在咱们的cio上的Nginx就行）再根据 host 和授权信息，反代到对应 cluster 的cio机器的私网IP的 `3000` 服务。
9. 用户进入该 cluster 的 `cluster-dashboard`。

## Responsibilities By Layer

### 1. Cloudflare / DNS / TLS

这里负责公网入口和证书能力。

需要完成的大事：

- 购买正式域名
- 在 Cloudflare 托管 DNS
- 配根域名 `A` 记录到 `98.84.5.63`
- 配通配符记录 `*.cluster-dash.openmoose.ai` 到入口机公网 IP
- 打开 HTTPS，让官网和 cluster 子域名都能走 `443`

### 2. Website Frontend

这里负责用户可见的订阅入口页面，也就是 `sub-dashboard`。

需要完成的大事：

- 登录成功后有明确入口进入 `sub-dashboard`
- `sub-dashboard` 展示当前用户信息
- 展示订阅状态，例如未订阅、已订阅、已付款待分配、已分配
- 展示该用户拥有的 cluster 列表
- 提供“打开 Dashboard”按钮
- 提供“购买/升级”按钮

前端不直接决定能不能访问 cluster，而是调用官网后端接口获取结果。

### 3. Website Backend

这里负责登录态、订阅态和 cluster 访问授权，是整个方案的业务中枢。

需要完成的大事：

- 识别当前登录用户
- 查询订阅状态
- 查询该用户可访问的 cluster
- 处理“打开 Dashboard”请求
- 为集群访问签发短时效授权
- 返回 cluster 对应的目标子域名

官网后端不直接承载 `cluster-dashboard` 页面内容，但负责发放进入它的许可。

### 4. Database

这里负责记录用户、订阅、集群以及访问关系。

MVP 最小上建议至少有这些概念：

- `users`
- `subscriptions`
- `clusters`
- `cluster_assignments` 或 `cluster_access`

建议 `clusters` 记录这些字段：

- `cluster_slug`
- `dashboard_hostname`
- `dashboard_private_host`
- `dashboard_port`
- `status`

建议 `cluster_access` 记录这些字段：

- `user_id`
- `cluster_id`
- `access_status`
- `granted_at`

### 5. Nginx On Website / Entry Server （现在就在咱们的cio上，但是还没有写具体config）

这里负责把子域名请求安全地转发到对应 cluster 的私网 Dashboard。

需要完成的大事：

- 接收 `cluster-001.cluster-dash.openmoose.ai` 这类子域名请求
- 根据 host 识别目标 cluster
- 在转发前先做授权检查
- 授权通过后再 `proxy_pass` 到数据库登记的私网地址，例如 `172.31.67.124:3000`

在当前测试环境中，即使官网、Nginx、cio 在同一台机器上，也建议沿用真实转发方式（而不是127.0.0.1 Localhost）来验证链路。

### 6. Cluster Dashboard

这里是已经存在的内部 Dashboard 服务。

需要完成的大事：

- 继续监听 `3000`
- 保持只通过 Nginx 反代暴露，不直接公网开放（现在测试的公网开放需要调整）
- 不承担订阅系统逻辑
- 只在必要时感知来自官网的授权上下文（用户信息probably）

这个 Dashboard 的职责应尽量保持为“集群内部控制台”，不把官网订阅逻辑塞进这里。

## Suggested Data Relationships

- 一个 `user` 可以有一个或多个 `subscription`
- 一个 `user` 可以被授权访问一个或多个 `cluster`
- 一个 `cluster` 有一个固定的 `dashboard_hostname`
- 一个 `dashboard_hostname` 最终映射到一个私网 `host:port`

推荐例子：

- `user`: Tom
- `cluster_slug`: `test-gate-1`
- `dashboard_hostname`: `cluster-001.cluster-dash.openmoose.ai`
- `dashboard_private_host`: `172.31.67.124`
- `dashboard_port`: `3000`

## MVP Order

这个计划覆盖phase 1 和 phase 2：
### Phase 1: Access Path First

先打通最重要的闭环：

- 域名
- Cloudflare
- HTTPS
- 子域名到 Nginx
- Nginx 到 `3000`
- 测试用户 Tom 可进入当前测试 cluster 的 Dashboard

这是整个项目最核心的第一步。

### Phase 2: Sub-Dashboard

在官网中做好登录后的订阅页：

- 展示订阅状态
- 展示 cluster 列表
- 打通“打开 Dashboard”按钮

### Phase 3: Payment Integration

在访问路径跑通之后，再接支付：

- 完成购买流程
- 支付成功后更新订阅状态
- 根据状态决定是否允许申请 cluster

### Phase 4: Auto Provisioning

最后再做“已付款但未分配 cluster 时自动创建 AWS 资源”的能力：

- 创建 EC2
- 安装 OpenClaw
- 安装 `agent_server.py`
- 部署 `cluster-dashboard`
- 部署 `adapter`
- 写回数据库中的 cluster 记录
- 绑定新的子域名到该 cluster

## MVP Test Cases

### Test 1: Existing Cluster

测试用户 `Tom`：

- 已登录
- 已在数据库中绑定到当前测试 cluster
- 点击“打开 Dashboard”后，可以通过 `cluster-001.cluster-dash.openmoose.ai` 进入现有 `cluster-dashboard`

这是第一优先级测试。

### Test 2: Paid But No Cluster

测试用户 `Kate`：

- 已登录
- 已付款
- 数据库中还没有 cluster

这个场景在 MVP 阶段可以先只显示：

- `Provisioning`
- `Pending assignment`
- `Cluster is being prepared`

自动创建集群建议放到下一阶段。

## What To Do Where

### In Cloudflare

- 配根域名和通配符 DNS
- 打开 HTTPS 代理能力

### In Website Frontend

- 新增或改造 `sub-dashboard`
- 加入订阅态和 cluster 展示
- 接上“打开 Dashboard”和“购买/升级”按钮

### In Website Backend

- 提供用户订阅和 cluster 查询接口
- 提供 launch / authorize 接口
- 控制用户是否可以进入某个 cluster 子域名

### In Database

- 建好 `clusters` 与 `cluster_access` 这类最小表
- 为测试用户写入绑定数据

### In Nginx

- 接住 `*.cluster-dash.openmoose.ai`
- 根据子域名做授权和反代

### In Cluster Dashboard Deployment

- 确保 `3000` 正常工作
- 确保只接受来自入口层的访问路径

## Risks To Watch

- 官网登录态与 cluster 子域名之间的授权衔接需要尽早确定
- 如果以后 cluster 动态增多，Nginx 和数据库的映射更新机制要提前考虑
- 不应让 `cluster-dashboard` 直接暴露到公网
- 自动创建集群会显著增加复杂度，不建议与第一条访问链同时推进

## Summary

推荐先做 “登录用户进入自己 cluster 的子域名 Dashboard” 的链路

这条链路一旦打通，后续支付和自动创建集群都只是围绕已有的权限模型与路由模型继续扩展，而不需要重做整体架构。

自动创建集群的大致流程我明天再研究研究
