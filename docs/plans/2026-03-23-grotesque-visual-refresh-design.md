# Grotesque Visual Refresh Design

## Goal

将当前 Gate Dashboard 的视觉语言从偏几何、偏 workbench 科技感的样式，收敛为更接近瑞士式 Grotesque sans-serif 的高级深色界面，同时保持现有信息架构和交互行为不变。

## Direction

- 保持深色高对比基底，但改为更中性的黑灰体系。
- 标题、导航、卡片标题、按钮与正文统一改成更接近 `ABC Diatype` 气质的免费 Grotesque 字体。
- 通过留白、字重层级、细边框与少量冰蓝强调色建立高级感，而不是依赖 glow 或高饱和色。
- 保留 monospace 给时间戳、路径、代码和技术元信息，让控制台属性仍然清晰。

## Layout Decisions

### App Shell

- 左侧导航更安静，减少“按钮感”和发光感。
- 顶部工具栏增强留白和标题权重，让页面入口更像品牌化工作台。
- 背景层次改为更薄的黑灰面和弱对比氛围，而不是中心 glow。

### Shared Panels

- `panel` 统一为细边框、浅层填充、低阴影。
- 卡片主要靠排版和间距区分主次，减少粗重背景差异。
- 选中态采用克制的浅亮块与冰蓝边界，而非明显发光。

### Sessions / Skills / Files

- 左右分栏加强主次：左侧是索引，右侧是阅读或编辑舞台。
- 列表项更像索引卡而不是 CTA 按钮。
- Markdown 预览与编辑区更接近高级编辑界面，增强阅读呼吸感。

## Constraints

- 不修改业务逻辑和 API contract。
- 不改变导航、会话读取、技能编辑、文件编辑等既有行为。
- 不新增组件库或新的样式依赖，只通过现有 React + CSS 体系完成。
- 保持桌面和移动端都能正常使用。

## Success Criteria

- 第一眼更像克制、理性的 Grotesque 设计语言，而不是泛化的科技模板。
- 标题与导航气质统一，留白显著提升。
- 冰蓝强调色只出现在真正重要的交互和状态位置。
- Overview、Sessions、Skills、Files 四类页面都共享同一套视觉系统。
