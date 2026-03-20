# Google AI Workbench Design

## Goal

将当前 Dashboard 从“带氛围光效的 operations dashboard”收敛成更像 Google AI Studio / IDE workbench 的界面，同时保留现有真实后端能力与交互结构。

## Direction

- 保留现有 React + TypeScript 架构和真实数据流
- 不引入 Tailwind、UI 组件库或新的后端接口
- 让整体更克制、更像工作台：
  - 更薄的导航
  - 更轻的 panel 边界
  - 更少的说明文案
  - 更统一的顶部工具条
  - 更明确的左侧列表 / 右侧详情 split-pane

## Layout Decisions

### App Shell

- 左侧改成更窄的 navigation rail
- 顶部增加统一 toolbar，而不是每页都用厚重 section hero
- 弱化背景 glow，改成更平、更暗的 workspace 底色

### Overview

- 保留真实 `health / nodes / agents` 数据
- 改成更像控制台首页的两列工作区
- 减少大面积 showcase 卡片

### Sessions

- 保持 master-detail，但更像 chat workbench
- 左侧 session list 更紧凑
- 右侧 detail header 更薄，消息区域更像 IDE chat 面板

### Skills / Files

- 继续复用共享文档工作流
- 左侧列表更接近资源浏览器
- 右侧 detail 区更接近文档工作台
- `Edit / Save / Cancel` 保留在右上角工具位

## Constraints

- 不新增假服务、假文档或假控制项
- 不更改现有 backend contract
- 不改变真实编辑权限边界
- 不影响 `Bundled / Managed / Workspace` skills 分层
- 不影响真实 sessions 读取逻辑

## Success Criteria

- 第一眼更像 workbench / IDE，而不是展示型 dashboard
- 页面密度更克制，阅读负担更低
- 现有行为保持不变：
  - section navigation
  - sessions list/detail
  - files/skills preview/edit/save
  - node switching
