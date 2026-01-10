##### nextjs 适用场景

##### SSR

在传统的 SSR 架构（如早期的 React SSR）中，您确实需要维护两套入口（client-entry.js 和 server-entry.js），配置两套 Webpack，处理注水 (Hydration) 的各种样板代码。
Next.js 把这一切都封装了。您只需要写一个 page.tsx，Next.js 会自动在服务器上把它渲染成 HTML，然后在客户端把它“激活”。对于开发者来说，只有一套代码，一套逻辑
Next.js 的伟大之处在于，它让您在同一个项目、同一个文件结构、同一种语言中，流畅地穿梭于“服务端”和“客户端”之间。您不需要配置复杂的环境，但您需要清晰地知道“我现在是在服务器上（获取数据）”还是“我现在是在浏览器里（处理交互）”。这种无缝融合，正是它作为全栈框架的体验确实是目前业界领先于业界的关键。

客户端组件在服务端执行时，只会生成静态 HTML。它的 useEffect、onClick 等逻辑不会运行。这些逻辑只有代码被下载到浏览器并“注水 (Hydrate)”后，才会真正在客户端执行。
服务端组件 (RSC) 的代码，只在服务器上运行。零 JS 发送：这些组件的 JavaScript 代码永远不会被打包发送给浏览器。浏览器收到了什么？：浏览器接收到的是 RSC 执行后的结果（一种特殊的 JSON 数据格式，描述了 UI 的结构）。![](/Users/wzz/Library/Application%20Support/marktext/images/2025-12-01-00-06-38-image.png)

服务端内容变成了纯数据：`<h1>Hello Server</h1>`没有变成 HTML 标签，而是变成了一个描述：“这有一个 h1，内容是 Hello Server”。
客户端组件变成了“占位符”：注意那个 "$L2"。它告诉浏览器：“这里应该放一个 ClientButton 组件。它的代码在 ClientButton.js 里，请去下载它，并把 initialCount: 10 传给它。”
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

服务端组件只在服务端执行，所以不能调客户端的方法包括window等（Node.js 里根本就没有浏览器窗口的概念），也不能useeffect usestate，这些 Hooks 的作用是“在浏览器里管理状态和副作用”。既然 RSC 的代码都不发送给浏览器，这些 Hooks 自然也就毫无用武之地。

客户端组件则是提前再服务端执行得到初始样式和HTML，浏览器加载完HTML后再下载并执行js文件进行水合（React 在浏览器里再次运行这个组件，这次它会执行 useEffect，并且把 onClick 事件监听器挂载到那个已经存在的按钮上。）

当 Next.js 在服务器（Node.js）上渲染一个客户端组件时，它其实是在执行一个“阉割版”的 React 渲染流程：
执行组件函数：Node.js 会像浏览器一样，去调用组件函数
处理 Hooks (有特殊规则)：useState只取初始值；useEffect / useLayoutEffect: 直接跳过；useContext: 正常执行读取组件树上层的 Provider 里的值；
生成 Virtual DOM：函数执行完，React 得到了一棵组件树。
序列化为 HTML：React 的服务端渲染器 (ReactDOMServer) 遍历这棵树，把它转换成纯文本的 HTML 字符串（例如.  \<div>\<button>Click</button></div> ）。 

App Router 是 Next.js 13.4 之后推出的全新路由和渲染架构
基于 app/ 目录：以前的页面写在 pages/ 里，现在的页面写在 app/ 里。
默认 RSC：这是最大的区别。在 app/ 里写的组件，默认全是服务端组件。这彻底改变了开发模式。
嵌套布局 (Nested Layouts)：支持 layout.tsx 嵌套，这是 Pages Router 做不到的。
流式传输 (Streaming)：利用 React Suspense，可以把页面拆成碎片，一部分一部分地发给浏览器（比如先发个 loading 骨架屏，再发数据），极大地优化了 TTFB。

##### RSC react server component

React Server Components 是 React 提出的 **一种让部分组件只在服务器端执行的渲染模式** 
它不是传统意义上的 SSR（Server-Side Rendering）那样生成完整 HTML，而是：

> **在服务器执行组件逻辑，把渲染结果以特殊协议序列化成数据流发送给客户端，客户端再把这些数据解释成 UI。**

核心特点：

- 组件代码 **永远不发送到客户端**（不会打包到 bundle 里）。

- 只能运行在服务器上，不能使用浏览器 API 和交互 Hooks（如 `useState`, `useEffect`）。主要用于数据密集型、展示型的 UI。

- 主要用于数据密集型、展示型的 UI。

这就能让 React 应用更“轻巧、高效、按需加载”。

| 渲染方式        | JS 发送到客户端       | 数据获取模式         | 互动能力                 |
| ----------- | --------------- | -------------- | -------------------- |
| CSR (客户端渲染) | 全组件 JS          | 客户端请求 API      | 强                    |
| SSR (服务端渲染) | 全组件 JS + HTML   | 服务端预取数据 → HTML | 交互需要 hydrate         |
| **RSC**     | **只发送必要的交互 JS** | 服务器直接数据访问      | 交互需 Client Component |

React Server Components 是一种服务器执行的组件模式，它让 UI 的渲染和数据获取在服务端完成，只把 UI 结构通过序列化协议发送给客户端，从而减少 JS bundle、提高性能并简化数据获取，同时和交互组件协同工作，适配复杂应用。

**RSC 适合：数据驱动、多页面/大列表/复杂查询、多数据源聚合，但客户端交互较轻**的页面。

**不适合：交互复杂、状态频繁变化、强实时响应**的组件。

##### Next.js RSC 漏洞

这个漏洞（2024–2025 问题）本质是 **反序列化不可信数据 → 服务端执行恶意构造的代码（RCE）**

漏洞点：服务端反序列化 RSC payload 时，默认信任客户端的数据，服务端代码，没有校验actionId 和 payload 结构是否可信，而是直接可以执行

导致只要攻击者伪造结构正确的 payload，就能执行任意的 Server Action 函数

正确的校验应该：

**校验 1：payload 引用的 actionId 必须属于当前构建生成的 action map**

**校验 2：反序列化过程中禁止还原任意类型对象，只允许白名单类型**
