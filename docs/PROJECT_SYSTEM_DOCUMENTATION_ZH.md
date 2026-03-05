# Professional Resume Builder 项目系统文档（详细版）

> 文档目标：给后续维护者提供可交接、可扩展、可定位问题的说明。  
> 文档范围：仓库业务源码与配置文件（不展开 `node_modules/` 和 `dist/` 内部实现）。  
> 最后更新：2026-02-16

---

## 1. 项目概览

这是一个基于 `React + Vite + TypeScript` 的中文简历编辑器，支持：

1. 左侧结构化编辑（基本信息、教育、项目、实习/工作、技能）。
2. 富文本能力（加粗、斜体、下划线、列表、缩进、链接、清除格式）。
3. 右侧 A4 风格实时预览，分页渲染。
4. 系统打印导出 PDF（`window.print()`）。
5. 多简历本地缓存（首页卡片、自动保存、`Ctrl/Cmd+S` 手动保存）。
6. 栏目和条目拖拽排序。
7. PDF 预览 `Ctrl/Cmd + 滚轮` 缩放 + 放大后拖拽平移。

---

## 2. 依赖说明（每个包做什么）

### 2.1 运行时依赖

| 包名 | 版本 | 用途 |
|---|---:|---|
| `react` | `^19.2.4` | 组件渲染与状态管理 |
| `react-dom` | `^19.2.4` | DOM 挂载 |
| `lucide-react` | `^0.564.0` | 图标（工具栏、按钮、排序、操作图标） |

### 2.2 开发依赖

| 包名 | 版本 | 用途 |
|---|---:|---|
| `vite` | `^6.2.0` | 本地开发与构建 |
| `@vitejs/plugin-react` | `^5.0.0` | Vite React 插件 |
| `typescript` | `~5.8.2` | 静态类型检查 |
| `@types/node` | `^22.14.0` | Node 类型定义 |

---

## 3. 目录结构与文件职责

```text
.
├─ .editorconfig
├─ .env.local
├─ .gitignore
├─ App.tsx
├─ index.css
├─ index.html
├─ index.tsx
├─ metadata.json
├─ package.json
├─ package-lock.json
├─ README.md
├─ tsconfig.json
├─ types.ts
├─ vite.config.ts
├─ components/
│  └─ ResumeDocument.tsx
├─ .vscode/
│  └─ settings.json
├─ docs/
│  └─ PROJECT_SYSTEM_DOCUMENTATION_ZH.md
└─ dist/   (构建产物，非手写业务源码)
```

### 3.1 根目录文件

- `App.tsx`：主应用，包含首页、编辑页、数据状态、保存、排序、打印、缩放等核心交互。
- `index.tsx`：React 入口，挂载 `App`。
- `index.html`：页面模板、字体和打印基础样式、挂载点。
- `index.css`：全局基础样式（`box-sizing`）。
- `types.ts`：核心数据模型定义（`ResumeData`、`ResumeConfig` 等）。
- `vite.config.ts`：Vite 配置（端口、host、路径别名）。
- `README.md`：本地启动说明。
- `metadata.json`：项目元信息。
- `.editorconfig`：统一编码/换行/缩进策略。
- `.env.local`：本地环境变量（当前主流程不依赖）。

### 3.2 组件目录

- `components/ResumeDocument.tsx`：PDF 风格预览的核心渲染器，含分页测量、页面裁剪、打印样式、头像位置编辑。

---

## 4. 数据模型（`types.ts`）

### 4.1 主要类型

1. `ContactInfo`：电话、邮箱、网址、政治面貌。
2. `ResumeSectionKey`：`'education' | 'projects' | 'work' | 'skills'`。
3. `Education`：学校、学历、专业、时间、标签、内容 HTML。
4. `Experience`：公司/项目、角色、时间、内容 HTML。
5. `SkillSection`：技能标题与技能项数组。
6. `ResumeData`：完整简历数据结构。
7. `ResumeConfig`：排版参数（字号、行高、边距、间距、字体、链接下划线、头像矩形）。

### 4.2 `ResumeConfig` 对渲染的影响

- `baseFontSize`：控制正文和标题的相对字号。
- `lineHeight`：影响分页容量。
- `pagePaddingX/Y`：决定可用内容区高度。
- `itemSpacing/sectionSpacing`：控制条目/栏目节奏。
- `fontFamily`：全局字体族。
- `linkUnderline`：链接默认样式。
- `avatar`：头像在 A4 页面中的位置和尺寸（毫米）。

---

## 5. `App.tsx` 模块设计（函数级）

## 5.1 核心常量与工具函数

- `DEFAULT_SECTION_ORDER`：默认栏目顺序。
- `DEFAULT_CONFIG`：默认样式配置。
- `EMPTY_RESUME_DATA`：默认空白简历模板。
- `MIN_PREVIEW_ZOOM / MAX_PREVIEW_ZOOM / ZOOM_STEP`：预览缩放边界与步长。
- `deepClone`：JSON 深拷贝。
- `clampPreviewZoom`：缩放值钳制。
- `moveInArray`：拖拽排序时的数组重排。
- `ensureSectionOrder`：防止缺项/重复项的栏目顺序修复。

## 5.2 UI 子组件

- `RichTextEditor`
  - `emitChange`：提取编辑器 HTML 回写状态。
  - `refreshActiveState`：更新工具栏激活态（粗体/斜体/列表等）。
  - `runCommand`：执行富文本指令（`execCommand`）。
  - `handleInsertLink`：插入链接。
- `TagManager`
  - `addTag/removeTag`：标签增删。
  - `handleKeyDown`：回车添加。
- `CollapsibleSection`
  - 通用折叠卡片容器。
- `ResumeThumbnail`
  - 首页卡片中渲染第一页缩略图。
  - 使用 `ResizeObserver` 按容器宽度动态计算缩放比例。

## 5.3 主组件业务函数

- `toggleSection`：栏目折叠开关。
- `toggleItemOpen`：条目折叠开关。
- `createSavedResume`：新建本地简历文档对象。
- `openResume`：打开指定文档进入编辑页。
- `persistCurrentResume`：把当前数据持久化到文档列表。
- `handleSaveShortcut`：拦截 `Ctrl/Cmd+S` 执行保存并刷新预览。
- `handleImageUpload`：上传头像并转 base64。
- `handleSectionDrop`：栏目拖拽排序落点逻辑。
- `moveItemTo`：条目拖拽排序逻辑（教育/项目/工作）。
- `handleItemDrop`：条目落点处理。
- `createResumeAndEdit`：新建并进入编辑。
- `removeSavedResume`：删除文档。
- `handlePrint`：系统打印导出。

## 5.4 页面与状态

- 页面模式：
  - `view = home`：首页卡片列表。
  - `view = editor`：编辑 + 预览。
- 标签模式：
  - `activeTab = content | design`。
- 持久化键：
  - `resume_builder_saved_resumes_v2`
  - `resume_builder_active_id_v2`
- 自动保存：
  - `resumeData/config/sectionOrder` 变化后回写 localStorage。

---

## 6. `ResumeDocument.tsx` 设计（函数级 + 分页机制）

## 6.1 关键常量

- `A4_WIDTH_MM = 210`
- `A4_HEIGHT_MM = 297`
- `PAGINATION_EPSILON_PX = 0.5`
- `PAGE_HEIGHT_SAFETY_PX = 2`
- `MIN_TAIL_PAGE_CONTENT_PX = 6`

## 6.2 核心函数

- `getLeafBlocks(container)`
  - 递归找“最小不可拆分页块”（没有块级子元素的块元素）。
  - 分页时以这些节点作为边界，避免随机截断。
- `chunkArray`
  - 用于联系方式 2 列展示分组。
- `createMarkup`
  - 统一将 HTML 字符串转 `dangerouslySetInnerHTML`。
- `measure`
  - 核心分页算法：
  1. 测量容器中获取叶子块。
  2. 计算每个块的 `top/bottom`。
  3. 生成每页 offset。
  4. 去重和排序 offset。
  5. 过滤“几乎空白尾页”。
- `scheduleMeasure`
  - 字体 ready + 双 `requestAnimationFrame` 后触发测量，降低误差。

## 6.3 分页渲染策略

1. 隐藏测量容器 `.measure-container` 用于真实高度计算。
2. 可见页面 `.resume-page` 固定 A4 物理尺寸。
3. 每页使用 `.page-viewport` 按 `offset` + `clipHeight` 裁剪内容。
4. 第二页起在预览态插入 `page-gap`；打印态隐藏。

## 6.4 打印策略

- 使用 `@media print` + `@page` 控制 A4 输出。
- 清除阴影、间隙和非打印元素。
- 保证分页行为与预览一致。

---

## 7. PDF 预览缩放与拖拽

- 缩放触发：鼠标在 PDF 区域内按住 `Ctrl/Cmd + 滚轮`。
- 缩放边界：`0.7 ~ 2.0`。
- 缩放步长：`0.08`。
- 放大后支持按住左键平移查看不同区域。
- 拦截浏览器默认缩放，优先作用于 PDF 区域。

---

## 8. 首页卡片缩略图机制

- 每张卡片通过 `ResumeThumbnail` 渲染 `ResumeDocument` 的第一页。
- `showOnlyFirstPage`：只取第一页内容。
- `isThumbnail`：移除页面阴影，避免“卡片里再套一层厚边框”。
- 缩略图区尺寸已收敛：
  - 卡片宽度：`240px`
  - 缩略图宽度：`240px`（与卡片同宽）
  - 目标：减少无效留白，提升信息密度和观感一致性。

---

## 9. 本次清理结果（未使用项）

## 9.1 已删除的未使用包

1. `@google/genai`
2. `html2pdf.js`

## 9.2 已删除的未使用文件/目录

1. `services/geminiService.ts`
2. `constants.ts`
3. 空目录 `hooks/`
4. 空目录 `services/`

## 9.3 已清理的未使用代码

1. `App.tsx` 中未使用导入：`ImageIcon`
2. `ResumeDocument.tsx` 中 `chunkArray` 未使用参数 `v`

## 9.4 同步清理的配置残留

1. `vite.config.ts` 移除无效 env 注入定义。
2. `index.html` 移除 `@google/genai` import map 条目。
3. `README.md` 移除 Gemini API Key 步骤，更新为纯本地启动流程。

---

## 10. 验证清单

本次改动已执行：

1. `npx tsc --noEmit --noUnusedLocals --noUnusedParameters`：通过。
2. `npm run build`：通过。

---

## 11. 维护建议

1. 后续若引入 AI 润色功能，建议独立为可选模块（避免主流程依赖外部 API）。
2. 富文本当前基于 `execCommand`，未来可迁移 `TipTap/Slate/ProseMirror`。
3. 建议补充最小化 E2E 用例：
   - 栏目拖拽排序
   - 条目拖拽排序
   - 分页边界
   - `Ctrl/Cmd+滚轮` 缩放与拖拽平移

---

## 12. 变更记录

### 12.1 2026-02-16（缩放下限调整）

- 文件：`App.tsx`
- 变更：`MIN_PREVIEW_ZOOM` 从 `0.35` 调整到 `0.7`。
- 目的：避免 PDF 预览缩得过小导致不可读。

### 12.2 2026-02-16（未使用项清理）

- 删除未使用包：`@google/genai`、`html2pdf.js`
- 删除未使用文件：`services/geminiService.ts`、`constants.ts`
- 删除空目录：`hooks/`、`services/`
- 清理未使用代码：`ImageIcon` 导入、`chunkArray` 未使用参数
- 同步清理：`vite.config.ts`、`index.html`、`README.md`

### 12.3 2026-02-16（首页缩略图宽度与留白优化）

- 文件：`App.tsx`
- 变更：
  - 卡片最大宽度 `340px -> 300px`
  - 缩略图容器 `260px -> 220px`
  - 缩略图顶部包裹层改为更轻量间距（减少视觉留白）
- 目的：让首页展示更接近整页简历比例，减少无效空白区域。

### 12.4 2026-02-16（首页卡片与 PDF 同宽）

- 文件：`App.tsx`
- 变更：
  - 首页卡片由弹性最大宽改为固定宽 `240px`
  - 缩略图改为直接占满卡片宽度，移除外层左右包裹留白
  - 卡片顶部与缩略图间不再额外增加左右 padding
- 目的：让“整体卡片宽度”与“PDF 缩略图宽度”保持一致，减少左右边框感。

### 12.5 2026-02-16（富文本字号统一）

- 文件：`components/ResumeDocument.tsx`
- 变更：
  - 在 `.tight-spacing` 范围内新增字号/行高/字体归一化规则
  - 强制所有嵌套标签继承同一字号和行高
  - 对 `h1~h6` 在正文区做同字号归一，避免标题标签导致正文忽大忽小
- 目的：修复粘贴富文本后 PDF 正文出现“同段落字体大小不一致”的问题。

### 12.6 2026-02-16（链接下划线与富文本样式串扰修复）

- 文件：`components/ResumeDocument.tsx`
- 变更：
  - 将 `a / p / b,strong` 从全局选择器改为 `.resume-content` 作用域
  - 新增 `.resume-content u` 规则，确保下划线文本渲染稳定
- 目的：避免 PDF 样式串到左侧编辑区，修复“链接下划线显示与富文本展示异常”。

### 12.7 2026-02-16（左侧富文本链接下划线与配置同步）

- 文件：`App.tsx`
- 变更：
  - `RichTextEditor` 新增 `linkUnderline` 入参
  - 编辑区 `<a>` 显示改为动态：`[&_a]:underline` / `[&_a]:no-underline`
  - 教育/项目/实习/技能四个富文本编辑器统一传入 `config.linkUnderline`
- 目的：修复“左侧未设置也出现下划线、左右显示不一致”的问题，让左侧编辑与右侧 PDF 预览保持一致。

### 12.8 2026-02-16（条目排序弹层拖拽时不再消失）

- 文件：`App.tsx`
- 变更：
  - 调整条目排序弹层 `onMouseLeave` 逻辑：
    - 鼠标仍在当前容器子节点内时不关闭
    - 当前 section 正在拖拽时不关闭
  - 移除 `onMouseLeave` 中对拖拽状态的强制清空
  - `onDragStart` 时显式保持弹层激活状态
- 目的：修复“鼠标移入显示，开始拖拽后弹层消失”的交互问题。

### 12.9 2026-02-16（条目排序面板改为点击触发）

- 文件：`App.tsx`
- 变更：
  - 条目排序面板从“hover 显示/移出隐藏”改为“点击图标切换显示”
  - 新增面板外部点击关闭逻辑（拖拽进行中不自动关闭）
  - 面板容器使用 `itemSortPanelRef` 做点击外部判定
- 目的：修复“鼠标移出后面板消失，无法稳定拖拽排序”的问题。
