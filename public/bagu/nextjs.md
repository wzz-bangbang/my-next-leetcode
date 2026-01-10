##### nextjs 是什么？适用场景？

Next.js 本质是一个 React 的全栈框架，它通过内置 SSR、SSG、ISR 和 Server Components，解决了传统 React SPA 在首屏性能、SEO 和工程复杂度上的问题。  
在新版本中，Next.js 以 App Router 和 RSC 为核心，通过默认服务端渲染和精细化缓存，大幅减少客户端 JS 体积，是目前 React 生态中性能和工程化最成熟的方案之一。

1. **SEO 要求高的网站**：官网、博客、电商等需要搜索引擎收录的场景
2. **内容型网站**：新闻、文档站点，适合 SSG/ISR 预渲染
3. **全栈应用**：前后端一体化开发，API Routes 可直接写后端逻辑
4. **性能敏感场景**：首屏加载要求高，需要 SSR + 流式渲染
5. **团队协作项目**：约定式路由 + 文件结构清晰，降低沟通成本

#### Next.js 解决了 React 的哪些核心问题

1. **SEO 问题**：React默认CSR，首屏 JS 大、白屏时间长、SEO 差，Next.js 提供 **SSR / RSC** 
2. **服务端能力**：React 只负责 UI，Next.js = **前端 + BFF + API 层**，服务端组件 / Server Actions / Middleware
3. **工程复杂度**：SSR开箱即用，Next.js 提供文件系统路由，自动按页面代码分割，零配置起步，约定大于配置
4. **开发体验**：Fast Refresh、内置 TypeScript 支持、API Routes 等

#### Next.js 和 React 的区别？

| 维度   | React            | Next.js                     |
| ---- | ---------------- | --------------------------- |
| 定位   |                  | 全栈框架                        |
| 路由   | 需要 react-router  | 内置文件系统路由                    |
| 渲染   | 默认仅 CSR          | RSC/SSR/SSG/ISR/CSR 都支持     |
| 后端能力 | 19 开始官方支持 RSC 协议 | API Routes + Server Actions |
| 构建工具 | 需自行配置            | 内置 Turbopack/Webpack        |
| SEO  | 需额外处理            | 原生支持                        |

**一句话**：React 是造轮子的原料，Next.js 是装好轮子的车。

追问：
Next.js 的 RSC 和 React 19 是不是“一样”？
React 的**RSC 是“框架能力”，不是库能力。** React 19 开始正式支持 RSC 的协议和运行时，但它并不提供完整的服务端渲染和构建体系。RSC 在 React 中更多是作为一种规范存在，主要是给 **框架作者** 用的，不是给普通业务开发者直接用的。而 Next.js 在 App Router 中实现了完整的 RSC 工程化方案，包括 bundle 拆分、缓存、Streaming 和 Server Actions，因此两者在能力完整度上差异很大。

#### Next.js 支持哪些渲染模式？

1. **CSR（Client-Side Rendering）**：纯客户端渲染，用 `use client` 组件实现
2. **RSC（React Server Components）**：默认在服务端执行，不进入 JS bundle，减少客户端 JS 体积
3. **SSR（Server-Side Rendering）**：每次请求时服务端渲染，首屏渲染快，SEO更优秀，页面实时性高，适合动态数据，但成本高
4. **SSG（Static Site Generation）**：构建时生成 HTML，适合静态内容，不适合频繁变化内容
5. **ISR（Incremental Static Regeneration）**：SSG + 定时重新生成，兼顾性能和数据新鲜度

**一句话总结**：  
CSR 是兜底，SSR 是实时，SSG 是极致性能，ISR 是折中方案，RSC 是未来方向

#### Next.js 的 SSR

在传统的 SSR 架构（如早期的 React SSR）中，您确实需要维护两套入口（client-entry.js 和 server-entry.js），配置两套 Webpack，处理注水 (Hydration) 的各种样板代码。
Next.js 把这一切都封装了。您只需要写一个 page.tsx，Next.js 会自动在服务器上把它渲染成 HTML，然后在客户端把它"激活"。对于开发者来说，只有一套代码，一套逻辑
Next.js 的伟大之处在于，它让您在同一个项目、同一个文件结构、同一种语言中，流畅地穿梭于"服务端"和"客户端"之间。您不需要配置复杂的环境，但您需要清晰地知道"我现在是在服务器上（获取数据）"还是"我现在是在浏览器里（处理交互）"。这种无缝融合，正是它作为全栈框架的体验确实是目前业界领先于业界的关键。

客户端组件在服务端执行时，只会生成静态 HTML。它的 useEffect、onClick 等逻辑不会运行。这些逻辑只有代码被下载到浏览器并"注水 (Hydrate)"后，才会真正在客户端执行。
服务端组件 (RSC) 的代码，只在服务器上运行。零 JS 发送：这些组件的 JavaScript 代码永远不会被打包发送给浏览器。浏览器收到了什么？：浏览器接收到的是 RSC 执行后的结果（一种特殊的 JSON 数据格式，描述了 UI 的结构）。![](/Users/wzz/Library/Application%20Support/marktext/images/2025-12-01-00-06-38-image.png)

服务端内容变成了纯数据：`<h1>Hello Server</h1>`没有变成 HTML 标签，而是变成了一个描述："这有一个 h1，内容是 Hello Server"。
客户端组件变成了"占位符"：注意那个 "$L2"。它告诉浏览器："这里应该放一个 ClientButton 组件。它的代码在 ClientButton.js 里，请去下载它，并把 initialCount: 10 传给它。"
浏览器拿到这个 JSON 后做了什么？
React 读取 JSON。
把 div 和 h1 渲染出来（或者更新现有的）。
看到 $L2，去加载客户端组件的代码。
最关键的一步：如果页面上本来就有一个 ClientButton，React 会保留它现在的状态（比如用户已经把 count 点到了 15），然后只更新必要的 props，实现了无缝衔接。

在首次加载页面时，RSC Payload 是内嵌在 HTML 源码中的。浏览器拿到这个 JSON 后做了什么？
React 读取 JSON。
把 div 和 h1 渲染出来（或者更新现有的）。
看到 $L2，去加载客户端组件的代码。
最关键的一步：如果页面上本来就有一个 ClientButton，React 会保留它现在的状态（比如用户已经把 count 点到了 15），然后只更新必要的 props，实现了无缝衔接。

服务端组件只在服务端执行，所以不能调客户端的方法包括 window 等（Node.js 里根本就没有浏览器窗口的概念），也不能 useeffect usestate，这些 Hooks 的作用是"在浏览器里管理状态和副作用"。既然 RSC 的代码都不发送给浏览器，这些 Hooks 自然也就毫无用武之地。

客户端组件则是提前再服务端执行得到初始样式和 HTML，浏览器加载完 HTML 后再下载并执行 js 文件进行水合（React 在浏览器里再次运行这个组件，这次它会执行 useEffect，并且把 onClick 事件监听器挂载到那个已经存在的按钮上。）

当 Next.js 在服务器（Node.js）上渲染一个客户端组件时，它其实是在执行一个"阉割版"的 React 渲染流程：
执行组件函数：Node.js 会像浏览器一样，去调用组件函数
处理 Hooks (有特殊规则)：useState 只取初始值；useEffect / useLayoutEffect: 直接跳过；useContext: 正常执行读取组件树上层的 Provider 里的值；
生成 Virtual DOM：函数执行完，React 得到了一棵组件树。
序列化为 HTML：React 的服务端渲染器 (ReactDOMServer) 遍历这棵树，把它转换成纯文本的 HTML 字符串（例如. \<div>\<button>Click</button></div> ）。

App Router 是 Next.js 13.4 之后推出的全新路由和渲染架构
基于 app/ 目录：以前的页面写在 pages/ 里，现在的页面写在 app/ 里。
默认 RSC：这是最大的区别。在 app/ 里写的组件，默认全是服务端组件。这彻底改变了开发模式。
嵌套布局 (Nested Layouts)：支持 layout.tsx 嵌套，这是 Pages Router 做不到的。
流式传输 (Streaming)：利用 React Suspense，可以把页面拆成碎片，一部分一部分地发给浏览器（比如先发个 loading 骨架屏，再发数据），极大地优化了 TTFB。

#### 什么是 React Server Components？

**核心概念**：只在服务端执行的 React 组件，JS 代码不会发送到客户端。

**特点**：
1. **零客户端 JS**：组件代码不打包到 bundle，减小体积
2. **直接访问后端资源**：可以直接读数据库、文件系统、调用内部 API
3. **输出是 RSC Payload**：一种特殊 JSON 格式，描述 UI 结构

**限制**：
- 不能用 useState、useEffect 等 Hooks
- 不能绑定事件（onClick 等）
- 不能访问浏览器 API（window、document）

**使用场景**：数据获取、静态展示、包裹客户端组件

总结：React Server Components 是一种服务器执行的组件模式，本质是**把 React 的一部分计算前移到服务端**，它让 UI 的渲染和数据获取在服务端完成，只把 UI 结构通过序列化协议发送给客户端，从而减少 JS bundle、提高性能并简化数据获取，同时和交互组件协同工作，适配复杂应用。

#### Next.js RSC 漏洞

这个漏洞（2024–2025 问题）本质是 **反序列化不可信数据 → 服务端执行恶意构造的代码（RCE）**

漏洞点：服务端反序列化 RSC payload 时，默认信任客户端的数据，服务端代码，没有校验 actionId 和 payload 结构是否可信，而是直接可以执行

导致只要攻击者伪造结构正确的 payload，就能执行任意的 Server Action 函数

正确的校验应该：

**校验 1：payload 引用的 actionId 必须属于当前构建生成的 action map**

**校验 2：反序列化过程中禁止还原任意类型对象，只允许白名单类型**

#### `use client` 是做什么的？

**作用**：声明一个组件为客户端组件，标记「服务端 → 客户端」的边界。

**使用时机**：
1. 需要用 useState、useEffect 等 Hooks
2. 需要绑定事件（onClick、onChange）
3. 需要访问浏览器 API（window、localStorage）
4. 使用仅客户端的第三方库

**注意事项**：
- 放在文件顶部第一行
- 该文件及其导入的所有模块都会打包到客户端
- 客户端组件可以渲染服务端组件（通过 children）

#### Next.js 如何做 SEO？

1. **渲染策略**
	- 需要 SEO 的页面用 **SSG/ISR/SSR** 输出完整 HTML。
	- 内容稳定：SSG / ISR；强实时：SSR。
	- App Router 里默认 Server Component，本身就更利于首屏和可索引内容。
2. **Meta / OpenGraph / 结构化数据**
	- **App Router 用 `generateMetadata()` 或 `metadata` 导出（更结构化）。
	- Pages Router 用 `next/head` 写 title、description、canonical、OG、twitter card。
	- App Router 用 `generateMetadata()` 或 `metadata` 导出（更结构化）。
	- 对文章页加 JSON-LD（结构化数据），提高 rich result 概率。
3. **站点工程化**
	- `sitemap.xml`、`robots.txt`、规范化 URL（canonical）、国际化 hreflang（如果有）。
	- 避免重复内容，控制分页/筛选页索引策略。
	- 
**加分点：**
- SEO 不只看“能不能爬”，还看 **Core Web Vitals（LCP/INP/CLS）**，Next.js 通过图片优化、代码分割、RSC 降 JS 等改善性能指标。

#### Pages Router vs App Router 有什么区别？

两者的本质差异在于：**App Router 是围绕 RSC（Server Components）重新设计的路由与渲染体系**，而 Pages Router 是传统的 SSR/SSG 模型。

| 维度   | Pages Router                         | App Router                         |
| ---- | ------------------------------------ | ---------------------------------- |
| 目录   | `pages/`                             | `app/`                             |
| 组件模型 | 默认客户端组件                              | 服务端组件，标 `use client` 才会进客户端 bundle |
| 布局   | `_app.tsx` 全局                        | `layout.tsx` 嵌套                    |
| 数据获取 | getServerSideProps /getStaticProps 等 | 直接 async/await                     |
| 流式渲染 | 不支持                                  | 支持 Suspense                        |
| 错误处理 | `_error.tsx`                         | `error.tsx` 嵌套                     |

**迁移建议**：新项目直接用 App Router，老项目可渐进式迁移。

#### layout.tsx 和 page.tsx 的区别？

**layout.tsx**：定义该路由段及其所有子路由共享的布局（导航栏、侧边栏等）
- **路由切换时保持状态**不会重新渲染
- 可以嵌套，子路由继承父布局
- 必须接收 `children` 并渲染
- 在 App Router 下 layout 默认是 Server Component（除非 `use client`）
**page.tsx**：
- 定义路由的实际内容，对应一个 URL 的最终页面
- 每次访问都会重新渲染
- 是路由可访问的必要条件
- 接收 `params` 和 `searchParams`

**执行顺序**：layout 包裹 page，从外到内渲染。

#### 图片优化 Image 组件的原理？

Next.js 的 `next/image` 做的是“**端到端的图片性能优化**”，核心目标是降低 LCP、节省带宽。
1. **按需生成与压缩**：Image 不是简单 `<img>`，它会请求 Next 的图片优化服务（loader），在服务端做 resize 压缩 格式转换（优先 WebP/AVIF）
2. **响应式尺寸**：根据 `sizes` 属性生成多尺寸 srcset，让浏览器按 DPR 与视口选择合适的资源
3. **懒加载**：默认 `loading="lazy"`，进入视口才加载；首屏关键图用 `priority` 提升加载优先级
4. **占位符**：`placeholder="blur"` 显示模糊预览图（**必须**有 `blurDataURL` 才生效）
5. **防止布局偏移**：通过 width/height 或 fill + container 约束，提前占位，减少布局抖动

**核心**：不是构建时处理，而是请求时按需优化 + 缓存。

**常见坑：**
- 外链域名没配 `images.domains/remotePatterns` 会失败。
- `fill` 必须给父容器明确尺寸/position，否则布局异常。
- 首屏大图不加 `priority` 容易拉高 LCP。
#### loading.tsx 的渲染时机？

**原理**：Next.js 自动将 loading.tsx 包装成 Suspense 的 fallback。

**触发时机**：页面首次加载时/路由切换时，Server Components 在等待数据或组件异步加载导致挂起，Next 会先返回并显示该段的 `loading.tsx`，等数据 ready 后再把真实内容“流式替换”进来。

**特点**：
- 每个路由段可以有自己的 loading.tsx
- 支持流式传输，先返回 loading 状态
- 布局（layout.tsx）不会触发 loading

#### 路由跳转是如何避免整页刷新的？

Next.js 的客户端路由（`next/link` / `router.push`）本质是 **SPA 导航**：
1. **拦截点击事件**：`<Link>` 阻止浏览器默认跳转（不触发整页 reload）。
2. **History API**：使用 `pushState/replaceState` 改 URL，不刷新页面。
3. **预取与增量请求**：Next 会预取目标路由所需的 JS chunk / 数据（空闲时或可见时），导航时只做最小增量加载。
4. **差异化更新**：只重新渲染变化的路由段，保留共享布局状态
5. **按需 hydration**：只对需要交互的 Client Components 做 hydration（RSC 场景下客户端 JS 更少）。

**补一句加分：**  
如果你用 `<a href>` 且没用 Link，或跳到外域，就会整页刷新，这是预期行为。`

#### Next.js 中如何做代码分割？

Next.js 默认就做了非常多代码分割，核心是 **按路由、按组件、按依赖** 三层：

1. **路由级分割（自动）**：每个页面/路由会生成独立 chunk，只有访问该路由才加载对应 JS。
2. **动态导入（手动控制）**
	- 用 `next/dynamic` 对重组件（富文本、图表、地图）做按需加载：
	    - 只在需要时加载
	    - 可以 SSR: false（例如只在浏览器可用的库）
	
3. **组件边界与 RSC**
	- App Router 默认 Server Components 不进客户端 bundle，本质上把很多 UI 逻辑“分割”到服务端，减少客户端 JS。
	- `use client` 会把该组件及其依赖打进客户端 chunk，所以要控制 client 边界尽量小。

4. **第三方依赖优化**
	- 把大依赖放到动态 import 或只在 Server Component 使用，避免进主包。

**常见坑：**
- 一个顶层组件加了 `use client`，会把它依赖的很多东西都拖进客户端包（client 边界扩散）。
- 动态 import 过多会产生大量小 chunk，可能增加请求开销，需要平衡。
#### Next.js 中如何做鉴权？  

**正确的 Next.js 鉴权思路是“分层”**：登录（Authentication）+ 会话（Session）+ 授权（Authorization）。官方指南就是这么拆的。
常见落地方案（面试说这套就稳）
1. **登录/注册**： 用 **Server Actions** 接表单，执行在服务端，适合放敏感逻辑。
2. **会话管理**：Session 放 **HTTP-only Cookie**（或配合 session store / JWT）
3. 授权：不能只在 middleware 做粗过滤，真正的数据读取处也要校验

**常用对比**：
1. **Middleware**：
   - 在请求到达页面前拦截
   - 适合路由级别的权限控制
2. **Server Component**：
   - 直接读取 cookies/headers 验证
   - 适合页面级数据权限
3. **Server Actions**：
   - 每个 action 内部校验用户身份
   - 适合操作级别的权限
4. **第三方库**：NextAuth.js / Clerk / Auth0

**最佳实践**：
用 middleware 做快速跳转和粗过滤，但真正的数据读取必须在 Server Components / Route Handlers / Server Actions 的数据访问层再做一次授权校验。
#### middleware 能做什么？不能做什么？

**能做**：核心就是“改请求/改响应/改去向”
1. 重定向 / 重写 URL
2. 设置/读取 cookies 和 headers
3. 直接返回一个响应，比如鉴权拦截
4. 请求日志

**不能做**：
1. 访问 Node.js API（fs、path 等）—— 运行在 Edge Runtime
2. 直接连接数据库（需通过 API 调用）
3. 执行耗时操作（会把每次请求的“最前置链路”拖慢）
4. 使用大型 npm 包（bundle 大小限制）

**执行时机**：在缓存之前、路由匹配之后。
实战建议：middleware/proxy 只做**快速、轻量、可失败**的事：重定向、locale、A/B、粗鉴权、灰度、加 header
#### Next.js 的数据请求是怎么缓存的？

**四层缓存机制**：

1. **Request Memoization**：同一渲染过程中，相同请求自动去重
2. **Data Cache**：fetch 结果持久化缓存（跨请求/部署）
3. **Full Route Cache**：SSG 页面的 HTML + RSC Payload 缓存
4. **Router Cache**：客户端缓存已访问的路由段（30s/5min）

并且（重要）：Next 默认倾向于“**尽可能缓存**”，除非你显式 opt-out 或触发动态渲染条件。

**控制缓存**示例：
```tsx
fetch(url, { cache: 'no-store' }); // 不缓存
fetch(url, { next: { revalidate: 60 } }); // 60秒后重新验证
```

#### fetch 在 Server Component 中和浏览器 fetch 有什么不同？

**相同点：**API 形状一样，都是 Web fetch。  
**不同点（关键）：`cache` 的含义完全不同**：
- 在**浏览器**：`cache` 表示怎么和浏览器 HTTP cache 交互。
- 在 **Next 服务端**：`cache` 表示怎么和 Next 的 **Data Cache** 交互；并且 Next 给 fetch 增加了 `next.revalidate`、`next.tags` 等语义来做持久缓存与失效。
- 默认是 auto：能静态 → 静态（等价于 force-cache）；发现动态 API → 退化成 no-store
- Server Component 的 fetch：是 **服务端到服务端请求**，不受浏览器 CORS 限制
- cookie 不是“隐式自动注入到所有 fetch”，而是由开发者显式控制。

| 维度      | Server Component，注意执行在服务端       | 浏览器                |
| ------- | ------------------------------- | ------------------ |
| 执行环境    | Node.js / Edge                  | 浏览器                |
| 默认缓存    | 默认是 auto，`cache: 'force-cache'` | `cache: 'default'` |
| 请求去重    | 自动 memoization                  | 无                  |
| 跨域限制    | 无 CORS 限制                       | 受 CORS 约束          |
| Cookies | 需手动加参数控制                        | 自动携带               |
| 扩展选项    | `next: { revalidate, tags }`    | 无                  |

**注意**：Server Component 中的 fetch 运行在真正的服务端环境中，被 Next.js 增强过，不是原生 fetch。

#### Fast Refresh 是什么？

**Fast Refresh 是 Next.js 的开发态热更新机制**。
**Fast Refresh 是在不丢失组件 state 的前提下，实时刷新修改过的模块，用来提升开发体验。**

它解决什么问题？
- 普通 HMR：一改代码 → 整页刷新 → state 全丢
- Fast Refresh：
    - 只刷新受影响组件
    - **尽量保留 React state**
    - 错误修复后自动恢复页面

面试官想听到的关键词
- 开发态（development only）
- 基于 React Refresh
- 保留 state（如果是函数组件 & hooks 结构没破坏）
- 修改 hooks 顺序 / export 结构会触发 full reload

#### API Routes 是什么？

**API Routes 是 Next.js 内置的后端接口能力（BFF）**
**API Routes 允许在 Next.js 项目中直接编写服务端接口，用来承接前端请求或作为 BFF 层。**

本质是什么？
- 运行在 **Node.js / Edge Runtime**
- 不进浏览器 bundle
- 本质是一个 HTTP handler

面试官想听的点
- BFF（Backend For Frontend）
- 鉴权、聚合接口、隐藏后端结构
- 不适合复杂业务（不是完整后端）

#### Edge Runtime

Edge Runtime 本质是一个运行在 CDN 边缘的“请求拦截与改写层”，不是完整服务器，也不是浏览器。
本质
- 运行在 **CDN 边缘节点**
- 执行的是 **Web 标准 API**
- **不是 Node.js**
- **比浏览器多权限，比 Node.js 少能力**

可以把它理解成： **一个“增强版 Service Worker + 网络代理层”**