#### Vuex 的核心概念和工作流程

**State** 单一状态树，存储应用的全部状态，作为"唯一数据源"。

**Getter** 类似于计算属性，用于从 State 派生出新状态，具有缓存特性。

**Mutation** 唯一允许修改 State 的方法。必须是**同步**函数，便于 DevTools 追踪状态变化。

**Action** 负责提交 (`commit`) Mutation，可以包含**异步**操作或复杂的业务逻辑。

**Module** 将 Store 分割成模块，每个模块拥有自己的 State、Getter、Mutation、Action，支持命名空间 (`namespaced: true`)。

Vuex 的数据流是**单向**的，遵循以下流程：

1. **View (视图)**：用户在组件中触发一个操作。

2. **Dispatch (分发)**：组件通过 `store.dispatch('actionName', payload)` 提交一个 **Action**。

3. **Action (动作)**：Action 执行异步逻辑（如 API 调用）。一旦数据准备好，Action 会通过 `store.commit('mutationName', payload)` 提交一个 **Mutation**。

4. **Commit (提交)**：**Mutation** 是唯一能修改 **State** 的地方。它同步地修改状态。

5. **State (状态)**：状态被更新。

6. **Render (渲染)**：由于 State 是响应式的，所有依赖此 State 的 **View** 组件会自动更新。

#### 对比 Vuex 和 Pinia

**Vuex** 是 Vue 2 时代的官方状态管理库，采用 Flux 架构，强调**单向数据流**和**严格的状态修改规范**（必须通过 Mutation）。适合大型项目，但模板代码较多，TS 支持需要额外配置。

**Pinia** 是 Vue 3 官方推荐的状态管理库，可视为 Vuex 5。设计更简洁，去掉了 Mutation，原生支持 TypeScript，每个 Store 独立无需命名空间。

| 特性         | Vuex                            | Pinia                               |
| ---------- | ------------------------------- | ----------------------------------- |
| 核心概念       | State, Getter, Mutation, Action | State, Getter, Action (去掉 Mutation) |
| 修改状态       | 必须通过 Mutation（同步）               | Action 中直接修改 State                  |
| TypeScript | 需要额外类型声明，配置繁琐                   | **原生支持**，类型自动推导                     |
| 模块化        | 嵌套 Module，需要 `namespaced: true` | **独立 Store 实例**，按需导入，无需命名空间         |
| 体积         | ~10KB                           | **~1KB**，更轻量                        |
| DevTools   | 支持                              | 支持，体验更好                             |
| SSR        | 需要额外配置                          | 开箱即用                                |
| API 风格     | Options API 风格                  | 同时支持 Options 和 Composition API      |

**选型建议**：
Vuex 和 Pinia 更像官方状态管理的代际更替：Vue3 之后组合式 API 和 TS 成为主流，Pinia 在类型推导、样板代码、store 组织方式上都更契合官方心智，而且是官方推荐路线；Vuex 主要保留在存量项目或迁移成本高的场景，新项目默认 Pinia 风险最低。

#### 响应式开发比命令式开发有什么优势？

1. **声明式编程**：只需描述**状态与视图的映射关系**，无需手动操作 DOM，代码更易读易维护。

2. **自动更新**：状态变化时，框架自动处理 DOM 更新，开发者无需关心"何时更新、更新哪里"。

3. **高效渲染**：Virtual DOM + Diff 算法，**精确计算最小 DOM 变化集**，避免不必要的 DOM 操作。

4. **减少 Bug**：手动 DOM 操作容易遗漏或出错，响应式系统保证状态与视图一致性。

5. **组件化开发**：状态封装在组件内部，提高代码复用性和可测试性。

#### 什么是装饰器？在 Vue 中怎么用？

装饰器 (Decorator) 是一种特殊的声明，用于**修改类或类成员的行为**，本质是一个函数。

**在 Vue 中的应用**（主要是 Vue 2 + TypeScript）：

```typescript
import { Component, Prop, Watch } from 'vue-property-decorator';

@Component
export default class MyComponent extends Vue {
  @Prop({ default: '' }) readonly title!: string; // 声明 props

  @Watch('title') // 监听属性变化
  onTitleChange(val: string) {}
}
```

**Vue 3 现状**：Composition API 已取代装饰器方案，官方不再推荐使用装饰器。原因：

- Composition API 提供更好的类型推导
- 装饰器提案尚未稳定
- 函数式组合比类继承更灵活

#### 如何保持组件状态、避免重复渲染？（keep-alive）

主要通过 Vue 的内置抽象组件 **`<keep-alive>`** 来实现。

作用： ` <keep-alive>` 包裹动态组件或路由组件时，会**缓存不活动的组件实例**，而不是销毁它们。这可以避免组件在切换时被重复创建和渲染，从而**保持组件的状态**（如表单输入内容、滚动位置等），并提升性能。

实现原理与钩子函数

1. **缓存机制**：内部使用 `Map` 缓存 VNode，key 为组件名或自定义 key。

2. **生命周期变化**：缓存后 `unmounted`/`destroyed` 不会触发，新增两个钩子：
   
   - **`activated()`**：组件被激活时（切换进来）触发
   - **`deactivated()`**：组件被停用时（切换出去）触发

3. **常用属性**：
   
   - `include`：只缓存匹配的组件（字符串/正则/数组）
   - `exclude`：排除匹配的组件
   - `max`：最大缓存数量，超出时使用 **LRU 算法**淘汰最久未使用的

```html
<keep-alive :include="['Home', 'List']" :max="10">
  <router-view />
</keep-alive>
```

#### Vue 2 和 Vue 3 响应式原理的区别？为什么改用 Proxy？

| 对比项  | Vue 2 (Object.defineProperty) | Vue 3 (Proxy)   |
| ---- | ----------------------------- | --------------- |
| 初始化  | 递归遍历所有属性，开销大                  | **惰性处理**，访问时才递归 |
| 新增属性 | ❌ 无法检测，需用 `$set`              | ✅ 自动响应          |
| 删除属性 | ❌ 无法检测，需用 `$delete`           | ✅ 自动响应          |
| 数组索引 | ❌ 无法检测 `arr[0] = x`           | ✅ 自动响应          |
| 数组长度 | ❌ 无法检测 `arr.length = 0`       | ✅ 自动响应          |

**Vue 3 改用 Proxy 的原因**：

1. **功能更全面**：Proxy 可拦截 13 种操作（get/set/delete/has/ownKeys 等）
2. **性能更优**：惰性响应式，减少初始化开销
3. **代码更简洁**：无需为数组方法打补丁

#### <mark>Vue 的渲染过程（模板 → DOM）</mark>

总结：

初次：1 编译模板（解析 AST+标记+生成渲染函数）2 执行渲染函数生成 VDOM 3 渲染

后续数据更新：1 执行渲染函数生成新 VDOM 2 diff 获得 patch 3 更新 DOM

阶段一：模板编译 (Template Compilation)

1. **解析 (Parse)**：将 HTML 模板字符串解析成抽象语法树 (AST - Abstract Syntax Tree)。AST 是一种用 JavaScript 对象来描述模板结构的树形结构。

2. **优化 (Optimize)**：遍历 AST，标记静态节点 (Static nodes)。静态节点是指内容不会变化的节点。Vue 在后续的 Diff 过程中会跳过这些节点，**大幅提高性能**。

3. **代码生成 (Generate)**：将优化后的 AST 转换成 **Render Function (渲染函数)**。渲染函数返回的就是 VNode (Virtual Node) 树。

阶段二：创建虚拟 DOM (Virtual DOM Creation)

1. **首次渲染**：执行第一步生成的 **Render Function**，它返回一棵 **VNode Tree (虚拟 DOM 树)**。

阶段三：渲染和更新 (Patching & DOM Update)

1. **首次渲染**：将 VNode Tree 转换成真实的 DOM 元素，并插入到页面中。同时，Vue 将这棵 VNode Tree 保存为 `oldVNode`。

2. **数据更新**：响应式数据发生变化时，会触发组件的 Watcher，重新执行 Render Function，生成一棵 **`newVNode` Tree**。

3. **比对 (Patch)**：Vue 运行 **Diff 算法**（Patch 过程），将 `newVNode` 与 `oldVNode` 进行递归比对。

4. **最小化 DOM 操作**：Diff 算法找出两棵树之间**最小的差异集**。

5. **更新 DOM**：Vue 只对这些有差异的真实 DOM 节点进行必要的创建、更新、移动或删除操作，从而完成视图更新。

#### Vue Router 原理？Hash 和 History 模式的区别？

Vue Router 的核心是监听 URL 的变化，并根据配置的路由映射表，动态地渲染对应的组件。

1. **路由映射 (Route Mapping)**：定义 URL 路径 (`path`) 与组件 (`component`) 的映射关系。

2. **监听 URL 变化**：根据配置的模式（Hash 或 History），监听浏览器地址栏 URL 的变化事件。

3. **匹配路由**：当 URL 变化时，Router 捕获新 URL，并在路由映射表中查找匹配的配置。

4. **渲染组件**：将匹配到的组件渲染到 `<router-view>` 占位符的位置上。

| 对比项    | Hash 模式               | History 模式                       |
| ------ | --------------------- | -------------------------------- |
| URL 形式 | `example.com/#/user`  | `example.com/user`               |
| 原理     | `window.onhashchange` | `history.pushState/replaceState` |
| 服务器配置  | 无需配置                  | **需要配置回退**（所有路由返回 index.html）    |
| SEO    | 不友好（爬虫忽略 # 后内容）       | 友好                               |
| 兼容性    | 所有浏览器                 | IE10+                            |

**导航守卫**（补充高频考点）：

- `beforeEach`：全局前置守卫，常用于登录验证
- `beforeResolve`：全局解析守卫
- `afterEach`：全局后置钩子
- `beforeEnter`：路由独享守卫
- `beforeRouteEnter/Update/Leave`：组件内守卫

#### 如何自定义 Vue 指令？有哪些钩子函数？

自定义指令用于对 DOM 元素进行**底层操作**，实现可复用的 DOM 行为。例如：自动获取焦点、权限控制、拖拽功能等。

```js
// main.js
import { createApp } from 'vue';
import App from './App.vue';
const app = createApp(App);

// 注册一个全局自定义指令 v-focus
app.directive('focus', {
  // 元素挂载到 DOM 时调用
  mounted(el) {
    el.focus(); // 使元素自动获取焦点
  },
});

app.mount('#app');

//组件内用directives注册
```

**Vue 3 指令钩子函数**：

- `created`：元素属性/事件监听器应用前
- `beforeMount`：挂载前
- `mounted`：挂载后（常用）
- `beforeUpdate`：更新前
- `updated`：更新后
- `beforeUnmount`：卸载前
- `unmounted`：卸载后

**常见应用场景**：自动聚焦、权限控制（v-permission）、防抖点击、图片懒加载、拖拽

#### Vue 应用性能优化有哪些方向？

- **运行时性能优化 (Runtime Performance)**
  
  - **合理使用 `v-if` 和 `v-show`**：
    
    - **`v-if`**：真正销毁/重建组件，适用于不频繁切换的场景。
    
    - **`v-show`**：仅切换 CSS `display` 属性，适用于频繁切换的场景。
  
  - **`v-for` 必须使用 `key`**：帮助 Vue Diff 算法更高效地进行元素追踪和复用。
  
  - **使用 `v-once`**：对于内容不依赖数据的静态子树，使用 `v-once` 只渲染一次，避免了后续的更新开销。
  
  - **组件拆分和懒加载 (Async Components)**：将大组件拆分为小组件，并使用动态 `import()` 实现组件的按需加载。
  
  - 精准依赖，对 store 或外部属性，精准引入，依靠 vue 对响应式数据的优化
  
  - **大列表优化 (虚拟滚动/Virtual Scrolling)**：对于包含数千个项目的长列表，只渲染可见区域的 DOM，大幅减少 DOM 节点数量。
  
  - **合理使用 `computed` vs `watch`**：`computed` 具有缓存机制，只有依赖项变化时才会重新计算，比 `watch` 更高效。
  
  - **使用 Vue 3 的 `shallowRef` (如果可以)**：对于嵌套层级很深但我们只关心顶层引用的数据，使用 `shallowRef` 来减少不必要的深度响应式处理。

- **加载性能优化 (Loading Performance)**
  
  - **图片优化**：WebP 格式、懒加载、响应式图片
  
  - **路由懒加载**：使用 `const route = () => import('./components/Path')`，将不同路由组件的代码分割成不同的 chunk，实现按需加载。
  
  - **第三方库按需引入**：如使用 Babel 插件或 Vite 插件，对 Element-UI/Plus、Ant Design Vue 等库进行按需导入，而不是全量导入。

- **工程化优化**
  
  - **Tree Shaking**：确保使用 ES Module，移除未使用代码
  
  - **代码分割**：Webpack/Vite 的 splitChunks，合理拆分 vendor 和业务代码
  
  - **Gzip 压缩**：服务端开启压缩，减少传输体积
  
  - **CDN 加速**：静态资源上 CDN，利用边缘节点加速
  
  - **预加载/预获取**：`<link rel="prefetch/preload">` 提前加载关键资源
  
  - **缓存策略**：合理配置 HTTP 缓存头，利用浏览器缓存

#### <mark>项目中遇到过哪些 Vue 相关的难题？如何解决？</mark>

**示例回答框架**（根据实际经验调整）：

**场景 1：大列表性能问题**

- 问题：渲染上万条数据导致页面卡顿
- 方案：引入虚拟滚动（vue-virtual-scroller），只渲染可视区域 DOM
- 效果：DOM 节点从 10000+ 降到 ~50，滚动流畅

**场景 2：组件通信复杂**

- 问题：多层嵌套组件间状态共享困难，props 层层传递
- 方案：引入 Pinia 管理全局状态 + provide/inject 处理局部共享
- 效果：代码解耦，维护性提升

**场景 3：内存泄漏**

- 问题：组件卸载后定时器/事件监听未清理
- 方案：在 `onUnmounted` 中统一清理，封装 `useInterval` 等 hooks
- 效果：内存占用稳定

**回答技巧**：描述具体场景 → 分析原因 → 解决方案 → 量化效果

#### nextTick 的作用和原理？

**作用**：在下次 DOM 更新循环结束之后执行回调，确保操作的是最新 DOM。

**原理**：

1. Vue 的数据变化触发 DOM 更新是**异步批量**的（同一事件循环内的多次修改合并为一次更新）
2. DOM 更新任务被推入**微任务队列**（优先使用 `Promise.then`，降级用 `MutationObserver`、`setImmediate`、`setTimeout`）
3. `nextTick(callback)` 将回调推入同一个微任务队列，排在 DOM 更新之后执行

**执行顺序**：数据变化 → Setter → 派发更新 → 收集 Watcher → **微任务队列**（DOM 更新 → nextTick 回调）

**常见使用场景**：

```javascript
this.show = true;
this.$nextTick(() => {
  this.$refs.input.focus(); // 确保 DOM 已渲染
});
```

#### Vue 3 响应式丢失的原因和解决方案？

常发生在解构（Destructuring）**或**展开（Spreading）响应式对象时。

```javascript
const state = reactive({
  count: 0, // 这是一个被 Proxy 追踪的属性
  name: 'Alice',
});

// --- ❌ 错误做法：响应式丢失 ---
// 解构：将 state.count 的原始值赋给了新的局部变量 count。
// 这两个变量已经没有任何关联。
const { count, name } = state;
```

**解决方案**：

```javascript
// 方案1：使用 toRefs 保持响应式
const { count, name } = toRefs(state); // count.value 是响应式的

// 方案2：直接引用，不解构
state.count;

// 方案3：使用 toRef 获取单个属性
const count = toRef(state, 'count');
```

**延伸：ref vs reactive**

- `ref`：用于基本类型，通过 `.value` 访问，解构不丢失响应式
- `reactive`：用于对象/数组，直接访问属性，解构会丢失响应式

**最佳实践**：统一使用 `ref`，或始终用 `toRefs` 解构 `reactive` 对象。

#### ref和reactive有什么区别？为什么这样设计

先给一个**本质层面的结论**：**reactive 是“面向对象的响应式”，ref 是“面向值的响应式”。** 两者解决的是**不同层级的问题**。
1️. reactive：设计目标是 **让一个对象整体变成响应式**。
特点很明确：
- 返回的是 **Proxy**
- 直接通过 `state.xxx` 访问
- 适合表示**有结构、有多个字段的状态**
- 深层属性天然响应式（递归代理）
为什么 reactive **只能用于对象**？  
因为 Proxy 的拦截目标必须是 object，没法代理：

2️. ref：设计目标完全不同：  **让「单个值 / 基础类型」也能拥有响应式能力**。
特点是：
- 内部用对象包了一层：`{ value: 0 }`
- 响应式发生在 `.value` 上
- 可以包裹 **基础类型 / 对象 / 函数**
也就是说，ref 解决的是一个 reactive 无法解决的问题：**“如何让 number / string / boolean 也参与响应式系统？**

3️. 为什么 Vue 需要同时提供 ref 和 reactive？
这是一个**设计取舍问题**
如果只有 reactive：基础类型没法响应式；解构会丢失响应式（核心问题）
如果只有 ref：对象每一层都要 `.value.xxx`

一句话总结设计动机： **reactive 负责“结构”，ref 负责“原子值”，两者互补而不是替代关系。**

#### ref为什么要用.value?为什么模板不需要

1️. 为什么 ref 必须用 `.value`？
核心原因一句话就够： **JavaScript 没有办法拦截“变量本身”的读写。**
解决：用一个 `{value: }` 对象来包裹，然后用 Proxy / getter / setter 拦截

2️. 那为什么模板里不用 `.value`？
这是 Vue3 做的一个**非常重要的 DX（开发体验）优化**，叫：**Ref Unwrapping（自动解包）**
在模板编译阶段，Vue 会做一件事：`{{ count }}` 编译成 `_count.value`
设计原因：
- 如果每个 ref 都写 `.value`，模板可读性会非常差
- 但在 JS 逻辑里，显式 `.value` 反而更清晰

#### React 自定义 Hooks 和 Vue 3 的 composable，本质区别是什么？

React 自定义 Hook 本质上是对官方 Hook 的组合，它依赖 Hooks 在 Fiber 中按调用顺序存储状态，因此必须遵守严格的调用顺序规则。

Vue 3 的 composable 则是基于响应式系统的逻辑封装，状态由 ref 或 reactive 对象本身标识，而不是由调用顺序决定，因此机制上更加灵活。

两者在写法上相似，但底层原理不同：React Hook 是“顺序绑定状态”，Vue composable 是“引用绑定状态”。