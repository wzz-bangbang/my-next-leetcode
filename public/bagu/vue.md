#### 描述一下 Vuex 的核心概念（State、Getter、Mutation、Action、Module）及其工作流程。

**Mutation**唯一允许修改 State 的方法。必须是**同步**函数。

**Action**负责提交 (`commit`) Mutation，可以包含**异步**操作或复杂的业务逻辑。

**Module**将 Store 分割成模块，每个模块拥有自己的 State、Getter、Mutation、Action。

Vuex 的数据流是**单向**的，遵循以下流程：

1. **View (视图)**：用户在组件中触发一个操作。

2. **Dispatch (分发)**：组件通过 `store.dispatch('actionName', payload)` 提交一个 **Action**。

3. **Action (动作)**：Action 执行异步逻辑（如 API 调用）。一旦数据准备好，Action 会通过 `store.commit('mutationName', payload)` 提交一个 **Mutation**。

4. **Commit (提交)**：**Mutation** 是唯一能修改 **State** 的地方。它同步地修改状态。

5. **State (状态)**：状态被更新。

6. **Render (渲染)**：由于 State 是响应式的，所有依赖此 State 的 **View** 组件会自动更新。

#### vuex pinia 对比

pinia：

扁平化，去掉了 Mutation，核心概念是 State, Getter, Action。

在 Action 中直接修改 State 即可（更简洁）。

**原生且出色**的 TypeScript 支持，Store 类型是自动推导的。

默认就是**独立的 Store 实例**，无需命名空间，结构更清晰。

使用 `defineStore()` 创建 Store，在组件中使用时直接解构（如 `store.counter`）。

**更轻量**，API 极简，学习曲线平缓。

#### vue的响应式开发比命令式有什么好处

您只需要描述**应用状态 (State) 和视图 (View) 之间的映射关系** (`template`)。当状态改变时，框架（Vue）会自动处理 DOM 的更新

Vue 的响应式系统配合 Virtual DOM 和 Diff 算法，能够**高效、精确地找到需要更新的最小 DOM 变化集**，避免了不必要的 DOM 操作，从而提高了应用性能。

#### 说说装饰器

#### Vue 中如何保持组件状态，避免重复渲染（比如在路由切换时）？

主要通过 Vue 的内置抽象组件 **`<keep-alive>`** 来实现。

作用： ` <keep-alive>` 包裹动态组件或路由组件时，会**缓存不活动的组件实例**，而不是销毁它们。这可以避免组件在切换时被重复创建和渲染，从而**保持组件的状态**（如表单输入内容、滚动位置等），并提升性能。

实现原理与钩子函数

1. **缓存**：当组件被 `<keep-alive>` 缓存后，其 `destroy` 生命周期钩子不会触发。

2. **新增钩子**：被缓存的组件会新增两个特殊的生命周期钩子：
   
   - **`activated()`**：组件被激活时（切换进来）触发。
   
   - **`deactivated()`**：组件被停用时（切换出去）触发。

#### Vue 2 和 Vue 3 在数据响应式原理上有哪些主要的区别？为什么 Vue 3 要改用 Proxy？

vue2 递归地为所有嵌套属性添加 getter/setter，初始化时开销较大。
vue3 proxy **惰性**地进行响应式处理，只在访问时才递归处理，初始化更快

#### <mark>描述一下 Vue 的渲染过程（从模板到最终的 DOM）</mark>

总结：

初次：1编译模板（解析AST+标记+生成渲染函数）2执行渲染函数生成VDOM 3 渲染

后续数据更新：1 执行渲染函数生成新VDOM 2 diff获得patch 3 更新DOM

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

#### Vue Router 的工作原理是什么？常用的路由模式（Hash 和 History）有什么区别？

Vue Router 的核心是监听 URL 的变化，并根据配置的路由映射表，动态地渲染对应的组件。

1. **路由映射 (Route Mapping)**：定义 URL 路径 (`path`) 与组件 (`component`) 的映射关系。

2. **监听 URL 变化**：根据配置的模式（Hash 或 History），监听浏览器地址栏 URL 的变化事件。

3. **匹配路由**：当 URL 变化时，Router 捕获新 URL，并在路由映射表中查找匹配的配置。

4. **渲染组件**：将匹配到的组件渲染到 `<router-view>` 占位符的位置上。

hash 依赖 URL 中的 **Hash 变化**，使用 `window.onhashchange` 事件监听。利用 `#` 变化不会触发页面加载和服务器请求的特性实现SPA内部跳转

history 依赖 HTML5 的 **History API** (`pushState`, `replaceState`)。SPA内部跳转用history.pushState实现

#### 如何自定义一个 Vue 指令 (`directive`)？请举例说明其常用的钩子函数

自定义指令用于对 DOM 元素进行**底层操作**，实现可复用的 DOM 行为。例如：自动获取焦点、权限控制、拖拽功能等。

```js
// main.js
import { createApp } from 'vue'
import App from './App.vue'
const app = createApp(App)

// 注册一个全局自定义指令 v-focus
app.directive('focus', {
  // 元素挂载到 DOM 时调用
  mounted(el) {
    el.focus() // 使元素自动获取焦点
  }
})

app.mount('#app')

//组件内用directives注册
```

#### 如何对 Vue 应用进行性能优化？

运行时性能优化 (Runtime Performance)

1. **合理使用 `v-if` 和 `v-show`**：
   
   - **`v-if`**：真正销毁/重建组件，适用于不频繁切换的场景。
   
   - **`v-show`**：仅切换 CSS `display` 属性，适用于频繁切换的场景。

2. **`v-for` 必须使用 `key`**：帮助 Vue Diff 算法更高效地进行元素追踪和复用。

3. **使用 `v-once`**：对于内容不依赖数据的静态子树，使用 `v-once` 只渲染一次，避免了后续的更新开销。

4. **组件拆分和懒加载 (Async Components)**：将大组件拆分为小组件，并使用动态 `import()` 实现组件的按需加载。

5. 精准依赖，对store或外部属性，精准引入，依靠vue对响应式数据的优化

6. **大列表优化 (虚拟滚动/Virtual Scrolling)**：对于包含数千个项目的长列表，只渲染可见区域的 DOM，大幅减少 DOM 节点数量。

7. **合理使用 `computed` vs `watch`**：`computed` 具有缓存机制，只有依赖项变化时才会重新计算，比 `watch` 更高效。

8. **使用 Vue 3 的 `shallowRef` (如果可以)**：对于嵌套层级很深但我们只关心顶层引用的数据，使用 `shallowRef` 来减少不必要的深度响应式处理。

加载性能优化 (Loading Performance)

1. **路由懒加载**：使用 `const route = () => import('./components/Path')`，将不同路由组件的代码分割成不同的 chunk，实现按需加载。

2. **第三方库按需引入**：如使用 Babel 插件或 Vite 插件，对 Element-UI/Plus、Ant Design Vue 等库进行按需导入，而不是全量导入。

3. 以及其他性能优化手段

#### <mark> 谈谈你在项目中遇到的 Vue 相关的挑战或难题，以及你是如何解决的？</mark>

#### nexttick原理

在下次 DOM 更新循环结束之后执行延迟回调，以确保您在回调中操作的是最新的 DOM。利用js的时间循环，当调用 `this.$nextTick(callback)` 时，Vue 会将 `callback` 作为一个**微任务**推入微任务队列。

（**VUE的DOM更新也是在微任务里完成的，数据变化 —> 触发 Setter —> 派发更新—> 收集到 Watcher —> watcher将渲染更新任务推入浏览器的微任务队列**）

#### Vue3 的 Composition API setup() 里响应式丢失是什么原因，怎么解决

常发生在解构（Destructuring）**或**展开（Spreading）响应式对象时。

```javascript
const state = reactive({
  count: 0, // 这是一个被 Proxy 追踪的属性
  name: 'Alice'
});

// --- ❌ 错误做法：响应式丢失 ---
// 解构：将 state.count 的原始值赋给了新的局部变量 count。
// 这两个变量已经没有任何关联。
const { count, name } = state;
```

解决方案：`toRefs` 或直接引用

```javascript
const { count, name } = toRefs(state) 
// 或者直接用
state.count
```
