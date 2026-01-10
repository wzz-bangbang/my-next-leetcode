###### 谈谈你对 React 的了解
###### React 中 keys 的作用是什么
###### 说说对受控组件和非受控组件的理解，以及应用场景
###### Redux中的connect有什么作用?
###### 说说你对immutable的理解?如何应用在react项目中
###### 说说React服务端渲染怎么做?原理是什么?
###### 什么是无状态组件，与有状态组件的区别？它们的本质区别是什么？现在还推荐这样区分吗？

无状态组件通常指的是不维护自身状态、只依赖 props 渲染 UI 的组件，更多用于展示型组件。

有状态组件则是指内部维护 state，并负责业务逻辑或交互行为的组件。

在早期 React 中，无状态组件通常是函数组件，有状态组件通常是类组件；但在 Hooks 引入之后，这种区分已经不再严格适用，函数组件同样可以是有状态组件。

现代 React 更推荐从组件职责和状态归属的角度进行设计，而不是强调组件是否“有状态”。

###### 为什么虚拟 DOM 会提高性能? 一定能提高性能吗？

虚拟 DOM 本质上是用 JavaScript 对象描述 UI 结构的抽象层。

它提升性能的核心在于通过 diff 算法精确计算出最小化的 DOM 更新，并将多次状态变更合并后，在 commit 阶段一次性、有序地更新真实 DOM，从而减少不必要的重排和重绘。

在列表场景中，key 可以帮助 React 高效地复用节点，进一步提升更新效率。

但虚拟 DOM 并不一定在所有场景下都更快，例如页面几乎不发生变化、DOM 结构极其简单，或者高频动画、Canvas 等场景下，虚拟 DOM 的计算成本反而可能成为额外开销。

###### 说说react中引入css的方式有哪几种?区别?
###### 怎么给 children 添加额外的属性？
###### 对比类组件和函数组件，有什么本质区别？代码层面如何判断
###### React 组件高度抽象和复用的自由有没有代价？

###### 为什么说react更适合B端大型项目

###### React 组合能力强会带来哪些坑？
###### 为什么说react的组件和逻辑抽象和复用比vue强
###### 组件状态保存keep-alive怎么用？原理是什么？

###### 路由懒加载原理

###### react的link标签和a标签的区别

###### 分别讲讲react16 17 18 19新特性

###### 什么是jsx? 为什么浏览器无法读取 JSX
###### 说说jsx转DOM过程和原理

###### react diff算法核心，和vue的diff有什么区别

###### 讲讲react项目的性能优化

###### 说说你对 React Hook的闭包陷阱的理解，有哪些解决方案

React Hook 的闭包陷阱，本质上是**函数组件在某一次 render 时创建的回调函数，会捕获当次 render 的状态快照**。  
如果这个回调在之后被异步执行（如 effect、事件、定时器），即使组件已经重新 render，回调内部拿到的仍然是**旧作用域里的变量**。

产生原因
1. **函数组件不是实例**，每次 render 都是一次新的函数执行
2. Hook 回调（useEffect / useCallback 等）**绑定的是创建时的作用域**
3. 依赖数组为空或不完整时，React 不会重新创建这个回调
4. 导致回调中使用的 state / props 永远停留在旧值

常见的解决方案包括：
1. 正确声明依赖数组，确保状态变化时重新创建回调
2. 使用函数式 setState，避免依赖外部状态
3. 使用 useRef 保存最新值，因为 ref 在多次 render 之间保持同一个引用，可以绕开闭包快照问题

###### 说说 hooks 的思想和原理

###### react hook如何以链表存储

###### 为什么hook只能写在顶层

###### 看过 hooks 相关的草案吗

###### 说说react里你常用的hook

###### React 中 refs 的作用是什么
###### useRef和useState的区别

useRef 返回的是一个普通的可变对象 `{ current }`，  这个对象在组件的多次 render 之间**不会被重新创建**，闭包捕获的是这个对象本身，而不是某次 render 的值快照，因此通过 `ref.current` 访问到的始终是最新写入的值。
###### 为什么usestate返回数组而不是对象

###### useState如何实现？怎么获得下一次更新后的值

###### 调用 setState 之后发生了什么
###### setState 何时同步何时异步?

###### useEffect是如何实现的？

###### useLayoutEffect和useEffect的区别

###### useEffect为什么不支持async await？怎么解决？

useEffect 不能直接写成 async，是因为 effect 的返回值会被 React 当作清理函数，在组件卸载或 effect 重新执行前同步调用。而 async 函数一定返回 Promise，React 不会也不能去 await 这个 Promise，因此无法作为合法的 cleanup。

如果需要在 effect 中使用 async / await，正确做法是在 effect 内部定义并立即执行一个 async 函数，保证 effect 本身的返回值仍然是清理函数或 undefined。

###### React.memo 是做什么的？为什么它通常需要和 useMemo / useCallback 配合使用？

React.memo 是一个用于函数组件的性能优化手段，它通过对 props 做浅比较，在父组件重新渲染时，如果子组件的 props 没有发生引用层面的变化，就跳过子组件的重新渲染。

由于对象和函数在每次 render 时都会产生新的引用，因此通常需要配合 useMemo 和 useCallback 来稳定 props 的引用，否则 React.memo 很容易失效。

同时，React.memo 也并非适用于所有场景，如果组件本身渲染成本很低，或者 props 变化频繁，使用 memo 反而可能带来额外的比较开销。

###### React.memo的第二个参数是什么 作用

###### ref useRef forwardRef 区别和作用

###### useContext是什么作用？有什么优缺点？

useContext 用于在组件树中跨层级共享数据，主要解决 props drilling 的问题，而不是以性能优化为目标。

它的优点是让数据传递更加清晰，适合全局性、低频变化的状态。

缺点在于，当 Context 的 value 发生变化时，所有消费该 Context 的组件都会重新渲染，更新粒度较粗，如果使用不当可能带来性能问题。

常见的优化方式包括拆分 Context、保持 value 引用稳定，以及在复杂场景下配合 selector 或专门的状态管理库使用。

###### 说说useReducer是什么怎么用

###### 对比useReducer和useState

###### 18以前为什么useState不能批量更新，18以后为什么可以？

 18以前在浏览器原生事件（如 setTimeout、Promise 回调、addEventListener 内部）中，React 认为已经脱离了控制流，也就是他们的回调是在一个全新的、异步的、与 React 渲染无关的执行上下文中运行的，所以setstate无法批量更新

######  react自定义hooks 和 Vue3 composable 本质区别？

###### React Fiber是什么?  说说fiber 架构的工作原理?
###### 为什么react需要 fiber架构，而Vue却不需要?
###### 讲讲React Fiber 是如何实现更新过程可控的



###### react如何确定具体场景的执行优先级

###### fiber怎么进行任务的终止和恢复的？为什么不直接使用requestldleCallback?

 React Fiber 通过把一次渲染拆分成多个小的工作单元（Fiber Node），使渲染过程变成**可中断、可恢复的增量执行过程**。
 
在渲染阶段，React 每次只处理一个 Fiber 节点，处理完成后会判断当前时间片是否用尽，如果有更高优先级任务或者时间不够，就主动让出主线程。
 
 中断时，React 会保存当前的 `workInProgress Fiber`，等下次调度继续从这个 Fiber 节点开始执行，而不是从头重新渲染整棵树。
 
 React 并不是直接依赖浏览器调度，而是自己实现了一套 Scheduler。  通过MessageChannel 来创建一个**稳定、可控、优先级更高的异步调度入口**，用来触发一次新的调度循环，而不是用来通信任务完成状态。

requestIdleCallback 的最大问题是：  **调度时机完全由浏览器决定，React 无法精确控制优先级和执行时长。**
回调时机不可预测：浏览器“觉得”空闲才会调用，在动画、输入密集时可能长期不执行
优先级控制能力弱：只区分是否空闲而没有优先级
与 React 的调度模型不匹配：React 需要在不同优先级任务之间频繁切换，rIC 不适合高频、精细的任务切分

总结：Fiber 的本质是把同步、不可中断的递归渲染，改造成基于 Fiber Node 的可中断工作流；React 通过自建 Scheduler 控制调度节奏，而不是把渲染节奏完全交给浏览器。
###### 详细说说fiber架构的commit阶段过程

###### 详细说说fiber架构的render阶段过程

###### react如何实现时间切片

###### fiber为什么是性能飞跃

###### redux的使用原则

###### 说说 Redux的核心方法和工作流程
###### redux的优缺点
###### 说说对Redux中间件的理解?常用的中间件有哪些?实现原理?
###### Redux中异步的请求怎么处理
###### React中组件之间进行数据通信有哪些方式？
###### 除了 redux mbox dva 还用过其他的 状态管理没

###### 对比redux zustand

###### 说说react的事件代理机制原理和优缺点

###### 说说react事件和浏览器原生事件执行先后顺序，为什么？
###### react的事件为什么要委托，有什么好处？
###### react事件委托如何解决模态框的事件冒泡？
###### react17 之后的事件机制有什么区别？

###### 子组件portal能冒泡到父组件吗

